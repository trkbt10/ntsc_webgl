import {
  FocusBrackets, Crosshair, FlipCameraButton, RecordButton,
  ModeToggle, ShutterButton, GalleryButton,
} from "../../viewfinder";
import { InteractiveWrap } from "../InteractiveWrap";
import type { LayoutProps } from "../types";
import { controlSizes, SPACING, LAYOUT } from "../../../design-tokens";

const PRESET = "minimal";

export function MinimalLayout(p: LayoutProps) {
  const L = p.orientation === "landscape";
  const isPhoto = p.captureMode === "photo";
  const sz = controlSizes(PRESET, p.orientation);
  const secondarySlot: React.CSSProperties = { height: sz.primary, display: "flex", alignItems: "center" };

  return (
    <>
      <FocusBrackets />
      <Crosshair />

      {L ? (
        <div style={{ position: "absolute", right: SPACING.edgePad, top: 0, bottom: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: SPACING.controlGap,
        }}>
          <InteractiveWrap><ModeToggle mode={p.captureMode} onToggle={p.onToggleMode} size={sz.secondary} /></InteractiveWrap>
          <InteractiveWrap><FlipCameraButton onFlip={p.onFlipCamera} size={sz.secondary} /></InteractiveWrap>
          <InteractiveWrap>
            {isPhoto
              ? <ShutterButton onCapture={p.onCapturePhoto} size={sz.primary} />
              : <RecordButton recording={p.recording} onToggle={p.onToggleRecord} supported={p.recordingSupported} size={sz.primary} />
            }
          </InteractiveWrap>
          <InteractiveWrap><GalleryButton thumbnailUrl={p.galleryThumbnail} count={p.galleryCount} onOpen={p.onOpenGallery} size={sz.secondary} /></InteractiveWrap>        </div>
      ) : (
        <div style={{ position: "absolute", bottom: LAYOUT.controlRowBottom.portrait, left: 0, right: 0,
          display: "flex", alignItems: "center", justifyContent: "center", gap: SPACING.controlGroupGap,
        }}>
          <InteractiveWrap style={secondarySlot}><ModeToggle mode={p.captureMode} onToggle={p.onToggleMode} size={sz.secondary} /></InteractiveWrap>
          <InteractiveWrap style={secondarySlot}><FlipCameraButton onFlip={p.onFlipCamera} size={sz.secondary} /></InteractiveWrap>
          <InteractiveWrap>
            {isPhoto
              ? <ShutterButton onCapture={p.onCapturePhoto} size={sz.primary} />
              : <RecordButton recording={p.recording} onToggle={p.onToggleRecord} supported={p.recordingSupported} size={sz.primary} />
            }
          </InteractiveWrap>
          <InteractiveWrap style={secondarySlot}><GalleryButton thumbnailUrl={p.galleryThumbnail} count={p.galleryCount} onOpen={p.onOpenGallery} size={sz.secondary} /></InteractiveWrap>        </div>
      )}
    </>
  );
}
