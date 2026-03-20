import { Images } from "lucide-react";
import { ControlButton } from "./ControlButton";
import { CONTROL, COLOR, RATIO, BADGE, TRANSITION, iconSize as calcIconSize } from "../../design-tokens";

interface GalleryButtonProps {
  thumbnailUrl: string | null;
  count: number;
  onOpen: () => void;
  size?: number;
}

export function GalleryButton({ thumbnailUrl, count, onOpen, size = CONTROL.secondary.size }: GalleryButtonProps) {
  const iSize = calcIconSize(size);
  return (
    <ControlButton
      onClick={onOpen}
      size={size}
      title="Open Gallery"
      style={{
        position: "relative",
        viewTransitionName: TRANSITION.galleryButton,
      }}
    >
      {thumbnailUrl ? (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: size * RATIO.controlRadius }}>
          <img src={thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      ) : (
        <Images size={iSize} strokeWidth={CONTROL.iconStroke} />
      )}
      {count > 0 && (
        <span style={{
          position: "absolute", top: BADGE.offset, right: BADGE.offset,
          background: COLOR.rec, color: COLOR.textPrimary,
          fontSize: BADGE.fontSize, fontWeight: 700,
          minWidth: BADGE.size, height: BADGE.size, borderRadius: BADGE.borderRadius,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 3px",
        }}>
          {count > 99 ? "99+" : count}
        </span>
      )}
    </ControlButton>
  );
}
