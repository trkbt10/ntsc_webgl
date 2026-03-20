import type { MediaEntry, CaptureMode } from "../media-store-types";

/** Factory for creating MediaEntry objects — SoT for entry construction */
export function createMediaEntry(
  type: CaptureMode,
  blob: Blob,
  thumbnail: Blob,
  canvas: { width: number; height: number },
  mimeType: string,
  duration?: number,
): MediaEntry {
  return {
    id: crypto.randomUUID(),
    type,
    blob,
    thumbnail,
    timestamp: Date.now(),
    size: blob.size,
    width: canvas.width,
    height: canvas.height,
    mimeType,
    ...(duration != null ? { duration } : {}),
  };
}
