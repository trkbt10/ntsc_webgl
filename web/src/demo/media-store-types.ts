export type CaptureMode = "photo" | "video";

export interface MediaEntry {
  id: string;
  type: CaptureMode;
  blob: Blob;
  thumbnail: Blob;
  timestamp: number;
  size: number;
  width: number;
  height: number;
  duration?: number;
  mimeType: string;
}
