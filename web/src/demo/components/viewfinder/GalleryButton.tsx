import { Images } from "lucide-react";
import { ControlButton } from "./ControlButton";
import { CONTROL, COLOR, TRANSITION, iconSize as calcIconSize } from "../../design-tokens";

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
        overflow: "hidden",
        position: "relative",
        viewTransitionName: TRANSITION.galleryButton,
      }}
    >
      {thumbnailUrl ? (
        <img src={thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
      ) : (
        <Images size={iSize} strokeWidth={CONTROL.iconStroke} />
      )}
      {count > 0 && (
        <span style={{
          position: "absolute", top: -4, right: -4,
          background: COLOR.rec, color: COLOR.textPrimary,
          fontSize: 9, fontWeight: 700,
          minWidth: 16, height: 16, borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 3px",
        }}>
          {count > 99 ? "99+" : count}
        </span>
      )}
    </ControlButton>
  );
}
