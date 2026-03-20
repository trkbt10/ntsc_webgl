import { useState } from "react";
import {
  resolveDiscreteValue,
  getOptionLabel,
  type CamcorderSetting,
  type CamcorderDisplayState,
} from "../../camcorder-settings";
import type { ParamState } from "../../presets";
import { isFormatSupported } from "../../utils/mime";
import { Row, ToggleBtn, RangeRow, DiscreteRow } from "./SettingControls";

/** Annotate unsupported recording formats — computed once at module level */
function annotateFormatOptions(options: { label: string; value: string }[]): { label: string; value: string }[] {
  return options.map((o) => {
    const supported = isFormatSupported(o.value);
    return supported ? o : { ...o, label: `${o.label} (非対応)` };
  });
}

interface SettingRowProps {
  setting: CamcorderSetting;
  currentParams: ParamState;
  onParamChange: (name: string, value: number | boolean) => void;
  camcorderState: CamcorderDisplayState;
  onStateChange: (key: string, value: string | number | boolean) => void;
}

export function SettingRow({
  setting, currentParams, onParamChange, camcorderState, onStateChange,
}: SettingRowProps) {
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
    const isFormatSetting = control.stateKey === "recFormat";
    const options = isFormatSetting ? annotateFormatOptions(control.options) : control.options;
    const curLabel = options.find((o) => o.value === cur)?.label ?? cur;
    return (
      <DiscreteRow label={setting.label} currentValue={cur} currentLabel={curLabel}
        options={options} expanded={expanded} onToggle={() => setExpanded((v) => !v)}
        onSelect={(val) => {
          if (isFormatSetting && !isFormatSupported(val)) return;
          onStateChange(control.stateKey, val);
          setExpanded(false);
        }} />
    );
  }
  return null;
}
