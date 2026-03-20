/**
 * Camcorder-style settings that map Japanese UI labels to NTSC shader parameters
 * OR to camcorder display state (for settings that affect overlay/UI, not NTSC processing).
 *
 * Every setting MUST be functional — no display-only stubs.
 */

export type SettingControl =
  // Controls an NTSC shader parameter
  | { type: "discrete"; options: { label: string; value: string; params: Record<string, number | boolean> }[] }
  | { type: "range"; param: string; min: number; max: number; step: number; displayFn: (v: number) => string }
  | { type: "toggle"; param: string }
  // Controls camcorder display state (non-NTSC, affects overlay/UI)
  | { type: "state-discrete"; stateKey: string; options: { label: string; value: string }[] }
  | { type: "state-range"; stateKey: string; min: number; max: number; step: number; displayFn: (v: number) => string }
  | { type: "state-toggle"; stateKey: string };

export interface CamcorderSetting {
  id: string;
  label: string;
  category: "camera" | "quality" | "audio" | "display" | "recording";
  control: SettingControl;
}

/** Non-NTSC camcorder state that affects overlay display and UI behavior */
export interface CamcorderDisplayState {
  recLevel: number;          // 0-100, controls AudioLevelMeter base amplitude in overlay
  windNr: boolean;           // wind noise display indicator on overlay
  autoIsoLimit: string;      // "200" | "400" | "800" | "1600" — display cap in overlay
  gridDisplay: boolean;      // show/hide ThirdsGrid in overlay
  histogram: boolean;        // show/hide histogram in overlay
  levelMeter: boolean;       // show/hide AudioLevelMeter in overlay
  // Camera input settings
  cameraResolution: string;  // "auto" | "480p" | "720p" | "1080p"
  cameraFps: string;         // "auto" | "15" | "24" | "30" | "60"
  // Recording settings
  recFps: number;            // canvas capture FPS (15/24/30/60)
  recBitrate: number;        // video bitrate in bps
  recFormat: string;         // "auto" | "webm" | "mp4"
  recAudio: boolean;         // mix camera audio into recording
  thumbWidth: number;        // thumbnail width in px
  thumbQuality: number;      // thumbnail JPEG quality (0.0-1.0)
  // Photo settings
  photoFormat: string;       // "png" | "jpeg"
  photoQuality: number;      // JPEG quality (0.3-1.0), only used when photoFormat=jpeg
}

export const DEFAULT_CAMCORDER_STATE: CamcorderDisplayState = {
  recLevel: 70,
  windNr: false,
  autoIsoLimit: "800",
  gridDisplay: false,
  histogram: false,
  levelMeter: true,
  cameraResolution: "auto",
  cameraFps: "auto",
  recFps: 30,
  recBitrate: 4_000_000,
  recFormat: "auto",
  recAudio: true,
  thumbWidth: 160,
  thumbQuality: 0.7,
  photoFormat: "png",
  photoQuality: 0.85,
};

