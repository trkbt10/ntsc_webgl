import { Link } from "react-router";
import {
  RecIndicator, Timecode, BatteryIcon, ResolutionBadge,
  AudioLevelMeter, AudioChannel, FpsDisplay, ScaleBar,
  FocusBrackets, Crosshair, ThirdsGrid,
  FlipCameraButton, RecordButton,
} from "../../viewfinder";
import { InteractiveWrap } from "../InteractiveWrap";
import { type LayoutProps, displayToggles } from "../types";

/**
 * Professional viewfinder (Image3 + AVIF bottom-left)
 * Landscape: top bar info, right-side meter, bottom data + center controls
 * Portrait: top bar, bottom stacked (data row + controls row), side meter
 */
export function ModernLayout(p: LayoutProps) {
  const { showMeter, showGrid } = displayToggles(p);
  const L = p.orientation === "landscape";

  return (
    <>
      {showGrid && <ThirdsGrid />}
      <FocusBrackets />
      <Crosshair />

      {/* Top bar */}
      <div style={{ position: "absolute", top: "2%", left: "3%", right: "3%",
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

      {L ? (
        <>
          {showMeter && (
            <div style={{ position: "absolute", right: "3%", top: "35%" }}>
              <AudioLevelMeter audioStream={p.audioStream} />
            </div>
          )}

          {/* Bottom: data left, scale right */}
          <div style={{ position: "absolute", bottom: "2%", left: "3%", right: "3%",
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "3%" }}>
              <FpsDisplay fps={p.fps} />
              <AudioChannel channels={p.audioChannels} />
            </div>
            <ScaleBar />
          </div>

          {/* Controls: center-bottom */}
          <div style={{ position: "absolute", bottom: "2%", left: 0, right: 0,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "5%",
          }}>
            <InteractiveWrap><FlipCameraButton onFlip={p.onFlipCamera} size={36} /></InteractiveWrap>
            <InteractiveWrap><RecordButton recording={p.recording} onToggle={p.onToggleRecord} supported={p.recordingSupported} size={48} /></InteractiveWrap>
            <InteractiveWrap><Link to="/" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>←</Link></InteractiveWrap>
          </div>
        </>
      ) : (
        <>
          {showMeter && (
            <div style={{ position: "absolute", right: "3%", top: "15%" }}>
              <AudioLevelMeter audioStream={p.audioStream} />
            </div>
          )}

          {/* Bottom: stacked data + controls */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "18%",
            display: "flex", flexDirection: "column", justifyContent: "flex-end",
            padding: "0 4% 2%", gap: "1.5%",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "3%" }}>
                <FpsDisplay fps={p.fps} />
                <AudioChannel channels={p.audioChannels} />
              </div>
              <ScaleBar />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6%" }}>
              <InteractiveWrap><FlipCameraButton onFlip={p.onFlipCamera} size={34} /></InteractiveWrap>
              <InteractiveWrap><RecordButton recording={p.recording} onToggle={p.onToggleRecord} supported={p.recordingSupported} size={46} /></InteractiveWrap>
              <InteractiveWrap><Link to="/" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>←</Link></InteractiveWrap>
            </div>
          </div>
        </>
      )}
    </>
  );
}
