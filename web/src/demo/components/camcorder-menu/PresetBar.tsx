import { PRESETS } from "./schema";
import { MENU_SIZE, MENU_COLOR } from "./tokens";

interface PresetBarProps {
  activePreset: string;
  onPresetChange: (name: string) => void;
}

export function PresetBar({ activePreset, onPresetChange }: PresetBarProps) {
  return (
    <div style={{ padding: "4px 6px 6px" }}>
      <div style={{ fontSize: 10, letterSpacing: 1, color: MENU_COLOR.textFaint, marginBottom: 4 }}>
        映像モード
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {PRESETS.map(({ label, preset }) => {
          const active = activePreset === preset;
          return (
            <button key={preset} onClick={() => onPresetChange(preset)} style={{
              padding: "3px 8px", borderRadius: 10, fontSize: MENU_SIZE.presetFontSize, cursor: "pointer",
              border: `1px solid ${active ? MENU_COLOR.accentBorderStrong : MENU_COLOR.chipBorder}`,
              background: active ? MENU_COLOR.accentBgSubtle : "transparent",
              color: active ? MENU_COLOR.accent : MENU_COLOR.textMuted,
            }}>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
