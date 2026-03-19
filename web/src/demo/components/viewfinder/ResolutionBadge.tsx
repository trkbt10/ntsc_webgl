/**
 * @source MediaStreamTrack.getSettings().width / height
 * @description Shows resolution badge based on actual camera track dimensions.
 *   Derives HD/FHD/4K label from real pixel count.
 */

export function ResolutionBadge({ width, height }: { width: number; height: number }) {
  if (width === 0 || height === 0) return null;
  const pixels = width * height;
  const label = pixels >= 3840 * 2160 ? "4K" : pixels >= 1920 * 1080 ? "FHD" : pixels >= 1280 * 720 ? "HD" : `${width}x${height}`;
  return (
    <span style={{ fontSize: 9, fontWeight: 700, fontFamily: "monospace", color: "#fff", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 2, padding: "1px 3px", lineHeight: 1.2 }}>
      {label}
    </span>
  );
}
