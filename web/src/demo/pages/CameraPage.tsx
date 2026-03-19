import { useState, useEffect, useMemo } from "react";
import { Drawer } from "react-panel-layout";
import { NtscCanvas } from "../components/NtscCanvas";
import { SettingsPanel } from "../components/SettingsPanel";
import { CameraErrorView } from "../components/CameraErrorView";
import { ViewfinderLayout } from "../components/layout";
import { useNtscPipeline } from "../hooks/useNtscPipeline";
import { useCamera } from "../hooks/useCamera";
import { useOrientation } from "../hooks/useOrientation";
import {
  DEFAULT_PARAMS,
  DEFAULT_PRESET_NAME,
  createParamHandlers,
  type ParamState,
} from "../presets";

export function CameraPage() {
  const { canvasRef, pipeline, ready, error: pipelineError, fps } = useNtscPipeline();
  const { videoRef, cameraReady, cameraError, flipCamera, cameraInfo } = useCamera({ enabled: ready });
  const orientation = useOrientation();

  const [paramValues, setParamValues] = useState<ParamState>(DEFAULT_PARAMS);
  const [activePreset, setActivePreset] = useState(DEFAULT_PRESET_NAME);
  const params = useMemo(
    () => createParamHandlers(pipeline, setParamValues, setActivePreset),
    [pipeline],
  );

  const [settingsOpen, setSettingsOpen] = useState(false);

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
      <NtscCanvas canvasRef={canvasRef} />

      {/* Uses "none" preset: controls only, no decorative frame */}
      <ViewfinderLayout
        preset="none"
        recording={false}
        fps={fps}
        batteryLevel={null}
        batterySupported={false}
        cameraWidth={cameraInfo.width}
        cameraHeight={cameraInfo.height}
        audioChannels={cameraInfo.audioChannels}
        audioStream={null}
        recordingSupported={false}
        onFlipCamera={flipCamera}
        onToggleRecord={() => {}}
        orientation={orientation}
      />

      {!ready && (
        <div style={{ position: "fixed", inset: 0, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Loading...</div>
        </div>
      )}

      {/* Settings button — part of this page's specific UI */}
      <button
        onClick={() => setSettingsOpen((prev) => !prev)}
        title="Settings"
        style={{
          position: "fixed", bottom: "3%", right: "5%",
          width: 48, height: 48, borderRadius: "50%",
          border: "none",
          background: settingsOpen ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)",
          color: "#fff", fontSize: 22, cursor: "pointer",
          zIndex: 20,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        &#x2699;
      </button>

      <Drawer
        id="camera-settings"
        config={{
          anchor: "bottom", dismissible: true, chrome: false,
          swipeGestures: { swipeClose: true, edgeSwipeOpen: false, dismissThreshold: 0.3 },
        }}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpen={() => setSettingsOpen(true)}
        zIndex={30}
      >
        <div style={{
          background: "rgba(20, 20, 20, 0.92)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px 16px 0 0", overflowY: "auto", maxHeight: "60vh",
        }}>
          <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.3)", borderRadius: 2, margin: "10px auto 6px" }} />
          <SettingsPanel
            params={paramValues}
            activePreset={activePreset}
            onParamChange={params.set}
            onPresetChange={params.applyPreset}
          />
        </div>
      </Drawer>
    </div>
  );
}
