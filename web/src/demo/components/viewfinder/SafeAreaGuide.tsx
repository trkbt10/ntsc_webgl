/**
 * @source None — decorative compositional guide
 * @description Safe area boundary indicator.
 */

export function SafeAreaGuide() {
  return (
    <div style={{ position: "absolute", inset: "8% 10%", border: "1px dashed rgba(255,255,255,0.12)", pointerEvents: "none" }} />
  );
}
