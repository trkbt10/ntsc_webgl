import { Link } from "react-router";
import {
  RecIndicator, Timecode, BatteryIcon, ResolutionBadge,
  AudioLevelMeter, AudioChannel, FpsDisplay,
  SafeAreaGuide, Crosshair, ThirdsGrid,
  FlipCameraButton, RecordButton,
} from "../../viewfinder";
import { InteractiveWrap } from "../InteractiveWrap";
import { type LayoutProps, displayToggles } from "../types";

/**
 * Letterbox cinema style (Image2)
 * Landscape: letterbox top/bottom bars with info + controls in bottom bar
 * Portrait: thinner letterbox, controls below bottom bar, side meter
 */
export function CinemaLayout(p: LayoutProps) {
  const { showMeter, showGrid } = displayToggles(p);
  const L = p.orientation === "landscape";
  const barH = L ? "12%" : "8%";

  return (
    <>
      {showGrid && <ThirdsGrid />}

      {/* Letterbox bars */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: barH, background: "rgba(0,0,0,0.75)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: barH, background: "rgba(0,0,0,0.75)" }} />

      <SafeAreaGuide />
      <Crosshair />

      {/* Top bar content */}
      <div style={{ position: "absolute", top: 0, left: "3%", right: "3%", height: barH,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "2%" }}>
          <RecIndicator recording={p.recording} />
          <Timecode recording={p.recording} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "2%" }}>
          <ResolutionBadge width={p.cameraWidth} height={p.cameraHeight} />
          <BatteryIcon level={p.batteryLevel} supported={p.batterySupported} />
        </div>
      </div>

      {showMeter && (
        <div style={{ position: "absolute", right: "2%", top: L ? "35%" : "20%" }}>
          <AudioLevelMeter audioStream={p.audioStream} />
        </div>
      )}

      {L ? (
        /* Landscape: info + controls in bottom bar */
        <div style={{ position: "absolute", bottom: 0, left: "3%", right: "3%", height: barH,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "3%" }}>
            <AudioChannel channels={p.audioChannels} />
            <FpsDisplay fps={p.fps} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4%" }}>
            <InteractiveWrap><FlipCameraButton onFlip={p.onFlipCamera} size={30} /></InteractiveWrap>
            <InteractiveWrap><RecordButton recording={p.recording} onToggle={p.onToggleRecord} supported={p.recordingSupported} size={40} /></InteractiveWrap>
            <InteractiveWrap><Link to="/" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>←</Link></InteractiveWrap>
          </div>
        </div>
      ) : (
        /* Portrait: info in bottom bar, controls below */
        <>
          <div style={{ position: "absolute", bottom: 0, left: "3%", right: "3%", height: barH,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <AudioChannel channels={p.audioChannels} />
            <FpsDisplay fps={p.fps} />
          </div>
          <div style={{ position: "absolute", bottom: "10%", left: 0, right: 0,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "6%",
          }}>
            <InteractiveWrap><FlipCameraButton onFlip={p.onFlipCamera} size={32} /></InteractiveWrap>
            <InteractiveWrap><RecordButton recording={p.recording} onToggle={p.onToggleRecord} supported={p.recordingSupported} size={44} /></InteractiveWrap>
            <InteractiveWrap><Link to="/" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>←</Link></InteractiveWrap>
          </div>
        </>
      )}
    </>
  );
}
