import { useCallback } from "react";

interface NtscCanvasProps {
  onReady: (canvas: HTMLCanvasElement) => void;
  style?: React.CSSProperties;
}

export function NtscCanvas({ onReady, style }: NtscCanvasProps) {
  // Use ref callback — fires once when the element mounts
  const refCallback = useCallback(
    (node: HTMLCanvasElement | null) => {
      if (node) onReady(node);
    },
    [onReady],
  );

  return (
    <canvas
      ref={refCallback}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        ...style,
      }}
    />
  );
}
