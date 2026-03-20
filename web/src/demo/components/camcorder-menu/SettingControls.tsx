/**
 * Shared setting row sub-components used by SettingRow.
 */
import { MENU_SIZE, MENU_COLOR } from "./tokens";

export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 6px", borderBottom: `1px solid ${MENU_COLOR.rowBorder}`,
    }}>
      <span style={{ fontSize: MENU_SIZE.settingFontSize, color: MENU_COLOR.textBody }}>{label}</span>
      {children}
    </div>
  );
}

export function ToggleBtn({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} style={{
      fontSize: MENU_SIZE.settingValueFontSize, fontWeight: 600,
      color: checked ? MENU_COLOR.accent : MENU_COLOR.textInactive,
      background: "none",
      border: `1px solid ${checked ? MENU_COLOR.accentBorder : MENU_COLOR.toggleOff}`,
      borderRadius: 4, padding: "2px 8px", cursor: "pointer",
    }}>
      {checked ? "入" : "切"}
    </button>
  );
}

export function RangeRow({ label, value, min, max, step, displayFn, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  displayFn: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div style={{ padding: "6px 6px", borderBottom: `1px solid ${MENU_COLOR.rowBorder}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ fontSize: MENU_SIZE.settingFontSize, color: MENU_COLOR.textBody }}>{label}</span>
        <span style={{ fontFamily: "monospace", fontSize: MENU_SIZE.settingValueFontSize, color: MENU_COLOR.accent }}>{displayFn(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: MENU_COLOR.accent }} />
    </div>
  );
}

export function DiscreteRow({ label, currentValue, currentLabel, options, expanded, onToggle, onSelect }: {
  label: string; currentValue: string; currentLabel: string;
  options: { label: string; value: string }[];
  expanded: boolean; onToggle: () => void; onSelect: (value: string) => void;
}) {
  return (
    <div style={{ borderBottom: `1px solid ${MENU_COLOR.rowBorder}` }}>
      <div onClick={onToggle} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 6px", cursor: "pointer",
      }}>
        <span style={{ fontSize: MENU_SIZE.settingFontSize, color: MENU_COLOR.textBody }}>{label}</span>
        <span style={{ fontSize: MENU_SIZE.settingValueFontSize, color: MENU_COLOR.accent, fontFamily: "monospace" }}>
          {currentLabel} ▸
        </span>
      </div>
      {expanded && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, padding: "2px 6px 8px" }}>
          {options.map((opt) => {
            const active = opt.value === currentValue;
            return (
              <button key={opt.value} onClick={() => onSelect(opt.value)} style={{
                padding: "3px 8px", borderRadius: 5, fontSize: MENU_SIZE.settingValueFontSize, cursor: "pointer",
                border: `1px solid ${active ? MENU_COLOR.accentBorderStrong : MENU_COLOR.chipBorderInactive}`,
                background: active ? MENU_COLOR.accentBg : "transparent",
                color: active ? MENU_COLOR.accent : "rgba(255,255,255,0.7)",
              }}>
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
