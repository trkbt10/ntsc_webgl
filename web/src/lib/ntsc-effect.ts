import {
  loadNtsc,
  initNtsc,
  setNtscParam,
  processNtscFrame,
  type NtscHandle,
  type NtscParam,
} from "./ntsc-wasm";

/**
 * NTSC WASM effect processor.
 *
 * Pure signal processing: Uint8Array → Uint8Array.
 * No DOM, no canvas, no rendering.
 */
export class NtscEffect {
  private readonly handle: NtscHandle;
  private currentSize = { width: 0, height: 0 };

  /**
   * Cap the long edge to keep per-frame WASM cost under ~16 ms on
   * mid-range mobile devices. The NTSC artefact detail is still clearly
   * visible at this resolution.
   */
  private static readonly MAX_DIM = 640;

  private constructor(handle: NtscHandle) {
    this.handle = handle;
  }

  static async load(wasmUrl: string): Promise<NtscEffect> {
    return new NtscEffect(await loadNtsc(wasmUrl));
  }

  /**
   * Set processing size from source dimensions.
   * Caps to MAX_DIM, ensures even dimensions (interlacing requires even height).
   * No-ops if the resulting size is unchanged.
   * Returns the actual processing resolution.
   */
  initSize(
    srcW: number,
    srcH: number,
  ): { width: number; height: number } {
    let w = srcW;
    let h = srcH;
    const max = NtscEffect.MAX_DIM;
    if (w > max || h > max) {
      const scale = max / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    w = w & ~1;
    h = h & ~1;
    const width = Math.max(w, 2);
    const height = Math.max(h, 2);

    if (
      this.currentSize.width !== width ||
      this.currentSize.height !== height
    ) {
      this.currentSize = { width, height };
      initNtsc(this.handle, width, height);
    }

    return this.currentSize;
  }

  /** Process one RGBA frame through the NTSC effect. */
  process(rgba: Uint8Array): Uint8Array {
    return processNtscFrame(this.handle, rgba);
  }

  setParam(name: string, value: number | boolean): void {
    const v = typeof value === "boolean" ? (value ? 1 : 0) : value;
    setNtscParam(this.handle, name as NtscParam, v);
  }

  applyParams(params: Record<string, number | boolean>): void {
    for (const [key, val] of Object.entries(params)) {
      this.setParam(key, val);
    }
  }
}
