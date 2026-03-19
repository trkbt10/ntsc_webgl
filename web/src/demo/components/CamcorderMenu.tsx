/**
 * Camcorder-style settings menu.
 * Layout replicates Sony FDR-AX700 menu:
 *   - Narrow icon sidebar (~7% width, opaque black)
 *   - Content panel (~26% width, semi-transparent)
 *   - Remaining ~67%: transparent, video shows through
 *   - "MENU 終了" at absolute bottom-left
 */
import { useState } from "react";
import { useOrientation } from "../hooks/useOrientation";
import { LayoutPresetPicker, type LayoutPreset } from "./layout";
import {
  getSettingsByCategory,
  resolveDiscreteValue,
  getOptionLabel,
  type CamcorderSetting,
  type CamcorderDisplayState,
} from "../camcorder-settings";
import { type ParamState } from "../presets";
import { HARDWARE_BUTTON, HARDWARE_BUTTON_ACTIVE } from "../design-tokens";

/* ── Retro MENU button ── */
function MenuButton({ onClick, active }: { onClick: () => void; active: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...(active ? HARDWARE_BUTTON_ACTIVE : HARDWARE_BUTTON),
        padding: "5px 14px", fontSize: 13,
      }}
    >
      MENU
    </button>
  );
}

/* ── Category sidebar ── */
const MENU_CATEGORIES = [
  { icon: "✕", label: "閉じる", action: "close" as const },
  { icon: "📷", label: "信号設定", action: "camera" as const },
  { icon: "🎨", label: "画質設定", action: "quality" as const },
  { icon: "♪", label: "表示・音声", action: "audio" as const },
  { icon: "⚙", label: "オーバーレイ", action: "display" as const },
] as const;

type MenuCategory = (typeof MENU_CATEGORIES)[number]["action"];

const CATEGORY_TITLES: Record<string, string> = {
  camera: "信号設定",
  quality: "画質設定",
  audio: "表示・音声",
  display: "オーバーレイ設定",
};

/* ── Setting row controls ── */
function CamcorderSettingRow({
  setting, currentParams, onParamChange, camcorderState, onStateChange,
}: {
  setting: CamcorderSetting;
  currentParams: ParamState;
  onParamChange: (name: string, value: number | boolean) => void;
  camcorderState: CamcorderDisplayState;
  onStateChange: (key: string, value: string | number | boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { control } = setting;

  if (control.type === "toggle") {
    const checked = !!currentParams[control.param];
    return (
      <Row label={setting.label}>
        <ToggleBtn checked={checked} onChange={() => onParamChange(control.param, !checked)} />
      </Row>
    );
  }
  if (control.type === "state-toggle") {
    const checked = !!(camcorderState as any)[control.stateKey];
    return (
      <Row label={setting.label}>
        <ToggleBtn checked={checked} onChange={() => onStateChange(control.stateKey, !checked)} />
      </Row>
    );
  }
  if (control.type === "range") {
    const value = (currentParams[control.param] as number) ?? control.min;
    return (
      <RangeRow label={setting.label} value={value} min={control.min} max={control.max} step={control.step}
        displayFn={control.displayFn} onChange={(v) => onParamChange(control.param, v)} />
    );
  }
  if (control.type === "state-range") {
    const value = ((camcorderState as any)[control.stateKey] as number) ?? control.min;
    return (
      <RangeRow label={setting.label} value={value} min={control.min} max={control.max} step={control.step}
        displayFn={control.displayFn} onChange={(v) => onStateChange(control.stateKey, v)} />
    );
  }
  if (control.type === "discrete") {
    const cur = resolveDiscreteValue(setting, currentParams);
    const curLabel = getOptionLabel(setting, cur);
    return (
      <DiscreteRow label={setting.label} currentValue={cur} currentLabel={curLabel}
        options={control.options.map((o) => ({ label: o.label, value: o.value }))}
        expanded={expanded} onToggle={() => setExpanded((v) => !v)}
        onSelect={(val) => {
          const opt = control.options.find((o) => o.value === val);
          if (opt) for (const [k, v] of Object.entries(opt.params)) onParamChange(k, v);
          setExpanded(false);
        }} />
    );
  }
  if (control.type === "state-discrete") {
    const cur = String((camcorderState as any)[control.stateKey] ?? control.options[0]?.value);
    const curLabel = control.options.find((o) => o.value === cur)?.label ?? cur;
    return (
      <DiscreteRow label={setting.label} currentValue={cur} currentLabel={curLabel}
        options={control.options} expanded={expanded} onToggle={() => setExpanded((v) => !v)}
        onSelect={(val) => { onStateChange(control.stateKey, val); setExpanded(false); }} />
    );
  }
  return null;
}

/* ── Shared sub-components ── */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 6px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>{label}</span>
      {children}
    </div>
  );
}

