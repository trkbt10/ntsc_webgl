import { ControlButton } from "./ControlButton";
import { CONTROL } from "../../design-tokens";

interface ShutterButtonProps {
  onCapture: () => void;
  size?: number;
}

export function ShutterButton({ onCapture, size = CONTROL.primary.size }: ShutterButtonProps) {
  return (
    <ControlButton onClick={onCapture} size={size} variant="primary" title="Take Photo">
      <div
        style={{
          width: size * 0.78, height: size * 0.78,
          borderRadius: "50%",
          background: "#fff",
          transition: "transform 0.12s",
        }}
      />
    </ControlButton>
  );
}
