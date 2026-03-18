/**
 * ntsc-wasm — NTSC/VHS video artifact emulator (WASM API)
 *
 * Function-based API for tree-shaking friendliness.
 */

/** WASM export signature (internal) */
interface NtscWasmExports {
  initProcessor(width: number, height: number): void;
  setParam(name: string, value: number): void;
  pushFrame(data: string): void;
  processFrame(): void;
  getOutputLength(): number;
  getOutputChunk(offset: number, length: number): string;
}

/** Tunable parameter names exposed by the WASM module. */
export type NtscParam =
  | "video_noise"
  | "video_chroma_noise"
  | "video_chroma_phase_noise"
  | "composite_preemphasis"
  | "subcarrier_amplitude"
  | "video_scanline_phase_shift"
  | "emulating_vhs"
  | "vhs_speed"
  | "vhs_head_switching"
  | "color_bleed_horiz"
  | "color_bleed_vert"
  | "composite_in_chroma_lowpass"
  | "composite_out_chroma_lowpass"
  | "vhs_out_sharpen"
  | "vhs_edge_wave"
  | "video_chroma_loss";

/** Opaque handle returned by `loadNtsc`. */
export interface NtscHandle {
  readonly exports: NtscWasmExports;
  width: number;
  height: number;
}

/**
 * Encode Uint8Array as a latin1 string for passing to WASM.
 *
 * wasm-gc with js-string builtins has no direct Uint8Array interop;
 * latin1 string encoding (1 char = 1 byte) is the standard workaround
 * used across MoonBit WASM projects.
 */
const latin1Decoder = new TextDecoder("latin1");

function bytesToLatin1(bytes: Uint8Array): string {
  return latin1Decoder.decode(bytes);
}

/**
 * Load a WASM module and return a handle.
 *
 * ```ts
 * import wasmUrl from "ntsc-wasm/ntsc.wasm?url";
 * const ntsc = await loadNtsc(wasmUrl);
 * ```
 */
export async function loadNtsc(wasmUrl: string): Promise<NtscHandle> {
  const response = await fetch(wasmUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch WASM: ${response.status}`);
  }
  const wasmBinary = await response.arrayBuffer();

  let instance: WebAssembly.Instance;
  try {
    const result = await WebAssembly.instantiate(
      wasmBinary,
      {},
      // @ts-ignore wasm-gc js-string builtins (not yet in TS lib types)
      { builtins: ["js-string"], importedStringConstants: "_" },
    );
    instance = result.instance;
  } catch {
    const result = await WebAssembly.instantiate(wasmBinary, {});
    instance = result.instance;
  }

  return {
    exports: instance.exports as unknown as NtscWasmExports,
    width: 0,
    height: 0,
  };
}

/** Initialize (or reinitialize) the processor for the given frame size. */
export function initNtsc(
  handle: NtscHandle,
  width: number,
  height: number,
): void {
  handle.width = width;
  handle.height = height;
  handle.exports.initProcessor(width, height);
}

/** Set a named parameter. */
export function setNtscParam(
  handle: NtscHandle,
  name: NtscParam,
  value: number,
): void {
  handle.exports.setParam(name, value);
}

/**
 * Process one RGBA frame.
 *
 * @param rgbaIn  Input pixel data (width * height * 4 bytes)
 * @param rgbaOut Optional pre-allocated output buffer (same size)
 * @returns       Output pixel data
 */
export function processNtscFrame(
  handle: NtscHandle,
  rgbaIn: Uint8Array,
  rgbaOut?: Uint8Array,
): Uint8Array {
  handle.exports.pushFrame(bytesToLatin1(rgbaIn));
  handle.exports.processFrame();

  const outputLen = handle.exports.getOutputLength();
  const outputStr = handle.exports.getOutputChunk(0, outputLen);
  const out = rgbaOut ?? new Uint8Array(outputLen);
  // latin1 decode: each char code is one byte
  for (let i = 0; i < outputLen; i++) out[i] = outputStr.charCodeAt(i);
  return out;
}
