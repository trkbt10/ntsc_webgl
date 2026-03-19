import {
  RecIndicator, Timecode, BatteryIcon, ResolutionBadge,
  AudioLevelMeter, AudioChannel, FpsDisplay,
  SafeAreaGuide, Crosshair, ThirdsGrid,
  FlipCameraButton, RecordButton,
  ModeToggle, ShutterButton, GalleryButton,
} from "../../viewfinder";
import { InteractiveWrap } from "../InteractiveWrap";
import { type LayoutProps, displayToggles } from "../types";
import { controlSizes, SPACING } from "../../../design-tokens";

const PRESET = "cinema";

export function CinemaLayout(p: LayoutProps) {
  const { showMeter, showGrid } = displayToggles(p);
  const L = p.orientation === "landscape";
  const barH = L ? "12%" : "8%";
  const isPhoto = p.captureMode === "photo";
  const sz = controlSizes(PRESET, p.orientation);

  return (
    <>
      {showGrid && <ThirdsGrid />}

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: barH, background: "rgba(0,0,0,0.75)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: barH, background: "rgba(0,0,0,0.75)" }} />

      <SafeAreaGuide />
      <Crosshair />

      <div style={{ position: "absolute", top: 0, left: SPACING.edgePad, right: SPACING.edgePad, height: barH,
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

      {showMeter && (
        <div style={{ position: "absolute", right: "2%", top: L ? "35%" : "20%" }}>
          <AudioLevelMeter audioStream={p.audioStream} />
        </div>
      )}

      {L ? (
        <div style={{ position: "absolute", bottom: 0, left: SPACING.edgePad, right: SPACING.edgePad, height: barH,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "3%" }}>
            <AudioChannel channels={p.audioChannels} />
            <FpsDisplay fps={p.fps} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: SPACING.controlGap }}>
            <InteractiveWrap><ModeToggle mode={p.captureMode} onToggle={p.onToggleMode} size={sz.secondary} /></InteractiveWrap>
            <InteractiveWrap><FlipCameraButton onFlip={p.onFlipCamera} size={sz.secondary} /></InteractiveWrap>
            <InteractiveWrap>
              {isPhoto
                ? <ShutterButton onCapture={p.onCapturePhoto} size={sz.primary} />
                : <RecordButton recording={p.recording} onToggle={p.onToggleRecord} supported={p.recordingSupported} size={sz.primary} />
              }
            </InteractiveWrap>
            <InteractiveWrap><GalleryButton thumbnailUrl={p.galleryThumbnail} count={p.galleryCount} onOpen={p.onOpenGallery} size={sz.secondary} /></InteractiveWrap>          </div>
        </div>
      ) : (
        <>
          <div style={{ position: "absolute", bottom: 0, left: SPACING.edgePad, right: SPACING.edgePad, height: barH,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <AudioChannel channels={p.audioChannels} />
            <FpsDisplay fps={p.fps} />
          </div>
          <div style={{ position: "absolute", bottom: "10%", left: 0, right: 0,
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
            <InteractiveWrap><GalleryButton thumbnailUrl={p.galleryThumbnail} count={p.galleryCount} onOpen={p.onOpenGallery} size={sz.secondary} /></InteractiveWrap>          </div>
        </>
      )}
    </>
  );
}
