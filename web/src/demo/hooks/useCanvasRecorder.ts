import { useState, useRef, useCallback } from "react";
import { downloadBlob } from "./useBlobUrl";
import { canRecord, pickVideoMime, mediaFilename } from "../utils/mime";

export { canRecord };

export interface CanvasRecorderOptions {
  onComplete?: (blob: Blob, mimeType: string) => void;
  fps?: number;
  bitrate?: number;
  format?: string;
  audioStream?: MediaStream | null;
  audioEnabled?: boolean;
}

export function useCanvasRecorder(canvas: HTMLCanvasElement | null, options?: CanvasRecorderOptions) {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const onComplete = options?.onComplete;
  const fps = options?.fps ?? 30;
  const bitrate = options?.bitrate ?? 4_000_000;
  const format = options?.format ?? "auto";
  const audioStream = options?.audioStream;
  const audioEnabled = options?.audioEnabled ?? true;

  const start = useCallback(() => {
    if (!canvas || !canRecord()) return;

    let stream: MediaStream;
    try {
      stream = canvas.captureStream(fps);
    } catch (e) {
      console.warn("captureStream failed:", e);
      return;
    }

    // Mix in audio tracks from the camera if available and enabled
    if (audioEnabled && audioStream) {
      try {
        for (const track of audioStream.getAudioTracks()) {
          if (track.readyState === "live") stream.addTrack(track);
        }
      } catch (e) {
        console.warn("Could not mix audio into recording:", e);
      }
    }

    const preferredMime = pickVideoMime(format);
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: preferredMime, videoBitsPerSecond: bitrate });
    } catch {
      try {
        recorder = new MediaRecorder(stream, { videoBitsPerSecond: bitrate });
      } catch {
        recorder = new MediaRecorder(stream);
      }
    }

    // SoT: use recorder.mimeType as the actual format, not the requested one
    const actualMime = recorder.mimeType || preferredMime;

    chunksRef.current = [];
    startTimeRef.current = Date.now();
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: actualMime });
      if (onComplete) {
        onComplete(blob, actualMime);
      } else {
        downloadBlob(blob, mediaFilename("video", Date.now(), actualMime));
      }
    };
    recorder.start(1000);
    recorderRef.current = recorder;
    setRecording(true);
  }, [canvas, onComplete, fps, bitrate, format, audioStream, audioEnabled]);

  const stop = useCallback(() => {
    const duration = Date.now() - startTimeRef.current;
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    setRecording(false);
    return duration;
  }, []);

  const toggle = useCallback(() => {
    if (recording) stop();
    else start();
  }, [recording, start, stop]);

  return { recording, toggle, stop, canRecord: canRecord() };
}
