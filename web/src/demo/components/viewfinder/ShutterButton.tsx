import { ControlButton } from "./ControlButton";
import { CONTROL, COLOR, RATIO } from "../../design-tokens";

interface ShutterButtonProps {
  onCapture: () => void;
  size?: number;
}

export function ShutterButton({ onCapture, size = CONTROL.primary.size }: ShutterButtonProps) {
  return (
    <ControlButton onClick={onCapture} size={size} variant="primary" title="Take Photo">
      <div
        style={{
          width: size * RATIO.shutterInner, height: size * RATIO.shutterInner,
          borderRadius: "50%",
          background: COLOR.textPrimary,
          transition: "transform 0.12s",
        }}
      />
    </ControlButton>
  );
}
