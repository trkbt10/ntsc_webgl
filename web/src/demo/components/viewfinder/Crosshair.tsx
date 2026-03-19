/**
 * @source None — decorative compositional guide
 * @description Center crosshair targeting mark.
 */

export function Crosshair() {
  return (
    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none" }}>
      <div style={{ width: 16, height: 2, background: "rgba(255,255,255,0.5)", position: "absolute", top: -1, left: -8 }} />
      <div style={{ width: 2, height: 16, background: "rgba(255,255,255,0.5)", position: "absolute", top: -8, left: -1 }} />
    </div>
  );
}
