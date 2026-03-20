import { useState, useRef, useCallback } from "react";
import { downloadBlob } from "./useBlobUrl";
import { canRecord, pickVideoMime, mediaFilename } from "../utils/mime";

export { canRecord };

export interface CanvasRecorderOptions {
  onComplete?: (blob: Blob, mimeType: string) => void;
  fps?: number;
  bitrate?: number;
  format?: string;
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

  const start = useCallback(() => {
    if (!canvas || !canRecord()) return;
    const stream = canvas.captureStream(fps);
    const mimeType = pickVideoMime(format);
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: bitrate });
    chunksRef.current = [];
    startTimeRef.current = Date.now();
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      if (onComplete) {
        onComplete(blob, mimeType);
      } else {
        downloadBlob(blob, mediaFilename("video", Date.now(), mimeType));
      }
    };
    recorder.start(1000);
    recorderRef.current = recorder;
    setRecording(true);
  }, [canvas, onComplete, fps, bitrate, format]);

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
