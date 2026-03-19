/**
 * Layout preset registry — the single source of truth.
 * To add a new preset:
 *   1. Create a component file in presets/
 *   2. Add one entry here
 * No other files need to change.
 */
import type { LayoutProps } from "./types";
import { NoneLayout } from "./presets/NoneLayout";
import { ClassicLayout } from "./presets/ClassicLayout";
import { ModernLayout } from "./presets/ModernLayout";
import { CinemaLayout } from "./presets/CinemaLayout";
import { MinimalLayout } from "./presets/MinimalLayout";

export type LayoutPreset = "none" | "classic" | "modern" | "cinema" | "minimal";

interface PresetEntry {
  label: string;
  component: (p: LayoutProps) => React.ReactNode;
}

export const LAYOUT_REGISTRY: Record<LayoutPreset, PresetEntry> = {
  none:    { label: "OFF",        component: (p) => <NoneLayout {...p} /> },
  classic: { label: "クラシック", component: (p) => <ClassicLayout {...p} /> },
  modern:  { label: "モダン",     component: (p) => <ModernLayout {...p} /> },
  cinema:  { label: "シネマ",     component: (p) => <CinemaLayout {...p} /> },
  minimal: { label: "ミニマル",   component: (p) => <MinimalLayout {...p} /> },
};

export const LAYOUT_PRESETS = Object.keys(LAYOUT_REGISTRY) as LayoutPreset[];
