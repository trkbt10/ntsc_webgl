import { SwitchCamera } from "lucide-react";
import { ControlButton } from "./ControlButton";
import { CONTROL, iconSize as calcIconSize } from "../../design-tokens";

interface FlipCameraButtonProps {
  onFlip: () => void;
  size?: number;
}

export function FlipCameraButton({ onFlip, size = CONTROL.secondary.size }: FlipCameraButtonProps) {
  const iSize = calcIconSize(size);
  return (
    <ControlButton onClick={onFlip} size={size} title="Flip Camera">
      <SwitchCamera size={iSize} strokeWidth={CONTROL.iconStroke} />
    </ControlButton>
  );
}
