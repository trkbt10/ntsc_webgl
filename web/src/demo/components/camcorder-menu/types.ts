import type { LucideIcon } from "lucide-react";
import type { ParamState } from "../../presets";
import type { CamcorderDisplayState } from "../../camcorder-settings";
import type { LayoutPreset } from "../layout";

// ── Menu category schema ────────────────────────────────────

export interface MenuCategoryEntry {
  icon: LucideIcon;
  label: string;
  action: MenuAction;
}

export type MenuAction = "close" | MenuCategory;
export type MenuCategory = "camera" | "quality" | "audio" | "display" | "recording";

// ── Component props ─────────────────────────────────────────

export interface CamcorderMenuProps {
  paramValues: ParamState;
  activePreset: string;
  onParamChange: (name: string, value: number | boolean) => void;
  onPresetChange: (name: string) => void;
  overlayPreset: LayoutPreset;
  onLayoutPresetChange: (p: LayoutPreset) => void;
  camcorderState: CamcorderDisplayState;
  onStateChange: (key: string, value: string | number | boolean) => void;
}

export interface MenuOverlayProps extends CamcorderMenuProps {
  onClose: () => void;
}
