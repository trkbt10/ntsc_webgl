import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router";
import { Drawer } from "react-panel-layout";
import { NtscCanvas } from "../components/NtscCanvas";
import { SettingsPanel } from "../components/SettingsPanel";
import { useNtsc } from "../hooks/useNtsc";

export function HomePage() {
  const ntsc = useNtsc();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const reprocess = useCallback(() => {
    if (imageRef.current) {
      ntsc.processImageSource(imageRef.current);
    }
  }, [ntsc.processImageSource]);

  const handleFileSelect = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setImageLoaded(true);
        ntsc.processImageSource(img);
      };
      img.src = url;
    },
    [ntsc.processImageSource],
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

  // Re-process whenever params change
  useEffect(() => {
    if (imageLoaded) {
      reprocess();
    }
  }, [ntsc.params, imageLoaded, reprocess]);

  if (ntsc.error) {
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
          {ntsc.error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Canvas — always mounted, hidden until image loaded */}
      <NtscCanvas
        onReady={ntsc.init}
        style={{
          position: "absolute",
          inset: 0,
          opacity: imageLoaded ? 1 : 0,
          pointerEvents: "none",
        }}
      />

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

      {/* Upload area — visible when no image */}
      {!imageLoaded && !ntsc.loading && (
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

      {/* Image preview controls */}
      {imageLoaded && (
        <>
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
            <button
              onClick={() => {
                setImageLoaded(false);
                imageRef.current = null;
              }}
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

          {/* Settings button */}
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
                params={ntsc.params}
                activePreset={ntsc.activePreset}
                onParamChange={ntsc.setParam}
                onPresetChange={ntsc.applyPreset}
              />
            </div>
          </Drawer>
        </>
      )}
    </div>
  );
}
