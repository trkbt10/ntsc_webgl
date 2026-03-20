import {
  RecIndicator, Timecode, BatteryIcon, ResolutionBadge,
  AudioLevelMeter, AudioChannel, FpsDisplay, ScaleBar,
  FocusBrackets, Crosshair, ThirdsGrid,
  FlipCameraButton, RecordButton,
  ModeToggle, ShutterButton, GalleryButton,
} from "../../viewfinder";
import { InteractiveWrap } from "../InteractiveWrap";
import { type LayoutProps, displayToggles } from "../types";
import { controlSizes, SPACING, LAYOUT } from "../../../design-tokens";

const PRESET = "modern";

export function ModernLayout(p: LayoutProps) {
  const { showMeter, showGrid } = displayToggles(p);
  const L = p.orientation === "landscape";
  const isPhoto = p.captureMode === "photo";
  const sz = controlSizes(PRESET, p.orientation);
  const secondarySlot: React.CSSProperties = { height: sz.primary, display: "flex", alignItems: "center" };

  return (
    <>
      {showGrid && <ThirdsGrid />}
      <FocusBrackets />
      <Crosshair />

      {/* Top bar */}
      <div style={{ position: "absolute", top: "2%", left: SPACING.edgePad, right: SPACING.edgePad,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "2%" }}>
          <RecIndicator recording={p.recording} photoMode={isPhoto} />
          {!isPhoto && <Timecode recording={p.recording} />}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "2%" }}>
          <ResolutionBadge width={p.cameraWidth} height={p.cameraHeight} />
          <BatteryIcon level={p.batteryLevel} supported={p.batterySupported} />
        </div>
      </div>

      {L ? (
        <>
          {showMeter && (
            <div style={{ position: "absolute", right: SPACING.edgePad, top: "35%" }}>
              <AudioLevelMeter audioStream={p.audioStream} />
            </div>
          )}

          <div style={{ position: "absolute", bottom: LAYOUT.controlRowBottom.landscape, left: SPACING.edgePad, right: SPACING.edgePad,
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: SPACING.controlGap }}>
              <FpsDisplay fps={p.fps} />
              <AudioChannel channels={p.audioChannels} />
            </div>
            <ScaleBar />
          </div>

          <div style={{ position: "absolute", bottom: LAYOUT.controlRowBottom.landscape, left: 0, right: 0,
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
            <InteractiveWrap style={secondarySlot}><GalleryButton thumbnailUrl={p.galleryThumbnail} count={p.galleryCount} onOpen={p.onOpenGallery} size={sz.secondary} /></InteractiveWrap>          </div>
        </>
      ) : (
        <>
          {showMeter && (
            <div style={{ position: "absolute", right: SPACING.edgePad, top: "15%" }}>
              <AudioLevelMeter audioStream={p.audioStream} />
            </div>
          )}

          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: LAYOUT.bottomZone.portrait,
            display: "flex", flexDirection: "column", justifyContent: "flex-end",
            padding: `0 ${SPACING.edgePad}px ${SPACING.controlGroupGap}px`, gap: SPACING.controlGap,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "3%" }}>
                <FpsDisplay fps={p.fps} />
                <AudioChannel channels={p.audioChannels} />
              </div>
              <ScaleBar />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: SPACING.controlGroupGap }}>
              <InteractiveWrap style={secondarySlot}><ModeToggle mode={p.captureMode} onToggle={p.onToggleMode} size={sz.secondary} /></InteractiveWrap>
              <InteractiveWrap style={secondarySlot}><FlipCameraButton onFlip={p.onFlipCamera} size={sz.secondary} /></InteractiveWrap>
              <InteractiveWrap>
                {isPhoto
                  ? <ShutterButton onCapture={p.onCapturePhoto} size={sz.primary} />
                  : <RecordButton recording={p.recording} onToggle={p.onToggleRecord} supported={p.recordingSupported} size={sz.primary} />
                }
              </InteractiveWrap>
              <InteractiveWrap style={secondarySlot}><GalleryButton thumbnailUrl={p.galleryThumbnail} count={p.galleryCount} onOpen={p.onOpenGallery} size={sz.secondary} /></InteractiveWrap>            </div>
          </div>
        </>
      )}
    </>
  );
}
