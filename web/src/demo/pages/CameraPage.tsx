import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { Drawer } from "react-panel-layout";
import { NtscCanvas } from "../components/NtscCanvas";
import { SettingsPanel } from "../components/SettingsPanel";
import { useNtscPipeline } from "../hooks/useNtscPipeline";
import {
  DEFAULT_PARAMS,
  DEFAULT_PRESET_NAME,
  createParamHandlers,
  type ParamState,
} from "../presets";

export function CameraPage() {
  const { canvasRef, pipeline, ready, error: pipelineError, fps } = useNtscPipeline();

  const [paramValues, setParamValues] = useState<ParamState>(DEFAULT_PARAMS);
  const [activePreset, setActivePreset] = useState(DEFAULT_PRESET_NAME);
  const params = useMemo(
    () => createParamHandlers(pipeline, setParamValues, setActivePreset),
    [pipeline],
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const facingRef = useRef(facingMode);
  facingRef.current = facingMode;

  useEffect(() => {
    if (pipeline) params.applyPreset(DEFAULT_PRESET_NAME);
  }, [pipeline]);

  const startCamera = useCallback(async (facing: string) => {
    if (!videoRef.current) {
      videoRef.current = document.createElement("video");
      videoRef.current.autoplay = true;
      videoRef.current.playsInline = true;
      videoRef.current.muted = true;
    }
    const v = videoRef.current;
    if (v.srcObject) {
      (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing },
      audio: false,
    });
    v.srcObject = stream;
    await v.play();
    setCameraReady(true);
    setCameraError(null);
  }, []);

  useEffect(() => {
    if (ready) {
      startCamera(facingRef.current).catch((e) => {
        setCameraError(e instanceof Error ? e.message : String(e));
      });
    }
  }, [ready, startCamera]);

  useEffect(() => {
    if (cameraReady && pipeline && videoRef.current) {
      pipeline.startVideo(videoRef.current);
      return () => pipeline.stopVideo();
    }
  }, [cameraReady, pipeline]);

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((t) => t.stop());
      }
    };
  }, []);

  const handleFlip = async () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    try {
      await startCamera(next);
    } catch (e) {
      console.warn("Could not flip camera:", e);
    }
  };

  const fatalError = pipelineError ?? cameraError;
  if (fatalError) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 16,
        }}
      >
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
          {pipelineError ? `Pipeline: ${pipelineError}` : `Camera: ${cameraError}`}
        </div>
        <Link to="/" style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
          Back
        </Link>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <NtscCanvas canvasRef={canvasRef} />

      {!ready && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
            Loading...
          </div>
        </div>
      )}

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <Link
          to="/"
          style={{
            pointerEvents: "auto",
            fontSize: 12,
            color: "rgba(255,255,255,0.7)",
            textDecoration: "none",
            background: "rgba(0,0,0,0.4)",
            padding: "4px 12px",
            borderRadius: 12,
          }}
        >
          Back
        </Link>
        <span
          style={{
            pointerEvents: "auto",
            fontSize: 11,
            color: "rgba(255,255,255,0.4)",
            fontVariantNumeric: "tabular-nums",
            background: "rgba(0,0,0,0.4)",
            padding: "4px 8px",
            borderRadius: 8,
          }}
        >
          {fps > 0 ? `${fps} fps` : ""}
        </span>
      </div>

      <button
        onClick={handleFlip}
        title="Flip Camera"
        style={{
          position: "fixed",
          bottom: 24,
          left: 24,
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "none",
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          color: "#fff",
          fontSize: 20,
          cursor: "pointer",
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        &#x21C4;
      </button>
      <button
        onClick={() => setSettingsOpen((prev) => !prev)}
        title="Settings"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "none",
          background: settingsOpen
            ? "rgba(255,255,255,0.3)"
            : "rgba(255,255,255,0.15)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          color: "#fff",
          fontSize: 22,
          cursor: "pointer",
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        &#x2699;
      </button>

      <Drawer
        id="camera-settings"
        config={{
          anchor: "bottom",
          dismissible: true,
          chrome: false,
          swipeGestures: {
            swipeClose: true,
            edgeSwipeOpen: false,
            dismissThreshold: 0.3,
          },
        }}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpen={() => setSettingsOpen(true)}
        zIndex={30}
      >
        <div
          style={{
            background: "rgba(20, 20, 20, 0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px 16px 0 0",
            overflowY: "auto",
            maxHeight: "60vh",
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              background: "rgba(255,255,255,0.3)",
              borderRadius: 2,
              margin: "10px auto 6px",
            }}
          />
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
