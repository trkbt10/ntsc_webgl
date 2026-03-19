import { SwitchCamera } from "lucide-react";
import { ControlButton } from "./ControlButton";
import { CONTROL } from "../../design-tokens";

interface FlipCameraButtonProps {
  onFlip: () => void;
  size?: number;
}

export function FlipCameraButton({ onFlip, size = CONTROL.secondary.size }: FlipCameraButtonProps) {
  const iconSize = Math.round(size * CONTROL.secondary.iconScale);
  return (
    <ControlButton onClick={onFlip} size={size} title="Flip Camera">
      <SwitchCamera size={iconSize} strokeWidth={CONTROL.iconStroke} />
    </ControlButton>
  );
}
