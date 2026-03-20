import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { MediaEntry, CaptureMode } from "../media-store-types";
import type { CamcorderDisplayState } from "../camcorder-settings";
import { useMediaStore } from "../hooks/useMediaStore";
import { usePhotoCapture, generateThumbnail } from "../hooks/usePhotoCapture";
import { useBlobUrl, downloadBlob } from "../hooks/useBlobUrl";
import { useViewTransition } from "../hooks/useViewTransition";
import { mediaFilename } from "../utils/mime";
import { createMediaEntry } from "../utils/media-entry";

interface MediaContextValue {
  entries: MediaEntry[];
  count: number;
  latestThumbnailUrl: string | null;
  captureMode: CaptureMode;
  toggleMode: () => void;
  capturePhoto: (canvas: HTMLCanvasElement) => Promise<void>;
  saveVideoRecording: (blob: Blob, mimeType: string, canvas: HTMLCanvasElement) => Promise<void>;
  deleteEntry: (id: string) => void;
  downloadEntry: (entry: MediaEntry) => void;
  galleryOpen: boolean;
  openGallery: () => void;
  closeGallery: () => void;
  recFps: number;
  recBitrate: number;
  recFormat: string;
}

const Ctx = createContext<MediaContextValue | null>(null);

export function useMedia(): MediaContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMedia must be used within MediaProvider");
  return ctx;
}

interface MediaProviderProps {
  camcorderState: CamcorderDisplayState;
  children: ReactNode;
}

export function MediaProvider({ camcorderState, children }: MediaProviderProps) {
  const store = useMediaStore();
  const { capturePhoto: rawCapturePhoto } = usePhotoCapture();
  const { startTransition } = useViewTransition();

  const latestThumbnailUrl = useBlobUrl(store.latestThumbnail, store.latestId ?? undefined);

  const thumbWidth = camcorderState.thumbWidth;
  const thumbQuality = camcorderState.thumbQuality;

  const [captureMode, setCaptureMode] = useState<CaptureMode>("video");
  const toggleMode = useCallback(() => {
    startTransition(() => setCaptureMode((m) => m === "video" ? "photo" : "video"));
  }, [startTransition]);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const openGallery = useCallback(() => {
    startTransition(() => setGalleryOpen(true));
  }, [startTransition]);
  const closeGallery = useCallback(() => {
    startTransition(() => setGalleryOpen(false));
  }, [startTransition]);

  const capturePhoto = useCallback(async (canvas: HTMLCanvasElement) => {
    const entry = await rawCapturePhoto(canvas, { width: thumbWidth, quality: thumbQuality });
    startTransition(() => { store.addEntry(entry); });
  }, [rawCapturePhoto, store, startTransition, thumbWidth, thumbQuality]);

  const saveVideoRecording = useCallback(async (blob: Blob, mimeType: string, canvas: HTMLCanvasElement) => {
    const thumbnail = await generateThumbnail(canvas, { width: thumbWidth, quality: thumbQuality });
    startTransition(() => {
      store.addEntry(createMediaEntry("video", blob, thumbnail, canvas, mimeType));
    });
  }, [store, startTransition, thumbWidth, thumbQuality]);

  const deleteEntry = useCallback((id: string) => {
    startTransition(() => { store.deleteEntry(id); });
  }, [store, startTransition]);

  const downloadEntry = useCallback((entry: MediaEntry) => {
    downloadBlob(entry.blob, mediaFilename(entry.type, entry.timestamp, entry.mimeType));
  }, []);

  const value: MediaContextValue = {
    entries: store.entries,
    count: store.count,
    latestThumbnailUrl,
    captureMode,
    toggleMode,
    capturePhoto,
    saveVideoRecording,
    deleteEntry,
    downloadEntry,
    galleryOpen,
    openGallery,
    closeGallery,
    recFps: camcorderState.recFps,
    recBitrate: camcorderState.recBitrate,
    recFormat: camcorderState.recFormat,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
