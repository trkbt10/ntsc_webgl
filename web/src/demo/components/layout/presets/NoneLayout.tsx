import { Link } from "react-router";
import { FlipCameraButton, RecordButton } from "../../viewfinder";
import { InteractiveWrap } from "../InteractiveWrap";
import type { LayoutProps } from "../types";

export function NoneLayout(p: LayoutProps) {
  const L = p.orientation === "landscape";
  if (L) {
    // Landscape: controls in a right-side column
    return (
      <div style={{ position: "absolute", right: "3%", top: 0, bottom: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4%",
      }}>
        <InteractiveWrap><FlipCameraButton onFlip={p.onFlipCamera} size={38} /></InteractiveWrap>
        <InteractiveWrap><RecordButton recording={p.recording} onToggle={p.onToggleRecord} supported={p.recordingSupported} size={50} /></InteractiveWrap>
        <InteractiveWrap><Link to="/" style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>← 戻る</Link></InteractiveWrap>
      </div>
    );
  }
  // Portrait: controls in bottom row
  return (
    <div style={{ position: "absolute", bottom: "3%", left: 0, right: 0,
      display: "flex", alignItems: "center", justifyContent: "center", gap: "6%",
    }}>
      <InteractiveWrap><FlipCameraButton onFlip={p.onFlipCamera} size={38} /></InteractiveWrap>
      <InteractiveWrap><RecordButton recording={p.recording} onToggle={p.onToggleRecord} supported={p.recordingSupported} size={50} /></InteractiveWrap>
      <InteractiveWrap><Link to="/" style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>← 戻る</Link></InteractiveWrap>
    </div>
  );
}
