import { useState, useRef, useCallback } from "react";

/**
 * Records the NTSC-processed output from a canvas element using MediaRecorder.
 * This captures what the user actually sees (the processed video), not the raw camera.
 */

/** Check if MediaRecorder is available and can record video */
export function canRecord(): boolean {
  if (typeof MediaRecorder === "undefined") return false;
  try {
    return MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
      || MediaRecorder.isTypeSupported("video/webm")
      || MediaRecorder.isTypeSupported("video/mp4");
  } catch {
    return false;
  }
}

function pickMimeType(): string {
  for (const mime of [
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ]) {
    try {
      if (MediaRecorder.isTypeSupported(mime)) return mime;
    } catch { /* skip */ }
  }
  return "video/webm";
}

export interface CanvasRecorderOptions {
  onComplete?: (blob: Blob, mimeType: string) => void;
}

export function useCanvasRecorder(canvas: HTMLCanvasElement | null, options?: CanvasRecorderOptions) {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const start = useCallback(() => {
    if (!canvas || !canRecord()) return;
    const stream = canvas.captureStream(30);
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 });
    chunksRef.current = [];
    startTimeRef.current = Date.now();
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      if (optionsRef.current?.onComplete) {
        optionsRef.current.onComplete(blob, mimeType);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ntsc-recording-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      }
    };
    recorder.start(1000);
    recorderRef.current = recorder;
    setRecording(true);
  }, [canvas]);

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
