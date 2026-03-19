import { useCallback } from "react";
import type { MediaEntry } from "../media-store-types";

const THUMB_WIDTH = 160;

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("toBlob failed")),
      type,
      quality,
    );
  });
}

function generateThumbnail(source: HTMLCanvasElement): Promise<Blob> {
  const ratio = THUMB_WIDTH / source.width;
  const thumbH = Math.round(source.height * ratio);
  const offscreen = document.createElement("canvas");
  offscreen.width = THUMB_WIDTH;
  offscreen.height = thumbH;
  const ctx = offscreen.getContext("2d")!;
  ctx.drawImage(source, 0, 0, THUMB_WIDTH, thumbH);
  return canvasToBlob(offscreen, "image/jpeg", 0.7);
}

export function usePhotoCapture() {
  const capturePhoto = useCallback(async (canvas: HTMLCanvasElement): Promise<MediaEntry> => {
    const blob = await canvasToBlob(canvas, "image/png");
    const thumbnail = await generateThumbnail(canvas);

    return {
      id: crypto.randomUUID(),
      type: "photo",
      blob,
      thumbnail,
      timestamp: Date.now(),
      size: blob.size,
      width: canvas.width,
      height: canvas.height,
      mimeType: "image/png",
    };
  }, []);

  return { capturePhoto };
}
