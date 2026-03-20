/**
 * Menu category schema — maps each menu tab to a lucide icon and label.
 * Adding/reordering categories only requires changing this array.
 */
import { X, Camera, Palette, Volume2, Layers, CircleDot } from "lucide-react";
import type { MenuCategoryEntry, MenuCategory } from "./types";

export const MENU_CATEGORIES: readonly MenuCategoryEntry[] = [
  { icon: X,         label: "閉じる",         action: "close" },
  { icon: Camera,    label: "信号設定",       action: "camera" },
  { icon: Palette,   label: "画質設定",       action: "quality" },
  { icon: Volume2,   label: "表示・音声",     action: "audio" },
  { icon: Layers,    label: "オーバーレイ",   action: "display" },
  { icon: CircleDot, label: "録画設定",       action: "recording" },
] as const;

export const CATEGORY_TITLES: Record<MenuCategory, string> = {
  camera:    "信号設定",
  quality:   "画質設定",
  audio:     "表示・音声",
  display:   "オーバーレイ設定",
  recording: "録画設定",
};

export const PRESETS = [
  { label: "放送",     preset: "broadcast" },
  { label: "VHS",       preset: "vhs" },
  { label: "悪受信",   preset: "bad_reception" },
  { label: "クリーン", preset: "clean" },
] as const;
