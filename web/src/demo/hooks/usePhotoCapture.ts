import { useCallback } from "react";
import type { MediaEntry } from "../media-store-types";
import { DEFAULT_CAMCORDER_STATE } from "../camcorder-settings";
import { PHOTO_MIME, THUMBNAIL_MIME } from "../utils/mime";
import { createMediaEntry } from "../utils/media-entry";

export interface ThumbnailOptions {
  width?: number;
  quality?: number;
  photoMime?: string;
  photoQuality?: number;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("toBlob failed")),
      type,
      quality,
    );
  });
}

export function generateThumbnail(
  source: HTMLCanvasElement,
  opts?: ThumbnailOptions,
): Promise<Blob> {
  const thumbW = opts?.width ?? DEFAULT_CAMCORDER_STATE.thumbWidth;
  const quality = opts?.quality ?? DEFAULT_CAMCORDER_STATE.thumbQuality;
  const ratio = thumbW / source.width;
  const thumbH = Math.round(source.height * ratio);
  const offscreen = document.createElement("canvas");
  offscreen.width = thumbW;
  offscreen.height = thumbH;
  const ctx = offscreen.getContext("2d")!;
  ctx.drawImage(source, 0, 0, thumbW, thumbH);
  return canvasToBlob(offscreen, THUMBNAIL_MIME, quality);
}

export function usePhotoCapture() {
  const capturePhoto = useCallback(async (
    canvas: HTMLCanvasElement,
    thumbOpts?: ThumbnailOptions,
  ): Promise<MediaEntry> => {
    const mime = thumbOpts?.photoMime ?? PHOTO_MIME;
    const blob = await canvasToBlob(canvas, mime, thumbOpts?.photoQuality);
    const thumbnail = await generateThumbnail(canvas, thumbOpts);
    return createMediaEntry("photo", blob, thumbnail, canvas, mime);
  }, []);

  return { capturePhoto };
}
