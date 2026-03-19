/**
 * @source navigator.getBattery() — Battery Status API
 * @support Chrome/Edge/Android: yes | Safari/iOS/Firefox: no
 * @description Shows battery level. When unsupported, renders with strikethrough.
 */

interface BatteryIconProps {
  level: number | null;
  supported: boolean;
}

export function BatteryIcon({ level, supported }: BatteryIconProps) {
  if (!supported || level === null) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 3, opacity: 0.3 }}>
        <div style={{ width: 26, height: 13, border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: 2, position: "relative" }}>
          <div style={{ position: "absolute", right: -4, width: 2.5, height: 6, background: "rgba(255,255,255,0.3)", borderRadius: "0 1px 1px 0" }} />
          {/* Strikethrough to indicate unavailable */}
          <div style={{ position: "absolute", top: "50%", left: -2, right: -6, height: 1.5, background: "rgba(255,100,100,0.6)", transform: "rotate(-15deg)" }} />
        </div>
      </div>
    );
  }

  const pct = Math.max(0, Math.min(1, level));
  const color = pct < 0.2 ? "#e00" : pct < 0.5 ? "#fa0" : "#fff";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      <div style={{ width: 26, height: 13, border: `1.5px solid ${color}`, borderRadius: 2, position: "relative", display: "flex", alignItems: "center", padding: 1 }}>
        <div style={{ height: "100%", width: `${pct * 100}%`, background: color, borderRadius: 1 }} />
        <div style={{ position: "absolute", right: -4, width: 2.5, height: 6, background: color, borderRadius: "0 1px 1px 0" }} />
      </div>
    </div>
  );
}
