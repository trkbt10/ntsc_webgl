import {
  FlipCameraButton, RecordButton,
  ModeToggle, ShutterButton, GalleryButton,
} from "../../viewfinder";
import { InteractiveWrap } from "../InteractiveWrap";
import type { LayoutProps } from "../types";
import { controlSizes, SPACING } from "../../../design-tokens";

const PRESET = "none";

export function NoneLayout(p: LayoutProps) {
  const L = p.orientation === "landscape";
  const isPhoto = p.captureMode === "photo";
  const sz = controlSizes(PRESET, p.orientation);

  if (L) {
    return (
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
        <InteractiveWrap><GalleryButton thumbnailUrl={p.galleryThumbnail} count={p.galleryCount} onOpen={p.onOpenGallery} size={sz.secondary} /></InteractiveWrap>      </div>
    );
  }

  return (
    <div style={{ position: "absolute", bottom: "3%", left: 0, right: 0,
      display: "flex", alignItems: "center", justifyContent: "center", gap: SPACING.controlGap * 2,
    }}>
      <InteractiveWrap><ModeToggle mode={p.captureMode} onToggle={p.onToggleMode} size={sz.secondary} /></InteractiveWrap>
      <InteractiveWrap><FlipCameraButton onFlip={p.onFlipCamera} size={sz.secondary} /></InteractiveWrap>
      <InteractiveWrap>
        {isPhoto
          ? <ShutterButton onCapture={p.onCapturePhoto} size={sz.primary} />
          : <RecordButton recording={p.recording} onToggle={p.onToggleRecord} supported={p.recordingSupported} size={sz.primary} />
        }
      </InteractiveWrap>
      <InteractiveWrap><GalleryButton thumbnailUrl={p.galleryThumbnail} count={p.galleryCount} onOpen={p.onOpenGallery} size={sz.secondary} /></InteractiveWrap>    </div>
  );
}
