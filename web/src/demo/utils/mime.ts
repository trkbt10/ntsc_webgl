/** MIME type constants & utilities — SoT for all format/extension handling */

// ── Photo formats ──
export const PHOTO_MIME = "image/png" as const;
export const THUMBNAIL_MIME = "image/jpeg" as const;

// ── Video format candidates (ordered by preference) ──
export const VIDEO_MIME_CANDIDATES: Record<string, string[]> = {
  webm: [
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp8",
    "video/webm",
  ],
  mp4: [
    "video/mp4;codecs=avc1",
    "video/mp4",
  ],
};

const ALL_VIDEO_CANDIDATES = Object.values(VIDEO_MIME_CANDIDATES).flat();

// ── Extension mapping ──
const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "video/webm": "webm",
  "video/mp4": "mp4",
};

/** Get file extension for a MIME type */
export function extForMime(mimeType: string): string {
  // Match base type (strip codecs)
  const base = mimeType.split(";")[0];
  return MIME_TO_EXT[base] ?? "bin";
}

// ── MediaRecorder support detection ──

function isSupported(mime: string): boolean {
  try {
    return typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime);
  } catch {
    return false;
  }
}

/** Whether any recording format is supported */
export function canRecord(): boolean {
  if (typeof MediaRecorder === "undefined") return false;
  return ALL_VIDEO_CANDIDATES.some(isSupported);
}

/** Returns supported recording formats for UI display */
export function getSupportedFormats(): { format: string; mimeType: string }[] {
  const results: { format: string; mimeType: string }[] = [];
  for (const [format, candidates] of Object.entries(VIDEO_MIME_CANDIDATES)) {
    for (const mime of candidates) {
      if (isSupported(mime)) {
        results.push({ format, mimeType: mime });
        break;
      }
    }
  }
  return results;
}

/**
 * Pick the best MIME type for a requested format.
 * "auto": first supported from all candidates
 * "webm"/"mp4": first supported for that format, falls back to auto
 */
export function pickVideoMime(preferredFormat: string = "auto"): string {
  if (preferredFormat !== "auto") {
    const candidates = VIDEO_MIME_CANDIDATES[preferredFormat];
    if (candidates) {
      for (const mime of candidates) {
        if (isSupported(mime)) return mime;
      }
    }
  }
  for (const mime of ALL_VIDEO_CANDIDATES) {
    if (isSupported(mime)) return mime;
  }
  return "video/webm";
}

// ── Download filename ──

/** Generate a download filename for a media entry */
export function mediaFilename(type: "photo" | "video", timestamp: number, mimeType: string): string {
  return `ntsc-${type}-${timestamp}.${extForMime(mimeType)}`;
}
