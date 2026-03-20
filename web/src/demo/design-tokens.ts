/**
 * Design tokens — single source of truth for viewfinder UI.
 *
 * Grid system: 8px base unit (1U).
 * Button ratio: 3:2 (primary 9U : secondary 6U).
 * Tap targets: secondary ≥ 48px (Material 48dp / Apple HIG 44pt).
 */

// ── Base grid ────────────────────────────────────────────────

export const BASE_UNIT = 8;

// ── Control button sizes (px) ───────────────────────────────

export const CONTROL = {
  /** Primary action button (record / shutter) — 9U, 3:2 ratio to secondary */
  primary: { size: 72, iconScale: 0.44, borderWidth: 3 },
  /** Secondary buttons (flip, mode toggle, gallery) — 6U */
  secondary: { size: 48, iconScale: 0.5, borderWidth: 1.5 },
  /** Icon stroke width inside buttons */
  iconStroke: 2,
  /** Minimum touch target — Apple HIG 44pt / Material 48dp */
  minTouchTarget: 48,
} as const;

/** Compute icon pixel size for a given button size and variant */
export function iconSize(size: number, variant: "primary" | "secondary" = "secondary"): number {
  return Math.round(size * CONTROL[variant].iconScale);
}

// ── Visual ratios (button inner shapes) ─────────────────────

export const RATIO = {
  /** ShutterButton inner circle relative to button size */
  shutterInner: 0.78,
  /** RecordButton idle circle relative to button size */
  recordIdle: 0.75,
  /** RecordButton active square relative to button size */
  recordActive: 0.39,
  /** ControlButton border radius relative to button size */
  controlRadius: 0.17,
} as const;

// ── Per-preset scale multipliers ────────────────────────────

export const PRESET_SCALE: Record<string, { landscape: number; portrait: number }> = {
  classic: { landscape: 1.0, portrait: 1.0 },
  modern:  { landscape: 0.92, portrait: 0.88 },
  cinema:  { landscape: 0.78, portrait: 0.85 },
  minimal: { landscape: 0.88, portrait: 0.88 },
  none:    { landscape: 1.0, portrait: 1.0 },
};

export function controlSizes(preset: string, orientation: "landscape" | "portrait") {
  const s = PRESET_SCALE[preset] ?? PRESET_SCALE.classic;
  const scale = orientation === "landscape" ? s.landscape : s.portrait;
  return {
    primary: Math.round(CONTROL.primary.size * scale),
    secondary: Math.max(CONTROL.minTouchTarget, Math.round(CONTROL.secondary.size * scale)),
    iconStroke: CONTROL.iconStroke,
  };
}

// ── Colors ──────────────────────────────────────────────────

export const COLOR = {
  rec: "#e00",
  textPrimary: "#fff",
  textSecondary: "rgba(255,255,255,0.5)",
  textMuted: "rgba(255,255,255,0.35)",
  textFaint: "rgba(255,255,255,0.25)",
  controlBorder: "rgba(255,255,255,0.4)",
  controlBorderStrong: "rgba(255,255,255,0.6)",
  controlBorderSubtle: "rgba(255,255,255,0.2)",
  controlBg: "rgba(0,0,0,0.35)",
  overlayBg: "rgba(0,0,0,0.95)",
  panelBg: "rgba(0,0,0,0.75)",
  surfaceBg: "rgba(255,255,255,0.08)",
  surfaceBgHover: "rgba(255,255,255,0.15)",
  photoBadge: "rgba(0,120,255,0.8)",
  videoBadge: "rgba(224,0,0,0.8)",
  dangerBorder: "rgba(255,80,80,0.4)",
  dangerBg: "rgba(80,0,0,0.7)",
  dangerText: "#ff6666",
  datestamp: "#f8a020",
  gradientTop: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
  gradientBottom: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)",
  gradientFade: "linear-gradient(transparent, rgba(0,0,0,0.7))",
  separator: "rgba(255,255,255,0.1)",
  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
} as const;

// ── Typography ──────────────────────────────────────────────

export const FONT = {
  mono: "monospace",
  ui: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  hardware: "'Arial Black', 'Helvetica Neue', sans-serif",
} as const;

// ── Z-Index layers ──────────────────────────────────────────

export const Z = {
  canvas: 1,
  content: 1,
  viewfinder: 5,
  header: 10,
  menuButton: 20,
  drawer: 30,
  menu: 50,
  loading: 100,
  gallery: 200,
} as const;

// ── View transition names ───────────────────────────────────

export const TRANSITION = {
  galleryModal: "gallery-modal",
  galleryPreview: "gallery-preview",
  galleryButton: "gallery-button",
  galleryItem: (id: string) => `gallery-item-${id}`,
} as const;

// ── Spacing (8px grid) ──────────────────────────────────────

export const SPACING = {
  /** 2U — between adjacent buttons */
  controlGap: 16,
  /** 3U — between button groups (left ↔ primary ↔ right) */
  controlGroupGap: 24,
  /** 3U — viewport edge padding */
  edgePad: 24,
  /** 2U — bottom padding inside control bar */
  barPadBottom: 16,
} as const;

// ── Badge (gallery count) ───────────────────────────────────

export const BADGE = {
  size: 16,          // 2U
  offset: -4,        // -0.5U
  fontSize: 9,
  borderRadius: 8,   // 1U
} as const;

// ── Layout positions (viewport-relative) ────────────────────

export const LAYOUT = {
  topBarHeight:     { landscape: "8%",  portrait: "6%" },
  bottomZone:       { landscape: "14%", portrait: "24%" },
  controlRowBottom: { landscape: "5%",  portrait: "4%" },
} as const;

// ── Hardware button style (MENU button family) ──────────────

export const HARDWARE_BUTTON: React.CSSProperties = {
  fontFamily: FONT.hardware,
  fontWeight: 800,
  letterSpacing: 2,
  color: COLOR.textPrimary,
  textShadow: "0 1px 2px rgba(0,0,0,0.8)",
  background: "linear-gradient(180deg, #555 0%, #222 50%, #444 100%)",
  border: `2px solid ${COLOR.controlBorder}`,
  borderRadius: 6,
  boxShadow: "0 2px 6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15)",
  cursor: "pointer",
  userSelect: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
};

export const HARDWARE_BUTTON_ACTIVE: React.CSSProperties = {
  ...HARDWARE_BUTTON,
  background: "linear-gradient(180deg, #666 0%, #333 50%, #555 100%)",
  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5)",
};

export const HARDWARE_BUTTON_DANGER: React.CSSProperties = {
  ...HARDWARE_BUTTON,
  background: "linear-gradient(180deg, #600 0%, #300 50%, #500 100%)",
  border: `2px solid ${COLOR.dangerBorder}`,
};
