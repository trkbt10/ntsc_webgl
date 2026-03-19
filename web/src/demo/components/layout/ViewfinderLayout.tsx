import type { LayoutProps } from "./types";
import { type LayoutPreset, LAYOUT_REGISTRY } from "./registry";

interface Props extends LayoutProps {
  preset: LayoutPreset;
}

export function ViewfinderLayout({ preset, ...props }: Props) {
  const entry = LAYOUT_REGISTRY[preset];
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5 }}>
      {entry.component(props)}
    </div>
  );
}
