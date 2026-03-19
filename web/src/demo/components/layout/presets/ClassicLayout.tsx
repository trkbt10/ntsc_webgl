import {
  RecIndicator, Timecode, BatteryIcon, ResolutionBadge,
  AudioLevelMeter, DateStamp, AudioChannel, FpsDisplay,
  FlipCameraButton, RecordButton, ThirdsGrid,
  ModeToggle, ShutterButton, GalleryButton,
} from "../../viewfinder";
import { InteractiveWrap } from "../InteractiveWrap";
import { type LayoutProps, displayToggles } from "../types";
import { controlSizes, SPACING, COLOR } from "../../../design-tokens";

const PRESET = "classic";

export function ClassicLayout(p: LayoutProps) {
  const { showMeter, showGrid } = displayToggles(p);
  const L = p.orientation === "landscape";
  const isPhoto = p.captureMode === "photo";
  const sz = controlSizes(PRESET, p.orientation);

  return (
    <>
      {showGrid && <ThirdsGrid />}

      {/* Top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: L ? "8%" : "6%",
        background: COLOR.gradientTop,
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${SPACING.edgePad}`,
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
            <div style={{ position: "absolute", bottom: "18%", left: "2%" }}>
              <AudioLevelMeter audioStream={p.audioStream} />
            </div>
          )}

          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "14%",
            background: COLOR.gradientBottom,
            display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: `0 ${SPACING.edgePad} 2%`,
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
            <div style={{ display: "flex", alignItems: "center", gap: SPACING.controlGap }}>
              <InteractiveWrap><FlipCameraButton onFlip={p.onFlipCamera} size={sz.secondary} /></InteractiveWrap>
              <InteractiveWrap><ModeToggle mode={p.captureMode} onToggle={p.onToggleMode} size={sz.secondary} /></InteractiveWrap>
            </div>
            <InteractiveWrap>
              {isPhoto
                ? <ShutterButton onCapture={p.onCapturePhoto} size={sz.primary} />
                : <RecordButton recording={p.recording} onToggle={p.onToggleRecord} supported={p.recordingSupported} size={sz.primary} />
              }
            </InteractiveWrap>
            <div style={{ display: "flex", alignItems: "center", gap: SPACING.controlGap }}>
              <InteractiveWrap><GalleryButton thumbnailUrl={p.galleryThumbnail} count={p.galleryCount} onOpen={p.onOpenGallery} size={sz.secondary} /></InteractiveWrap>            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ position: "absolute", top: "8%", left: SPACING.edgePad,
            display: "flex", flexDirection: "column", gap: "2%",
          }}>
            <FpsDisplay fps={p.fps} />
            <AudioChannel channels={p.audioChannels} />
          </div>

          {showMeter && (
            <div style={{ position: "absolute", top: "8%", right: SPACING.edgePad }}>
              <AudioLevelMeter audioStream={p.audioStream} />
            </div>
          )}

          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "20%",
            background: COLOR.gradientBottom,
            display: "flex", flexDirection: "column", justifyContent: "flex-end",
            padding: "0 4% 3%", gap: "2%",
          }}>
            <DateStamp />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: SPACING.controlGap }}>
                <InteractiveWrap><FlipCameraButton onFlip={p.onFlipCamera} size={sz.secondary} /></InteractiveWrap>
                <InteractiveWrap><ModeToggle mode={p.captureMode} onToggle={p.onToggleMode} size={sz.secondary} /></InteractiveWrap>
              </div>
              <InteractiveWrap>
                {isPhoto
                  ? <ShutterButton onCapture={p.onCapturePhoto} size={sz.primary} />
                  : <RecordButton recording={p.recording} onToggle={p.onToggleRecord} supported={p.recordingSupported} size={sz.primary} />
                }
              </InteractiveWrap>
              <div style={{ display: "flex", alignItems: "center", gap: SPACING.controlGap }}>
                <InteractiveWrap><GalleryButton thumbnailUrl={p.galleryThumbnail} count={p.galleryCount} onOpen={p.onOpenGallery} size={sz.secondary} /></InteractiveWrap>              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
