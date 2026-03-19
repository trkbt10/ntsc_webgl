import { Link } from "react-router";
import {
  RecIndicator, Timecode, BatteryIcon, ResolutionBadge,
  AudioLevelMeter, DateStamp, AudioChannel, FpsDisplay,
  FlipCameraButton, RecordButton, ThirdsGrid,
} from "../../viewfinder";
import { InteractiveWrap } from "../InteractiveWrap";
import { type LayoutProps, displayToggles } from "../types";

/**
 * Japanese consumer camcorder style (Image1)
 * Landscape: top bar (REC/TC), bottom bar (date/ch), controls bottom row
 * Portrait: top bar, side meter, controls + info stacked at bottom
 */
export function ClassicLayout(p: LayoutProps) {
  const { showMeter, showGrid } = displayToggles(p);
  const L = p.orientation === "landscape";

  return (
    <>
      {showGrid && <ThirdsGrid />}

      {/* Top bar — same in both orientations */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: L ? "8%" : "6%",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 3%",
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
        /* ── Landscape ── */
        <>
          {showMeter && (
            <div style={{ position: "absolute", bottom: "18%", left: "2%" }}>
              <AudioLevelMeter audioStream={p.audioStream} />
            </div>
          )}

          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "14%",
            background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)",
            display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 3% 2%",
          }}>
            <DateStamp />
            <div style={{ display: "flex", alignItems: "center", gap: "3%" }}>
              <FpsDisplay fps={p.fps} />
              <AudioChannel channels={p.audioChannels} />
            </div>
          </div>

          <div style={{ position: "absolute", bottom: "3%", left: 0, right: 0,
            display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 5%",
          }}>
            <InteractiveWrap><FlipCameraButton onFlip={p.onFlipCamera} size={38} /></InteractiveWrap>
            <InteractiveWrap><RecordButton recording={p.recording} onToggle={p.onToggleRecord} supported={p.recordingSupported} size={50} /></InteractiveWrap>
            <InteractiveWrap><Link to="/" style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>← 戻る</Link></InteractiveWrap>
          </div>
        </>
      ) : (
        /* ── Portrait ── */
        <>
          {/* Info bar mid-area */}
          <div style={{ position: "absolute", top: "8%", left: "3%",
            display: "flex", flexDirection: "column", gap: "2%",
          }}>
            <FpsDisplay fps={p.fps} />
            <AudioChannel channels={p.audioChannels} />
          </div>

          {showMeter && (
            <div style={{ position: "absolute", top: "8%", right: "3%" }}>
              <AudioLevelMeter audioStream={p.audioStream} />
            </div>
          )}

          {/* Bottom zone: date + controls */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "20%",
            background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)",
            display: "flex", flexDirection: "column", justifyContent: "flex-end",
            padding: "0 4% 3%", gap: "2%",
          }}>
            <DateStamp />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <InteractiveWrap><FlipCameraButton onFlip={p.onFlipCamera} size={36} /></InteractiveWrap>
              <InteractiveWrap><RecordButton recording={p.recording} onToggle={p.onToggleRecord} supported={p.recordingSupported} size={50} /></InteractiveWrap>
              <InteractiveWrap><Link to="/" style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>← 戻る</Link></InteractiveWrap>
            </div>
          </div>
        </>
      )}
    </>
  );
}
