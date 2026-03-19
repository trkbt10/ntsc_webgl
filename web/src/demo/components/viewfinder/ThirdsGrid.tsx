/**
 * @source None — decorative compositional guide
 * @description Rule of thirds grid overlay for composition.
 */

export function ThirdsGrid() {
  return (
    <div style={{ position: "absolute", inset: "5% 5%", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr 1fr 1fr", pointerEvents: "none" }}>
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} style={{ border: "0.5px solid rgba(255,255,255,0.08)" }} />
      ))}
    </div>
  );
}
