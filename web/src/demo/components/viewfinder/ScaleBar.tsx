/**
 * @source None — decorative frame element
 * @description Film strip scale bar tick marks.
 */

export function ScaleBar() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 0, height: 10 }}>
      {Array.from({ length: 30 }, (_, i) => (
        <div key={i} style={{ width: 3, height: i % 5 === 0 ? 10 : 5, background: "rgba(255,255,255,0.4)", marginRight: 1 }} />
      ))}
    </div>
  );
}