export const CAMCORDER_SETTINGS: CamcorderSetting[] = [
  /* ──── カメラ設定 ──── */
  {
    id: "iso_gain",
    label: "ISO/ゲイン切換",
    category: "camera",
    control: {
      type: "discrete",
      options: [
        { label: "オート", value: "auto", params: { video_noise: 2 } },
        { label: "ISO 100", value: "100", params: { video_noise: 0 } },
        { label: "ISO 200", value: "200", params: { video_noise: 4 } },
        { label: "ISO 400", value: "400", params: { video_noise: 12 } },
        { label: "ISO 800", value: "800", params: { video_noise: 25 } },
        { label: "ISO 1600", value: "1600", params: { video_noise: 60 } },
        { label: "ISO 3200", value: "3200", params: { video_noise: 120 } },
        { label: "ISO 6400", value: "6400", params: { video_noise: 200 } },
      ],
    },
  },
  {
    id: "auto_iso_limit",
    label: "オートISOリミット",
    category: "camera",
    control: {
      type: "state-discrete",
      stateKey: "autoIsoLimit",
      options: [
        { label: "200", value: "200" },
        { label: "400", value: "400" },
        { label: "800", value: "800" },
        { label: "1600", value: "1600" },
      ],
    },
  },
  {
    id: "agc_limit",
    label: "AGCリミット",
    category: "camera",
    control: {
      type: "range",
      param: "video_noise",
      min: 0,
      max: 200,
      step: 1,
      displayFn: (v) => `${Math.round((v / 200) * 24)}dB`,
    },
  },
  {
    id: "wb_preset",
    label: "WBプリセット",
    category: "camera",
    control: {
      type: "discrete",
      options: [
        {
          label: "オート",
          value: "auto",
          params: { subcarrier_amplitude: 50, video_chroma_phase_noise: 0, video_chroma_noise: 0 },
        },
        {
          label: "☀ 太陽光",
          value: "daylight",
          params: { subcarrier_amplitude: 55, video_chroma_phase_noise: 0, video_chroma_noise: 0 },
        },
        {
          label: "☁ 曇り",
          value: "cloudy",
          params: { subcarrier_amplitude: 60, video_chroma_phase_noise: 1, video_chroma_noise: 50 },
        },
        {
          label: "💡 蛍光灯",
          value: "fluorescent",
          params: { subcarrier_amplitude: 45, video_chroma_phase_noise: 3, video_chroma_noise: 100 },
        },
        {
          label: "🔥 白熱灯",
          value: "tungsten",
          params: { subcarrier_amplitude: 40, video_chroma_phase_noise: 2, video_chroma_noise: 80, color_bleed_horiz: 2 },
        },
      ],
    },
  },
  {
    id: "wb_outdoor",
    label: "WB屋外レベル",
    category: "camera",
    control: {
      type: "range",
      param: "subcarrier_amplitude",
      min: 10,
      max: 200,
      step: 1,
      displayFn: (v) => {
        const kelvin = 3200 + Math.round((v / 200) * 6800);
        return `${kelvin}K`;
      },
    },
  },
  {
    id: "wb_color_temp",
    label: "WB色温度設定",
    category: "camera",
    control: {
      type: "range",
      param: "video_chroma_phase_noise",
      min: 0,
      max: 50,
      step: 0.5,
      displayFn: (v) => {
        const offset = Math.round(((v - 25) / 25) * 10);
        return `${offset >= 0 ? "+" : ""}${offset}`;
      },
    },
  },
  {
    id: "camera_resolution",
    label: "入力解像度",
    category: "camera",
    control: {
      type: "state-discrete",
      stateKey: "cameraResolution",
      options: [
        { label: "自動", value: "auto" },
        { label: "480p", value: "480p" },
        { label: "720p", value: "720p" },
        { label: "1080p", value: "1080p" },
      ],
    },
  },
  {
    id: "camera_fps",
    label: "入力フレームレート",
    category: "camera",
    control: {
      type: "state-discrete",
      stateKey: "cameraFps",
      options: [
        { label: "自動", value: "auto" },
        { label: "15fps", value: "15" },
        { label: "24fps", value: "24" },
        { label: "30fps", value: "30" },
        { label: "60fps", value: "60" },
      ],
    },
  },
  {
    id: "ae_shift",
    label: "AEシフト",
    category: "camera",
    control: {
      type: "range",
      param: "composite_preemphasis",
      min: 0,
      max: 8,
      step: 0.1,
      displayFn: (v) => {
        const ev = (((v - 4) / 4) * 2).toFixed(1);
        return `${Number(ev) >= 0 ? "+" : ""}${ev}EV`;
      },
    },
  },

  /* ──── 画質設定 ──── */
  {
    id: "noise_reduction",
    label: "ノイズリダクション",
    category: "quality",
    control: {
      type: "discrete",
      options: [
        { label: "切", value: "off", params: { video_noise: 12 } },
        { label: "弱", value: "low", params: { video_noise: 6 } },
        { label: "標準", value: "mid", params: { video_noise: 2 } },
        { label: "強", value: "high", params: { video_noise: 0 } },
      ],
    },
  },
  {
    id: "sharpness",
    label: "シャープネス",
    category: "quality",
    control: {
      type: "range",
      param: "vhs_out_sharpen",
      min: 1.0,
      max: 5.0,
      step: 0.1,
      displayFn: (v) => {
        const level = Math.round(((v - 1.5) / 3.5) * 6 - 3);
        return `${level >= 0 ? "+" : ""}${level}`;
      },
    },
  },
  {
    id: "saturation",
    label: "彩度調整",
    category: "quality",
    control: {
      type: "range",
      param: "subcarrier_amplitude",
      min: 10,
      max: 200,
      step: 1,
      displayFn: (v) => {
        const level = Math.round(((v - 50) / 50) * 3);
        return `${level >= 0 ? "+" : ""}${level}`;
      },
    },
  },
  {
    id: "contrast",
    label: "コントラスト",
    category: "quality",
    control: {
      type: "range",
      param: "composite_preemphasis",
      min: 0,
      max: 8,
      step: 0.1,
      displayFn: (v) => {
        const level = Math.round(((v - 4) / 4) * 3);
        return `${level >= 0 ? "+" : ""}${level}`;
      },
    },
  },
  {
    id: "color_bleed",
    label: "色にじみ",
    category: "quality",
    control: {
      type: "range",
      param: "color_bleed_horiz",
      min: 0,
      max: 10,
      step: 0.5,
      displayFn: (v) => String(Math.round(v)),
    },
  },
  {
    id: "color_bleed_v",
    label: "色にじみ(縦)",
    category: "quality",
    control: {
      type: "range",
      param: "color_bleed_vert",
      min: 0,
      max: 10,
      step: 0.5,
      displayFn: (v) => String(Math.round(v)),
    },
  },
  {
    id: "chroma_loss",
    label: "色抜け",
    category: "quality",
    control: {
      type: "range",
      param: "video_chroma_loss",
      min: 0,
      max: 50000,
      step: 100,
      displayFn: (v) => {
        if (v === 0) return "切";
        if (v < 5000) return "弱";
        if (v < 20000) return "中";
        return "強";
      },
    },
  },
  {
    id: "gamma_mode",
    label: "ガンマ設定",
    category: "quality",
    control: {
      type: "discrete",
      options: [
        {
          label: "スタンダード",
          value: "standard",
          params: { composite_preemphasis: 0, composite_in_chroma_lowpass: true, composite_out_chroma_lowpass: true },
        },
        {
          label: "シネマ",
          value: "cinema",
          params: { composite_preemphasis: 1, composite_in_chroma_lowpass: true, composite_out_chroma_lowpass: false },
        },
        {
          label: "ナチュラル",
          value: "natural",
          params: { composite_preemphasis: 0, composite_in_chroma_lowpass: false, composite_out_chroma_lowpass: false },
        },
      ],
    },
  },
  {
    id: "vhs_mode",
    label: "VHSモード",
    category: "quality",
    control: { type: "toggle", param: "emulating_vhs" },
  },
  {
    id: "edge_wave",
    label: "エッジ歪み",
    category: "quality",
    control: {
      type: "range",
      param: "vhs_edge_wave",
      min: 0,
      max: 10,
      step: 0.5,
      displayFn: (v) => String(Math.round(v)),
    },
  },
  {
    id: "lowpass_in",
    label: "入力LPF",
    category: "quality",
    control: { type: "toggle", param: "composite_in_chroma_lowpass" },
  },
  {
    id: "lowpass_out",
    label: "出力LPF",
    category: "quality",
    control: { type: "toggle", param: "composite_out_chroma_lowpass" },
  },

  /* ──── 音声設定 (オーバーレイ表示制御) ──── */
  {
    id: "rec_level",
    label: "録音レベル表示",
    category: "audio",
    control: {
      type: "state-range",
      stateKey: "recLevel",
      min: 0,
      max: 100,
      step: 1,
      displayFn: (v) => `${Math.round(v)}%`,
    },
  },
  {
    id: "wind_nr",
    label: "風切り音表示",
    category: "audio",
    control: { type: "state-toggle", stateKey: "windNr" },
  },

  /* ──── 表示設定 ──── */
  {
    id: "grid_display",
    label: "グリッド表示",
    category: "display",
    control: { type: "state-toggle", stateKey: "gridDisplay" },
  },
  {
    id: "histogram",
    label: "ヒストグラム",
    category: "display",
    control: { type: "state-toggle", stateKey: "histogram" },
  },
  {
    id: "level_meter",
    label: "レベルメーター",
    category: "display",
    control: { type: "state-toggle", stateKey: "levelMeter" },
  },

  /* ──── 録画設定 ──── */
  {
    id: "rec_fps",
    label: "録画フレームレート",
    category: "recording",
    control: {
      type: "state-discrete",
      stateKey: "recFps",
      options: [
        { label: "15fps", value: "15" },
        { label: "24fps", value: "24" },
        { label: "30fps", value: "30" },
        { label: "60fps", value: "60" },
      ],
    },
  },
  {
    id: "rec_bitrate",
    label: "録画ビットレート",
    category: "recording",
    control: {
      type: "state-discrete",
      stateKey: "recBitrate",
      options: [
        { label: "1 Mbps", value: "1000000" },
        { label: "2 Mbps", value: "2000000" },
        { label: "4 Mbps", value: "4000000" },
        { label: "8 Mbps", value: "8000000" },
      ],
    },
  },
  {
    id: "rec_format",
    label: "録画形式",
    category: "recording",
    control: {
      type: "state-discrete",
      stateKey: "recFormat",
      options: [
        { label: "自動", value: "auto" },
        { label: "WebM", value: "webm" },
        { label: "MP4", value: "mp4" },
      ],
    },
  },
  {
    id: "rec_audio",
    label: "録画時音声",
    category: "recording",
    control: { type: "state-toggle", stateKey: "recAudio" },
  },
  {
    id: "photo_format",
    label: "写真形式",
    category: "recording",
    control: {
      type: "state-discrete",
      stateKey: "photoFormat",
      options: [
        { label: "PNG", value: "png" },
        { label: "JPEG", value: "jpeg" },
      ],
    },
  },
  {
    id: "photo_quality",
    label: "写真品質 (JPEG)",
    category: "recording",
    control: {
      type: "state-range",
      stateKey: "photoQuality",
      min: 0.3,
      max: 1.0,
      step: 0.05,
      displayFn: (v: number) => `${Math.round(v * 100)}%`,
    },
  },
  {
    id: "thumb_width",
    label: "サムネイル幅",
    category: "recording",
    control: {
      type: "state-discrete",
      stateKey: "thumbWidth",
      options: [
        { label: "80px", value: "80" },
        { label: "160px", value: "160" },
        { label: "320px", value: "320" },
      ],
    },
  },
  {
    id: "thumb_quality",
    label: "サムネイル品質",
    category: "recording",
    control: {
      type: "state-range",
      stateKey: "thumbQuality",
      min: 0.3,
      max: 1.0,
      step: 0.1,
      displayFn: (v) => `${Math.round(v * 100)}%`,
    },
  },
];

