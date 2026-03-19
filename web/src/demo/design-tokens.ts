/**
 * Design tokens — single source of truth for viewfinder UI.
 * All control sizes, icon sizes, colors, and spacing derive from here.
 */

// ── Control button sizes (px) ───────────────────────────────
// Each preset scales from these base values via the `scale` multiplier.

export const CONTROL = {
  /** Primary action button (record / shutter) */
  primary: { size: 56, iconScale: 0.43 },
  /** Secondary buttons (flip, mode toggle, gallery, back) */
  secondary: { size: 36, iconScale: 0.5 },
  /** Icon stroke width inside buttons */
  iconStroke: 2,
} as const;

// ── Per-preset scale multipliers ────────────────────────────
// Layouts multiply base sizes by these to fit their density.

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
    secondary: Math.round(CONTROL.secondary.size * scale),
    iconStroke: CONTROL.iconStroke,
  };
}

// ── Colors ──────────────────────────────────────────────────

export const COLOR = {
  /** Recording / danger */
  rec: "#e00",
  /** Primary text */
  textPrimary: "#fff",
  /** Secondary text */
  textSecondary: "rgba(255,255,255,0.5)",
  /** Muted text */
  textMuted: "rgba(255,255,255,0.35)",
  /** Button border */
  controlBorder: "rgba(255,255,255,0.4)",
  /** Primary action border (record / shutter) */
  controlBorderStrong: "rgba(255,255,255,0.6)",
  /** Button background */
  controlBg: "rgba(0,0,0,0.35)",
  /** Overlay background */
  overlayBg: "rgba(0,0,0,0.95)",
  /** Photo mode badge */
  photoBadge: "rgba(0,120,255,0.8)",
  /** Video mode badge */
  videoBadge: "rgba(224,0,0,0.8)",
  /** Gradient top → transparent */
  gradientTop: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
  /** Gradient bottom → transparent */
  gradientBottom: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)",
} as const;

// ── Spacing ─────────────────────────────────────────────────

export const SPACING = {
  /** Gap between button groups */
  controlGap: 8,
  /** Padding from edge */
  edgePad: "3%",
} as const;

// ── Hardware button style (MENU button family) ──────────────
// Used for operational buttons: Back, Close, Download, Delete.
// Matches the camcorder MENU button aesthetic.

export const HARDWARE_BUTTON: React.CSSProperties = {
  fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
  fontWeight: 800,
  letterSpacing: 2,
  color: "#fff",
  textShadow: "0 1px 2px rgba(0,0,0,0.8)",
  background: "linear-gradient(180deg, #555 0%, #222 50%, #444 100%)",
  border: "2px solid rgba(255,255,255,0.35)",
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
  border: "2px solid rgba(255,80,80,0.4)",
};
