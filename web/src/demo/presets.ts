import type { NtscParam } from "../lib/ntsc-wasm";

export type Preset = Record<string, number | boolean>;

export const PRESETS: Record<string, Preset> = {
  broadcast: {
    video_noise: 2,
    video_chroma_noise: 0,
    video_chroma_phase_noise: 0,
    composite_preemphasis: 0,
    subcarrier_amplitude: 50,
    color_bleed_horiz: 0,
    color_bleed_vert: 0,
    video_chroma_loss: 0,
    composite_in_chroma_lowpass: true,
    composite_out_chroma_lowpass: true,
    emulating_vhs: false,
    vhs_out_sharpen: 1.5,
    vhs_edge_wave: 0,
  },
  vhs: {
    video_noise: 12,
    video_chroma_noise: 200,
    video_chroma_phase_noise: 4,
    composite_preemphasis: 0,
    subcarrier_amplitude: 50,
    color_bleed_horiz: 1,
    color_bleed_vert: 0,
    video_chroma_loss: 200,
    composite_in_chroma_lowpass: true,
    composite_out_chroma_lowpass: true,
    emulating_vhs: true,
    vhs_out_sharpen: 2.0,
    vhs_edge_wave: 2,
  },
  bad_reception: {
    video_noise: 80,
    video_chroma_noise: 1500,
    video_chroma_phase_noise: 15,
    composite_preemphasis: 2,
    subcarrier_amplitude: 40,
    color_bleed_horiz: 3,
    color_bleed_vert: 2,
    video_chroma_loss: 5000,
    composite_in_chroma_lowpass: true,
    composite_out_chroma_lowpass: true,
    emulating_vhs: false,
    vhs_out_sharpen: 1.5,
    vhs_edge_wave: 0,
  },
  clean: {
    video_noise: 0,
    video_chroma_noise: 0,
    video_chroma_phase_noise: 0,
    composite_preemphasis: 0,
    subcarrier_amplitude: 50,
    color_bleed_horiz: 0,
    color_bleed_vert: 0,
    video_chroma_loss: 0,
    composite_in_chroma_lowpass: false,
    composite_out_chroma_lowpass: false,
    emulating_vhs: false,
    vhs_out_sharpen: 1.5,
    vhs_edge_wave: 0,
  },
};

/** Slider value scaling (UI <-> WASM param) */
const SCALED_PARAMS: Record<string, number> = {
  composite_preemphasis: 10,
  vhs_out_sharpen: 10,
};

export function paramToSlider(param: string, value: number): number {
  return param in SCALED_PARAMS ? value * SCALED_PARAMS[param] : value;
}

export function sliderToParam(param: string, value: number): number {
  return param in SCALED_PARAMS ? value / SCALED_PARAMS[param] : value;
}

export function displayValue(param: string, value: number): string {
  return param in SCALED_PARAMS ? value.toFixed(1) : String(Math.round(value));
}

/** Boolean params that map to checkbox / toggle controls */
export const CHECKBOX_PARAMS: NtscParam[] = [
  "composite_in_chroma_lowpass",
  "composite_out_chroma_lowpass",
  "emulating_vhs",
];

/** Range params that map to slider controls */
export const RANGE_PARAMS: NtscParam[] = [
  "video_noise",
  "video_chroma_noise",
  "video_chroma_phase_noise",
  "composite_preemphasis",
  "subcarrier_amplitude",
  "color_bleed_horiz",
  "color_bleed_vert",
  "vhs_out_sharpen",
  "vhs_edge_wave",
  "video_chroma_loss",
];
