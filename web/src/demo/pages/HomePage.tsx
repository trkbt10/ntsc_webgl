import { useState, useCallback, useEffect, useMemo } from "react";
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

export function HomePage() {
  const { canvasRef, pipeline, ready, error, hasStill } = useNtscPipeline();

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

  const handleFileSelect = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => pipeline?.processStill(img);
      img.src = url;
    },
    [pipeline],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith("image/")) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <NtscCanvas
        canvasRef={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          opacity: hasStill ? 1 : 0,
          pointerEvents: "none",
        }}
      />

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

      {!hasStill && ready && (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div
            style={{
              textAlign: "center",
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 16 }}>NTSC Cam</div>
            <div style={{ fontSize: 14, marginBottom: 8 }}>
              NTSC/VHS video artifact emulator
            </div>
          </div>

          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 28px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              fontSize: 15,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            Upload Image
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </label>

          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.3)",
              marginTop: -8,
            }}
          >
            or drag & drop an image
          </div>

          <Link
            to="/camera"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 28px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
              color: "rgba(255,255,255,0.7)",
              fontSize: 15,
              textDecoration: "none",
              transition: "background 0.2s",
            }}
          >
            Live Camera Mode
          </Link>
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.25)",
              marginTop: -8,
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            Camera mode will request access to your device camera
          </div>
        </div>
      )}

      {hasStill && (
        <>
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
            <button
              onClick={() => pipeline?.clearStill()}
              style={{
                pointerEvents: "auto",
                fontSize: 12,
                color: "rgba(255,255,255,0.7)",
                background: "rgba(0,0,0,0.4)",
                border: "none",
                padding: "4px 12px",
                borderRadius: 12,
                cursor: "pointer",
              }}
            >
              New Image
            </button>
          </div>

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
            id="home-settings"
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
        </>
      )}
    </div>
  );
}
