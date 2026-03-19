import { Link } from "react-router";
import { FocusBrackets, Crosshair, FlipCameraButton, RecordButton } from "../../viewfinder";
import { InteractiveWrap } from "../InteractiveWrap";
import type { LayoutProps } from "../types";

/**
 * Frame elements + essential controls only
 * Landscape: controls right column
 * Portrait: controls bottom row
 */
export function MinimalLayout(p: LayoutProps) {
  const L = p.orientation === "landscape";
  return (
    <>
      <FocusBrackets />
      <Crosshair />

      {L ? (
        <div style={{ position: "absolute", right: "3%", top: 0, bottom: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4%",
        }}>
          <InteractiveWrap><FlipCameraButton onFlip={p.onFlipCamera} size={34} /></InteractiveWrap>
          <InteractiveWrap><RecordButton recording={p.recording} onToggle={p.onToggleRecord} supported={p.recordingSupported} size={44} /></InteractiveWrap>
          <InteractiveWrap><Link to="/" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>←</Link></InteractiveWrap>
        </div>
      ) : (
        <div style={{ position: "absolute", bottom: "3%", left: 0, right: 0,
          display: "flex", alignItems: "center", justifyContent: "center", gap: "6%",
        }}>
          <InteractiveWrap><FlipCameraButton onFlip={p.onFlipCamera} size={34} /></InteractiveWrap>
          <InteractiveWrap><RecordButton recording={p.recording} onToggle={p.onToggleRecord} supported={p.recordingSupported} size={44} /></InteractiveWrap>
          <InteractiveWrap><Link to="/" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>←</Link></InteractiveWrap>
        </div>
      )}
    </>
  );
}
