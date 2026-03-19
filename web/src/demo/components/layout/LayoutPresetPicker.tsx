import { type LayoutPreset, LAYOUT_REGISTRY, LAYOUT_PRESETS } from "./registry";
import type { LayoutProps } from "./types";

/** Dummy props for thumbnail rendering */
const THUMB_PROPS: LayoutProps = {
  recording: false, fps: 30,
  batteryLevel: 0.7, batterySupported: true,
  cameraWidth: 1920, cameraHeight: 1080,
  audioChannels: 1, audioStream: null,
  recordingSupported: true,
  onFlipCamera: () => {}, onToggleRecord: () => {},
  orientation: "landscape",
  captureMode: "video",
  onToggleMode: () => {},
  onCapturePhoto: () => {},
  galleryThumbnail: null,
  galleryCount: 0,
  onOpenGallery: () => {},
};

const THUMB_W = 96;
const THUMB_H = 54;
const VIRTUAL_W = 320;
const VIRTUAL_H = 180;
const SCALE = THUMB_W / VIRTUAL_W;

function Thumbnail({ preset }: { preset: LayoutPreset }) {
  const { component } = LAYOUT_REGISTRY[preset];
  return (
    <div style={{
      width: THUMB_W, height: THUMB_H,
      overflow: "hidden", borderRadius: 4,
      background: "#111", position: "relative",
    }}>
      <div style={{
        width: VIRTUAL_W, height: VIRTUAL_H,
        transform: `scale(${SCALE})`, transformOrigin: "top left",
        position: "absolute", top: 0, left: 0,
        pointerEvents: "none",
      }}>
        {component(THUMB_PROPS)}
      </div>
    </div>
  );
}

export function LayoutPresetPicker({ value, onChange }: {
  value: LayoutPreset;
  onChange: (p: LayoutPreset) => void;
}) {
  return (
    <div>
      <div style={{
        fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5,
        color: "rgba(255,255,255,0.35)", margin: "10px 0 6px",
      }}>
        UIプリセット
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {LAYOUT_PRESETS.map((p) => (
          <div key={p} onClick={() => onChange(p)} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onChange(p); }}
            style={{
              padding: 0, cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3,
            }}>
            <div style={{
              borderRadius: 5, overflow: "hidden",
              border: `2px solid ${value === p ? "rgba(255,200,0,0.7)" : "rgba(255,255,255,0.12)"}`,
            }}>
              <Thumbnail preset={p} />
            </div>
            <span style={{
              fontSize: 9,
              color: value === p ? "#fc0" : "rgba(255,255,255,0.5)",
              fontFamily: "inherit",
            }}>
              {LAYOUT_REGISTRY[p].label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