/** Get settings for a specific category */
export function getSettingsByCategory(category: string): CamcorderSetting[] {
  return CAMCORDER_SETTINGS.filter((s) => s.category === category);
}

/**
 * Resolve the display value for a discrete setting given current NTSC params.
 */
export function resolveDiscreteValue(
  setting: CamcorderSetting,
  currentParams: Record<string, number | boolean>,
): string {
  if (setting.control.type !== "discrete") return "";
  const options = setting.control.options;

  let bestMatch = options[0]?.value ?? "";
  let bestScore = -1;

  for (const opt of options) {
    const keys = Object.keys(opt.params);
    if (keys.length === 0) continue;
    let matches = 0;
    for (const key of keys) {
      const expected = opt.params[key];
      const actual = currentParams[key];
      if (typeof expected === "boolean") {
        if (actual === expected) matches++;
      } else if (typeof actual === "number" && Math.abs(actual - (expected as number)) < 1) {
        matches++;
      }
    }
    if (matches > bestScore) {
      bestScore = matches;
      bestMatch = opt.value;
    }
  }

  return bestMatch;
}

/** Get the display label for a resolved value */
export function getOptionLabel(setting: CamcorderSetting, value: string): string {
  if (setting.control.type !== "discrete") return value;
  return setting.control.options.find((o) => o.value === value)?.label ?? value;
}
