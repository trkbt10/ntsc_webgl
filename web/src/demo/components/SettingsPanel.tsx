import type { ParamState } from "../presets";
import {
  RANGE_PARAMS,
  CHECKBOX_PARAMS,
  PRESETS,
  paramToSlider,
  sliderToParam,
  displayValue,
} from "../presets";

const SLIDER_CONFIG: Record<
  string,
  { label: string; min: number; max: number; section: string }
> = {
  video_noise: { label: "Noise", min: 0, max: 200, section: "Signal" },
  composite_preemphasis: { label: "Preemphasis", min: 0, max: 80, section: "Signal" },
  subcarrier_amplitude: { label: "Subcarrier", min: 10, max: 200, section: "Signal" },
  video_chroma_noise: { label: "Chroma Noise", min: 0, max: 4000, section: "Color" },
  video_chroma_phase_noise: { label: "Phase Noise", min: 0, max: 50, section: "Color" },
  color_bleed_horiz: { label: "Color Bleed H", min: 0, max: 10, section: "Color" },
  color_bleed_vert: { label: "Color Bleed V", min: 0, max: 10, section: "Color" },
  video_chroma_loss: { label: "Chroma Loss", min: 0, max: 50000, section: "Color" },
  vhs_out_sharpen: { label: "Sharpen", min: 10, max: 50, section: "VHS" },
  vhs_edge_wave: { label: "Edge Wave", min: 0, max: 10, section: "VHS" },
};

const TOGGLE_CONFIG: Record<string, { label: string; section: string }> = {
  composite_in_chroma_lowpass: { label: "Input Lowpass", section: "Filter" },
  composite_out_chroma_lowpass: { label: "Output Lowpass", section: "Filter" },
  emulating_vhs: { label: "VHS Mode", section: "VHS" },
};

const PRESET_LABELS: Record<string, string> = {
  broadcast: "Broadcast",
  vhs: "VHS",
  bad_reception: "Bad Signal",
  clean: "Clean",
};

interface SettingsPanelProps {
  params: ParamState;
  activePreset: string;
  onParamChange: (name: string, value: number | boolean) => void;
  onPresetChange: (name: string) => void;
}

export function SettingsPanel({
  params,
  activePreset,
  onParamChange,
  onPresetChange,
}: SettingsPanelProps) {
  // Group controls by section
  const sections = new Map<string, string[]>();
  for (const param of RANGE_PARAMS) {
    const cfg = SLIDER_CONFIG[param];
    if (!cfg) continue;
    if (!sections.has(cfg.section)) sections.set(cfg.section, []);
    sections.get(cfg.section)!.push(param);
  }
  for (const param of CHECKBOX_PARAMS) {
    const cfg = TOGGLE_CONFIG[param];
    if (!cfg) continue;
    if (!sections.has(cfg.section)) sections.set(cfg.section, []);
    sections.get(cfg.section)!.push(param);
  }

  return (
    <div style={{ padding: "4px 20px 24px" }}>
      {/* Presets */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {Object.keys(PRESETS).map((name) => (
          <button
            key={name}
            onClick={() => onPresetChange(name)}
            style={{
              flexShrink: 0,
              padding: "6px 14px",
              borderRadius: 20,
              border: `1px solid rgba(255,255,255,${activePreset === name ? 0.4 : 0.2})`,
              background: activePreset === name ? "rgba(255,255,255,0.2)" : "transparent",
              color: activePreset === name ? "#fff" : "rgba(255,255,255,0.8)",
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {PRESET_LABELS[name] ?? name}
          </button>
        ))}
      </div>

      {/* Sections */}
      {Array.from(sections.entries()).map(([section, paramNames]) => (
        <div key={section}>
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              color: "rgba(255,255,255,0.35)",
              margin: "14px 0 8px",
            }}
          >
            {section}
          </div>
          {paramNames.map((param) => {
            if (param in TOGGLE_CONFIG) {
              const cfg = TOGGLE_CONFIG[param];
              const checked = !!params[param];
              return (
                <div
                  key={param}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                    {cfg.label}
                  </span>
                  <label style={{ position: "relative", width: 44, height: 26, flexShrink: 0 }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => onParamChange(param, e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: checked ? "rgba(100,220,100,0.6)" : "rgba(255,255,255,0.15)",
                        borderRadius: 13,
                        transition: "background 0.2s",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: 3,
                          left: 3,
                          width: 20,
                          height: 20,
                          background: "#fff",
                          borderRadius: "50%",
                          transition: "transform 0.2s",
                          transform: checked ? "translateX(18px)" : "translateX(0)",
                        }}
                      />
                    </span>
                  </label>
                </div>
              );
            }

            const cfg = SLIDER_CONFIG[param];
            if (!cfg) return null;
            const value = params[param] as number;
            const sliderVal = paramToSlider(param, value);
            return (
              <div
                key={param}
                style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.7)",
                    minWidth: 90,
                    flexShrink: 0,
                  }}
                >
                  {cfg.label}
                </span>
                <input
                  type="range"
                  min={cfg.min}
                  max={cfg.max}
                  value={sliderVal}
                  onChange={(e) =>
                    onParamChange(param, sliderToParam(param, parseFloat(e.target.value)))
                  }
                  style={{ flex: 1 }}
                />
                <span
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.4)",
                    minWidth: 32,
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {displayValue(param, value)}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
