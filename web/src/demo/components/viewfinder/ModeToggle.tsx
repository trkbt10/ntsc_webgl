import { Camera, Video } from "lucide-react";
import { ControlButton } from "./ControlButton";
import { CONTROL } from "../../design-tokens";
import type { CaptureMode } from "../../media-store-types";

interface ModeToggleProps {
  mode: CaptureMode;
  onToggle: () => void;
  size?: number;
}

export function ModeToggle({ mode, onToggle, size = CONTROL.secondary.size }: ModeToggleProps) {
  const iconSize = Math.round(size * CONTROL.secondary.iconScale);
  const Icon = mode === "photo" ? Camera : Video;
  return (
    <ControlButton
      onClick={onToggle}
      size={size}
      title={mode === "photo" ? "Switch to Video" : "Switch to Photo"}
    >
      <Icon size={iconSize} strokeWidth={CONTROL.iconStroke} />
    </ControlButton>
  );
}
