import { useState, useEffect, useMemo, useCallback } from "react";
import { NtscCanvas } from "../components/NtscCanvas";
import { CameraErrorView } from "../components/CameraErrorView";
import { ViewfinderLayout, type LayoutPreset } from "../components/layout";
import { CamcorderMenu } from "../components/camcorder-menu";
import { Z } from "../design-tokens";
import { GalleryModal } from "../components/gallery";
import { useNtscPipeline } from "../hooks/useNtscPipeline";
import { useCamera } from "../hooks/useCamera";
import { useCanvasRecorder } from "../hooks/useCanvasRecorder";
import { useBattery } from "../hooks/useBattery";
import { useOrientation } from "../hooks/useOrientation";
import { MediaProvider, useMedia } from "../contexts/MediaContext";
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

function VideoCamInner({ camcorderState, onStateChange }: {
  camcorderState: CamcorderDisplayState;
  onStateChange: (key: string, value: string | number | boolean) => void;
}) {
  const { canvasRef, pipeline, ready, error: pipelineError, fps } = useNtscPipeline();
  const { videoRef, cameraReady, cameraError, flipCamera, cameraInfo, audioStream } = useCamera({
    enabled: ready,
    audio: true,
    resolution: camcorderState.cameraResolution,
    inputFps: camcorderState.cameraFps,
  });
  const battery = useBattery();
  const orientation = useOrientation();
  const media = useMedia();

  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const combinedCanvasRef = (node: HTMLCanvasElement | null) => {
    setCanvasEl(node);
    canvasRef(node);
  };

  const handleVideoComplete = useCallback(async (blob: Blob, mimeType: string) => {
    if (!canvasEl) return;
    await media.saveVideoRecording(blob, mimeType, canvasEl);
  }, [media, canvasEl]);

  const { recording, toggle: toggleRecording, canRecord: recordingSupported } = useCanvasRecorder(
    canvasEl,
    { onComplete: handleVideoComplete, fps: media.recFps, bitrate: media.recBitrate, format: media.recFormat, audioStream, audioEnabled: media.recAudio },
  );

  const handleCapturePhoto = useCallback(async () => {
    if (!canvasEl) return;
    await media.capturePhoto(canvasEl);
  }, [media, canvasEl]);

  const [paramValues, setParamValues] = useState<ParamState>(DEFAULT_PARAMS);
  const [activePreset, setActivePreset] = useState(DEFAULT_PRESET_NAME);
  const params = useMemo(
    () => createParamHandlers(pipeline, setParamValues, setActivePreset),
    [pipeline],
  );

  const [layoutPreset, setLayoutPreset] = useState<LayoutPreset>("classic");

  useEffect(() => {
    if (pipeline) params.applyPreset(DEFAULT_PRESET_NAME);
  }, [pipeline, params]);

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
        captureMode={media.captureMode}
        onToggleMode={media.toggleMode}
        onCapturePhoto={handleCapturePhoto}
        galleryThumbnail={media.latestThumbnailUrl}
        galleryCount={media.count}
        onOpenGallery={media.openGallery}
      />

      <CamcorderMenu
        paramValues={paramValues}
        activePreset={activePreset}
        onParamChange={params.set}
        onPresetChange={params.applyPreset}
        overlayPreset={layoutPreset}
        onLayoutPresetChange={setLayoutPreset}
        camcorderState={camcorderState}
        onStateChange={onStateChange}
      />

      {media.galleryOpen && (
        <GalleryModal
          entries={media.entries}
          onClose={media.closeGallery}
          onDelete={media.deleteEntry}
        />
      )}

      {!ready && (
        <div style={{ position: "fixed", inset: 0, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", zIndex: Z.loading }}>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Loading...</div>
        </div>
      )}
    </div>
  );
}

export function VideoCamPage() {
  const [camcorderState, setCamcorderState] = useState<CamcorderDisplayState>(DEFAULT_CAMCORDER_STATE);

  const handleStateChange = useCallback((key: string, value: string | number | boolean) => {
    const NUMERIC_KEYS = ["recFps", "recBitrate", "thumbWidth", "photoQuality"];
    const parsed = typeof value === "string" && NUMERIC_KEYS.includes(key)
      ? Number(value)
      : value;
    setCamcorderState((prev) => ({ ...prev, [key]: parsed }));
  }, []);

  return (
    <MediaProvider camcorderState={camcorderState}>
      <VideoCamInner camcorderState={camcorderState} onStateChange={handleStateChange} />
    </MediaProvider>
  );
}
