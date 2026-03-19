/**
 * @source NtscPipeline FrameLoop FPS measurement (requestAnimationFrame)
 * @support Universal
 * @description Shows actual rendering FPS from the NTSC processing pipeline.
 */

export function FpsDisplay({ fps }: { fps: number }) {
  if (fps <= 0) return null;
  return (
    <span style={{ fontFamily: "monospace", fontSize: 12, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
      FPS{fps}
    </span>
  );
}
