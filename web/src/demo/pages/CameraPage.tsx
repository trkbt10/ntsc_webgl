import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router";
import { Drawer } from "react-panel-layout";
import { NtscCanvas } from "../components/NtscCanvas";
import { SettingsPanel } from "../components/SettingsPanel";
import { useNtsc } from "../hooks/useNtsc";

export function CameraPage() {
  const ntsc = useNtsc();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const facingRef = useRef(facingMode);
  facingRef.current = facingMode;

  const startCamera = useCallback(async (facing: string) => {
    if (!videoRef.current) {
      videoRef.current = document.createElement("video");
      videoRef.current.autoplay = true;
      videoRef.current.playsInline = true;
      videoRef.current.muted = true;
    }
    const video = videoRef.current;
    if (video.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }
    const { width: pw, height: ph } = ntsc.processSize.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: pw || 640 },
        height: { ideal: ph || 480 },
        facingMode: facing,
      },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
    setCameraReady(true);
  }, []);

  // After WASM is ready, start the camera
  useEffect(() => {
    if (!ntsc.loading && !ntsc.error) {
      startCamera(facingRef.current).catch((e) =>
        console.error("Camera error:", e),
      );
    }
  }, [ntsc.loading, ntsc.error, startCamera]);

  // Start video loop when camera is ready
  useEffect(() => {
    if (cameraReady && !ntsc.loading && videoRef.current) {
      ntsc.startVideoLoop(videoRef.current);
      return () => ntsc.stopLoop();
    }
  }, [cameraReady, ntsc.loading, ntsc.startVideoLoop, ntsc.stopLoop]);

  // Cleanup camera on unmount
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

  if (ntsc.error) {
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
          {ntsc.error}
        </div>
        <Link to="/" style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
          Back
        </Link>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Canvas — always mounted */}
      <NtscCanvas onReady={ntsc.init} />

      {/* Loading overlay */}
      {ntsc.loading && (
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
            {ntsc.loadingText}
          </div>
        </div>
      )}

      {/* Top bar */}
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
          {ntsc.fps > 0 ? `${ntsc.fps} fps` : ""}
        </span>
      </div>

      {/* Bottom buttons */}
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

      {/* Settings Drawer */}
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
            params={ntsc.params}
            activePreset={ntsc.activePreset}
            onParamChange={ntsc.setParam}
            onPresetChange={ntsc.applyPreset}
          />
        </div>
      </Drawer>
    </div>
  );
}
