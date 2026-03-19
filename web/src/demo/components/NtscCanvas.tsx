interface NtscCanvasProps {
  canvasRef: (node: HTMLCanvasElement | null) => void;
  style?: React.CSSProperties;
}

export function NtscCanvas({ canvasRef, style }: NtscCanvasProps) {
  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        ...style,
      }}
    />
  );
}
