import { useState, useEffect, useMemo, useRef } from "react";
import { NtscCanvas } from "../components/NtscCanvas";
import { CameraErrorView } from "../components/CameraErrorView";
import { ViewfinderLayout, type LayoutPreset } from "../components/layout";
import { CamcorderMenu } from "../components/CamcorderMenu";
import { useNtscPipeline } from "../hooks/useNtscPipeline";
import { useCamera } from "../hooks/useCamera";
import { useCanvasRecorder } from "../hooks/useCanvasRecorder";
import { useBattery } from "../hooks/useBattery";
import { useOrientation } from "../hooks/useOrientation";
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

export function VideoCamPage() {
  const { canvasRef, pipeline, ready, error: pipelineError, fps } = useNtscPipeline();
  const { videoRef, cameraReady, cameraError, flipCamera, cameraInfo, audioStream } = useCamera({ enabled: ready, audio: true });
  const battery = useBattery();
  const orientation = useOrientation();

  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const combinedCanvasRef = (node: HTMLCanvasElement | null) => {
    canvasElRef.current = node;
    canvasRef(node);
  };

  const { recording, toggle: toggleRecording, canRecord: recordingSupported } = useCanvasRecorder(canvasElRef.current);

  const [paramValues, setParamValues] = useState<ParamState>(DEFAULT_PARAMS);
  const [activePreset, setActivePreset] = useState(DEFAULT_PRESET_NAME);
  const params = useMemo(
    () => createParamHandlers(pipeline, setParamValues, setActivePreset),
    [pipeline],
  );

  const [layoutPreset, setLayoutPreset] = useState<LayoutPreset>("classic");
  const [camcorderState, setCamcorderState] = useState<CamcorderDisplayState>(DEFAULT_CAMCORDER_STATE);

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

      {/* Viewfinder layout — ALL UI elements positioned by preset */}
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
      />

      {/* MENU button + settings overlay */}
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

      {!ready && (
        <div style={{ position: "fixed", inset: 0, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Loading...</div>
        </div>
      )}
    </div>
  );
}
