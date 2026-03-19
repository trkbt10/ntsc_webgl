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

export function useCanvasRecorder(canvas: HTMLCanvasElement | null) {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = useCallback(() => {
    if (!canvas || !canRecord()) return;
    const stream = canvas.captureStream(30);
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ntsc-recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    };
    recorder.start(1000); // collect data every second
    recorderRef.current = recorder;
    setRecording(true);
  }, [canvas]);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    setRecording(false);
  }, []);

  const toggle = useCallback(() => {
    if (recording) stop();
    else start();
  }, [recording, start, stop]);

  return { recording, toggle, canRecord: canRecord() };
}
