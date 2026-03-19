import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { NtscCanvas } from "../components/NtscCanvas";
import { CameraErrorView } from "../components/CameraErrorView";
import { ViewfinderLayout, type LayoutPreset } from "../components/layout";
import { CamcorderMenu } from "../components/CamcorderMenu";
import { GalleryModal } from "../components/gallery";
import { useNtscPipeline } from "../hooks/useNtscPipeline";
import { useCamera } from "../hooks/useCamera";
import { useCanvasRecorder } from "../hooks/useCanvasRecorder";
import { useBattery } from "../hooks/useBattery";
import { useOrientation } from "../hooks/useOrientation";
import { useMediaStore } from "../hooks/useMediaStore";
import { usePhotoCapture } from "../hooks/usePhotoCapture";
import { useViewTransition } from "../hooks/useViewTransition";
import {
  DEFAULT_PARAMS,
  DEFAULT_PRESET_NAME,
  createParamHandlers,
  type ParamState,
} from "../presets";
import {
  DEFAULT_CAMCORDER_STATE,
  type CamcorderDisplayState,
} from "../camcorder-settings";
import type { CaptureMode } from "../media-store-types";

export function VideoCamPage() {
  const { canvasRef, pipeline, ready, error: pipelineError, fps } = useNtscPipeline();
  const { videoRef, cameraReady, cameraError, flipCamera, cameraInfo, audioStream } = useCamera({ enabled: ready, audio: true });
  const battery = useBattery();
  const orientation = useOrientation();
  const { startTransition } = useViewTransition();

  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const combinedCanvasRef = (node: HTMLCanvasElement | null) => {
    canvasElRef.current = node;
    canvasRef(node);
  };

  // Media store (IndexedDB)
  const mediaStore = useMediaStore();
  const { capturePhoto } = usePhotoCapture();

  // Capture mode
  const [captureMode, setCaptureMode] = useState<CaptureMode>("video");
  const toggleMode = useCallback(() => {
    startTransition(() => {
      setCaptureMode((m) => m === "video" ? "photo" : "video");
    });
  }, [startTransition]);

  // Photo capture handler
  const handleCapturePhoto = useCallback(async () => {
    const canvas = canvasElRef.current;
    if (!canvas) return;
    const entry = await capturePhoto(canvas);
    startTransition(() => {
      mediaStore.addEntry(entry);
    });
  }, [capturePhoto, mediaStore.addEntry, startTransition]);

  // Video recording with IndexedDB storage
  const handleVideoComplete = useCallback(async (blob: Blob, mimeType: string) => {
    const canvas = canvasElRef.current;
    if (!canvas) return;

    const thumbW = 160;
    const ratio = thumbW / canvas.width;
    const thumbH = Math.round(canvas.height * ratio);
    const offscreen = document.createElement("canvas");
    offscreen.width = thumbW;
    offscreen.height = thumbH;
    const ctx = offscreen.getContext("2d")!;
    ctx.drawImage(canvas, 0, 0, thumbW, thumbH);
    const thumbnail = await new Promise<Blob>((resolve, reject) => {
      offscreen.toBlob(
        (b) => b ? resolve(b) : reject(new Error("toBlob failed")),
        "image/jpeg", 0.7,
      );
    });

    startTransition(() => {
      mediaStore.addEntry({
        id: crypto.randomUUID(),
        type: "video",
        blob,
        thumbnail,
        timestamp: Date.now(),
        size: blob.size,
        width: canvas.width,
        height: canvas.height,
        mimeType,
      });
    });
  }, [mediaStore.addEntry, startTransition]);

  const { recording, toggle: toggleRecording, canRecord: recordingSupported } = useCanvasRecorder(
    canvasElRef.current,
    { onComplete: handleVideoComplete },
  );

  const [paramValues, setParamValues] = useState<ParamState>(DEFAULT_PARAMS);
  const [activePreset, setActivePreset] = useState(DEFAULT_PRESET_NAME);
  const params = useMemo(
    () => createParamHandlers(pipeline, setParamValues, setActivePreset),
    [pipeline],
  );

  const [layoutPreset, setLayoutPreset] = useState<LayoutPreset>("classic");
  const [camcorderState, setCamcorderState] = useState<CamcorderDisplayState>(DEFAULT_CAMCORDER_STATE);

  // Gallery modal state
  const [galleryOpen, setGalleryOpen] = useState(false);

  const handleOpenGallery = useCallback(() => {
    startTransition(() => setGalleryOpen(true));
  }, [startTransition]);

  const handleCloseGallery = useCallback(() => {
    startTransition(() => setGalleryOpen(false));
  }, [startTransition]);

  const handleGalleryDelete = useCallback((id: string) => {
    startTransition(() => {
      mediaStore.deleteEntry(id);
    });
  }, [mediaStore.deleteEntry, startTransition]);

  const handleStateChange = (key: string, value: string | number | boolean) => {
    setCamcorderState((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (pipeline) params.applyPreset(DEFAULT_PRESET_NAME);
  }, [pipeline]);

  useEffect(() => {
    if (cameraReady && pipeline && videoRef.current) {
      pipeline.startVideo(videoRef.current);
      return () => pipeline.stopVideo();
    }
  }, [cameraReady, pipeline, videoRef]);

  const fatalError = pipelineError ?? cameraError;
  if (fatalError) {
    return <CameraErrorView pipelineError={pipelineError} cameraError={cameraError} />;
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <NtscCanvas canvasRef={combinedCanvasRef} />

      <ViewfinderLayout
        preset={layoutPreset}
        recording={recording}
        fps={fps}
        batteryLevel={battery.level}
        batterySupported={battery.supported}
        cameraWidth={cameraInfo.width}
        cameraHeight={cameraInfo.height}
        audioChannels={cameraInfo.audioChannels}
        audioStream={audioStream}
        recordingSupported={recordingSupported}
        onFlipCamera={flipCamera}
        onToggleRecord={toggleRecording}
        camcorderState={camcorderState}
        orientation={orientation}
        captureMode={captureMode}
        onToggleMode={toggleMode}
        onCapturePhoto={handleCapturePhoto}
        galleryThumbnail={mediaStore.lastThumbnailUrl}
        galleryCount={mediaStore.count}
        onOpenGallery={handleOpenGallery}
      />

      <CamcorderMenu
        paramValues={paramValues}
        activePreset={activePreset}
        onParamChange={params.set}
        onPresetChange={params.applyPreset}
        overlayPreset={layoutPreset}
        onLayoutPresetChange={setLayoutPreset}
        camcorderState={camcorderState}
        onStateChange={handleStateChange}
      />

      {galleryOpen && (
        <GalleryModal
          entries={mediaStore.entries}
          onClose={handleCloseGallery}
          onDelete={handleGalleryDelete}
        />
      )}

      {!ready && (
        <div style={{ position: "fixed", inset: 0, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Loading...</div>
        </div>
      )}
    </div>
  );
}
