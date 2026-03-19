/**
 * @source useCanvasRecorder — MediaRecorder via canvas.captureStream()
 * @support Chrome/Firefox: yes | Safari/iOS: no (button hidden when unsupported)
 * @description Record/stop button for NTSC-processed canvas output.
 *   Only rendered when MediaRecorder is supported.
 */

interface RecordButtonProps {
  recording: boolean;
  onToggle: () => void;
  supported: boolean;
  size?: number;
}

export function RecordButton({ recording, onToggle, supported, size = 56 }: RecordButtonProps) {
  if (!supported) return null;

  const innerSize = recording ? size * 0.39 : size * 0.75;
  return (
    <button
      onClick={onToggle}
      title={recording ? "Stop & Save" : "Record"}
      style={{
        width: size, height: size, borderRadius: "50%",
        border: "3px solid rgba(255,255,255,0.6)",
        background: "transparent",
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 0,
      }}
    >
      <div
        style={{
          width: innerSize, height: innerSize,
          borderRadius: recording ? 4 : "50%",
          background: "#e00",
          transition: "all 0.2s",
        }}
      />
    </button>
  );
}
