import { ControlButton } from "./ControlButton";
import { CONTROL, COLOR } from "../../design-tokens";

interface RecordButtonProps {
  recording: boolean;
  onToggle: () => void;
  supported: boolean;
  size?: number;
}

export function RecordButton({ recording, onToggle, supported, size = CONTROL.primary.size }: RecordButtonProps) {
  if (!supported) return null;

  const innerSize = recording ? size * 0.39 : size * 0.75;
  return (
    <ControlButton onClick={onToggle} size={size} variant="primary" title={recording ? "Stop & Save" : "Record"}>
      <div
        style={{
          width: innerSize, height: innerSize,
          borderRadius: recording ? 4 : "50%",
          background: COLOR.rec,
          transition: "all 0.2s",
        }}
      />
    </ControlButton>
  );
}