function ToggleBtn({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} style={{
      fontSize: 11, fontWeight: 600,
      color: checked ? "#fc0" : "rgba(255,255,255,0.4)",
      background: "none",
      border: `1px solid ${checked ? "rgba(255,200,0,0.4)" : "rgba(255,255,255,0.15)"}`,
      borderRadius: 4, padding: "2px 8px", cursor: "pointer",
    }}>
      {checked ? "入" : "切"}
    </button>
  );
}

function RangeRow({ label, value, min, max, step, displayFn, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  displayFn: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div style={{ padding: "6px 6px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>{label}</span>
        <span style={{ fontFamily: "monospace", fontSize: 11, color: "#fc0" }}>{displayFn(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: "#fc0" }} />
    </div>
  );
}

function DiscreteRow({ label, currentValue, currentLabel, options, expanded, onToggle, onSelect }: {
  label: string; currentValue: string; currentLabel: string;
  options: { label: string; value: string }[];
  expanded: boolean; onToggle: () => void; onSelect: (value: string) => void;
}) {
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 6px", cursor: "pointer" }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>{label}</span>
        <span style={{ fontSize: 11, color: "#fc0", fontFamily: "monospace" }}>{currentLabel} ▸</span>
      </div>
      {expanded && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, padding: "2px 6px 8px" }}>
          {options.map((opt) => (
            <button key={opt.value} onClick={() => onSelect(opt.value)} style={{
              padding: "3px 8px", borderRadius: 5, fontSize: 11, cursor: "pointer",
              border: `1px solid ${opt.value === currentValue ? "rgba(255,200,0,0.5)" : "rgba(255,255,255,0.1)"}`,
              background: opt.value === currentValue ? "rgba(255,200,0,0.15)" : "transparent",
              color: opt.value === currentValue ? "#fc0" : "rgba(255,255,255,0.7)",
            }}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Preset bar ── */
const PRESETS = [
  { label: "放送", preset: "broadcast" },
  { label: "VHS", preset: "vhs" },
  { label: "悪受信", preset: "bad_reception" },
  { label: "クリーン", preset: "clean" },
];

function PresetBar({ activePreset, onPresetChange }: { activePreset: string; onPresetChange: (name: string) => void }) {
  return (
    <div style={{ padding: "4px 6px 6px" }}>
      <div style={{ fontSize: 10, letterSpacing: 1, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>映像モード</div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {PRESETS.map(({ label, preset }) => (
          <button key={preset} onClick={() => onPresetChange(preset)} style={{
            padding: "3px 8px", borderRadius: 10, fontSize: 11, cursor: "pointer",
            border: `1px solid ${activePreset === preset ? "rgba(255,200,0,0.5)" : "rgba(255,255,255,0.12)"}`,
            background: activePreset === preset ? "rgba(255,200,0,0.12)" : "transparent",
            color: activePreset === preset ? "#fc0" : "rgba(255,255,255,0.5)",
          }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Menu overlay — proportions match Sony FDR-AX700:
   Sidebar ~7% | Content ~26% | Transparent ~67%
   ══════════════════════════════════════════════ */
function MenuOverlay({
  onClose, paramValues, activePreset, onParamChange, onPresetChange,
  overlayPreset, onLayoutPresetChange, camcorderState, onStateChange,
}: {
  onClose: () => void;
  paramValues: ParamState;
  activePreset: string;
  onParamChange: (name: string, value: number | boolean) => void;
  onPresetChange: (name: string) => void;
  overlayPreset: LayoutPreset;
  onLayoutPresetChange: (p: LayoutPreset) => void;
  camcorderState: CamcorderDisplayState;
  onStateChange: (key: string, value: string | number | boolean) => void;
}) {
  const [cat, setCat] = useState<MenuCategory>("camera");

  const content = () => {
    if (cat === "display") {
      return (
        <>
          <LayoutPresetPicker value={overlayPreset} onChange={onLayoutPresetChange} />
          <div style={{ marginTop: 8 }}>
            {getSettingsByCategory("display").map((s) => (
              <CamcorderSettingRow key={s.id} setting={s} currentParams={paramValues}
                onParamChange={onParamChange} camcorderState={camcorderState} onStateChange={onStateChange} />
            ))}
          </div>
        </>
      );
    }
    const settings = getSettingsByCategory(cat);
    return (
      <>
        {(cat === "camera" || cat === "quality") && (
          <PresetBar activePreset={activePreset} onPresetChange={onPresetChange} />
        )}
        {settings.map((s) => (
          <CamcorderSettingRow key={s.id} setting={s} currentParams={paramValues}
            onParamChange={onParamChange} camcorderState={camcorderState} onStateChange={onStateChange} />
        ))}
      </>
    );
  };

  const orientation = useOrientation();
  const L = orientation === "landscape";

  /* Shared content panel inner */
  const contentInner = (
    <>
      <div style={{
        fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.9)",
        padding: "8px 10px 5px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        {CATEGORY_TITLES[cat]}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 4px" }}>
        {content()}
      </div>
      <button onClick={onClose} style={{
        flexShrink: 0, padding: "5px 10px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "none", border: "none",
        fontSize: 10, color: "rgba(255,255,255,0.35)",
        cursor: "pointer", textAlign: "left",
      }}>
        MENU 終了
      </button>
    </>
  );

  /* Shared sidebar icons */
  const sidebar = (horizontal: boolean) => (
    <div style={{
      background: "#000",
      display: "flex",
      flexDirection: horizontal ? "row" : "column",
      ...(horizontal
        ? { width: "100%", justifyContent: "flex-start", gap: 0 }
        : { paddingTop: "1%" }),
    }}>
      {MENU_CATEGORIES.map((c) => {
        const isActive = c.action !== "close" && cat === c.action;
        return (
          <button key={c.action}
            onClick={() => c.action === "close" ? onClose() : setCat(c.action)}
            title={c.label}
            style={{
              ...(horizontal
                ? { width: "20%", height: 36 }
                : { width: "100%", height: 32 }),
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: c.action === "close" ? 13 : 15,
              background: "transparent", border: "none",
              color: isActive ? "#fc0" : "rgba(255,255,255,0.4)",
              cursor: "pointer",
            }}
          >
            {c.icon}
          </button>
        );
      })}
    </div>
  );

  if (L) {
    /* ── Landscape: left sidebar + content panel (reference image layout) ── */
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 50, display: "flex", pointerEvents: "auto" }}>
        {/* Sidebar: 5% width */}
        <div style={{ width: "5%", display: "flex", flexDirection: "column" }}>
          {sidebar(false)}
        </div>
        {/* Content: 28% width */}
        <div style={{
          width: "28%", background: "rgba(0,0,0,0.75)",
          overflowY: "auto", display: "flex", flexDirection: "column",
        }}>
          {contentInner}
        </div>
        {/* Transparent tap-to-close */}
        <div onClick={onClose} style={{ flex: 1, cursor: "pointer" }} />
      </div>
    );
  }

  /* ── Portrait: bottom sheet (full width, top tab bar + content ~50% height) ── */
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", pointerEvents: "auto" }}>
      {/* Top transparent tap-to-close */}
      <div onClick={onClose} style={{ flex: 1, cursor: "pointer" }} />
      {/* Tab bar: horizontal icons, full width */}
      {sidebar(true)}
      {/* Content panel: ~50% of screen height */}
      <div style={{
        height: "50%", background: "rgba(0,0,0,0.75)",
        overflowY: "auto", display: "flex", flexDirection: "column",
      }}>
        {contentInner}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Exported CamcorderMenu
   ══════════════════════════════════════════════ */
interface CamcorderMenuProps {
  paramValues: ParamState;
  activePreset: string;
  onParamChange: (name: string, value: number | boolean) => void;
  onPresetChange: (name: string) => void;
  overlayPreset: LayoutPreset;
  onLayoutPresetChange: (p: LayoutPreset) => void;
  camcorderState: CamcorderDisplayState;
  onStateChange: (key: string, value: string | number | boolean) => void;
}

export function CamcorderMenu(props: CamcorderMenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 20, pointerEvents: "auto" }}>
        <MenuButton onClick={() => setOpen((v) => !v)} active={open} />
      </div>
      {open && <MenuOverlay onClose={() => setOpen(false)} {...props} />}
    </>
  );
}
