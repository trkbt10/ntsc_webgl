/**
 * @source useCamera.flipCamera — toggles getUserMedia facingMode
 * @description Camera front/back toggle button. Shared between CameraPage and VideoCamPage.
 */

interface FlipCameraButtonProps {
  onFlip: () => void;
  size?: number;
}

export function FlipCameraButton({ onFlip, size = 42 }: FlipCameraButtonProps) {
  return (
    <button
      onClick={onFlip}
      title="Flip Camera"
      style={{
        width: size, height: size, borderRadius: "50%",
        border: "1.5px solid rgba(255,255,255,0.25)",
        background: "rgba(0,0,0,0.4)",
        color: "#fff", fontSize: size * 0.43,
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      &#x21C4;
    </button>
  );
}
