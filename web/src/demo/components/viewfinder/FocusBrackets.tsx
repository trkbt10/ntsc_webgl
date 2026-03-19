/**
 * @source None — decorative compositional guide
 * @description Corner focus brackets for viewfinder framing.
 */

export function FocusBrackets() {
  const corner = (rot: number): React.CSSProperties => ({
    position: "absolute", width: 28, height: 28,
    borderColor: "#fff", borderStyle: "solid", borderWidth: 0,
    borderTopWidth: 2, borderLeftWidth: 2,
    transform: `rotate(${rot}deg)`, opacity: 0.7,
  });

  return (
    <div style={{ position: "absolute", inset: "15% 18%", pointerEvents: "none" }}>
      <div style={{ ...corner(0), top: 0, left: 0 }} />
      <div style={{ ...corner(90), top: 0, right: 0 }} />
      <div style={{ ...corner(270), bottom: 0, left: 0 }} />
      <div style={{ ...corner(180), bottom: 0, right: 0 }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
        <div style={{ position: "relative", width: 60, height: 40 }}>
          <div style={{ ...corner(0), top: 0, left: 0, width: 14, height: 14, opacity: 0.5 }} />
          <div style={{ ...corner(90), top: 0, right: 0, width: 14, height: 14, opacity: 0.5 }} />
          <div style={{ ...corner(270), bottom: 0, left: 0, width: 14, height: 14, opacity: 0.5 }} />
          <div style={{ ...corner(180), bottom: 0, right: 0, width: 14, height: 14, opacity: 0.5 }} />
        </div>
      </div>
    </div>
  );
}
