/**
 * Camcorder menu design tokens — single source of truth for all
 * sizes, colors, and spacing within the menu system.
 */
import type { CSSProperties } from "react";
import { COLOR, FONT } from "../../design-tokens";

// ── Sizing ──────────────────────────────────────────────────

export const MENU_SIZE = {
  /** Sidebar icon button height (landscape) */
  sidebarButtonH: 32,
  /** Sidebar icon button height (portrait tab bar) */
  tabButtonH: 36,
  /** Icon size inside sidebar/tab buttons */
  sidebarIcon: 16,
  /** Close icon size (slightly smaller for "X" feel) */
  closeIcon: 14,
  /** Menu title font size — matches close button line height */
  titleFontSize: 12,
  /** Menu title vertical padding */
  titlePadY: 8,
  /** Menu title horizontal padding */
  titlePadX: 10,
  /** Title row total height = titleFontSize + titlePadY*2 ≈ 28px */
  titleRowHeight: 28,
  /** Setting row font size */
  settingFontSize: 12,
  /** Setting value / toggle font size */
  settingValueFontSize: 11,
  /** Preset chip font size */
  presetFontSize: 11,
  /** Footer font size */
  footerFontSize: 10,
  /** Footer padding */
  footerPadY: 5,
  footerPadX: 10,
  /** Landscape sidebar width */
  sidebarWidth: "5%",
  /** Landscape content panel width */
  contentWidth: "28%",
  /** Portrait content panel height */
  contentHeight: "50%",
  /** MENU button padding */
  menuButtonPadY: 5,
  menuButtonPadX: 14,
  menuButtonFontSize: 13,
} as const;

// ── Menu-specific colors ────────────────────────────────────

export const MENU_COLOR = {
  accent: "#fc0",
  accentBorder: "rgba(255,200,0,0.4)",
  accentBorderStrong: "rgba(255,200,0,0.5)",
  accentBg: "rgba(255,200,0,0.15)",
  accentBgSubtle: "rgba(255,200,0,0.12)",
  textBody: "rgba(255,255,255,0.85)",
  textInactive: "rgba(255,255,255,0.4)",
  textMuted: "rgba(255,255,255,0.5)",
  textFaint: "rgba(255,255,255,0.3)",
  toggleOff: "rgba(255,255,255,0.15)",
  chipBorder: "rgba(255,255,255,0.12)",
  chipBorderInactive: "rgba(255,255,255,0.1)",
  rowBorder: "rgba(255,255,255,0.05)",
  titleBorder: "rgba(255,255,255,0.06)",
  panelBg: COLOR.panelBg,
  sidebarBg: "#000",
} as const;

// ── Shared inline styles ────────────────────────────────────

export const MENU_TITLE_STYLE: CSSProperties = {
  fontSize: MENU_SIZE.titleFontSize,
  fontWeight: 500,
  lineHeight: `${MENU_SIZE.titleRowHeight - MENU_SIZE.titlePadY * 2}px`,
  color: MENU_COLOR.textBody,
  padding: `${MENU_SIZE.titlePadY}px ${MENU_SIZE.titlePadX}px`,
  borderBottom: `1px solid ${MENU_COLOR.titleBorder}`,
  flexShrink: 0,
  height: MENU_SIZE.titleRowHeight,
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
};

export const MENU_FOOTER_STYLE: CSSProperties = {
  flexShrink: 0,
  padding: `${MENU_SIZE.footerPadY}px ${MENU_SIZE.footerPadX}px`,
  borderTop: `1px solid ${MENU_COLOR.titleBorder}`,
  background: "none",
  border: "none",
  fontSize: MENU_SIZE.footerFontSize,
  color: MENU_COLOR.textFaint,
  cursor: "pointer",
  textAlign: "left",
  height: MENU_SIZE.titleRowHeight,
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  fontFamily: FONT.ui,
};
