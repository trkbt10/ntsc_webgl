import { NtscGL } from "./ntsc-gl";
import { FrameLoop } from "./frame-loop";

type ImageSource = HTMLImageElement | HTMLCanvasElement;

/**
 * Cap the long edge to keep per-frame GPU cost low and NTSC artefact detail
 * visible at this resolution.
 */
const MAX_DIM = 640;

/**
 * Self-contained NTSC processing pipeline (GPU shader implementation).
 *
 * Owns the full lifecycle: WebGL 2 shader pipeline, video loop,
 * still-image management.
 *
 * All processing runs as 7-pass fragment shaders on the GPU.
 * Video frames go directly from <video> → GPU texture → shader pipeline → screen.
 *
 * The canvas buffer is always kept at frame dimensions; CSS `object-fit: contain`
 * handles display scaling. This means `toBlob()` and `captureStream()` capture
 * only the content — no letterbox black bars.
 */
export class NtscPipeline {
  private readonly gl: NtscGL;
  private readonly loop = new FrameLoop();
  private stillSource: ImageSource | null = null;

  /** Fires when FPS measurement updates (~1/s during video mode). */
  onFpsUpdate: ((fps: number) => void) | null = null;

  /** Fires when the still-source presence changes. */
  onStillChange: ((hasStill: boolean) => void) | null = null;

  private constructor(gl: NtscGL) {
    this.gl = gl;
    this.loop.onFpsUpdate = (fps) => this.onFpsUpdate?.(fps);
  }

  static create(canvas: HTMLCanvasElement): NtscPipeline {
    const gl = NtscGL.create(canvas);
    return new NtscPipeline(gl);
  }

  // ---- Video mode ----

  startVideo(video: HTMLVideoElement): void {
    this.clearStill();

    this.loop.start(() => {
      if (video.readyState < 2) return;
      const srcW = video.videoWidth;
      const srcH = video.videoHeight;
      if (srcW === 0 || srcH === 0) return;

      const { width, height } = this.calcSize(srcW, srcH);
      this.gl.resize(width, height);
      this.gl.processFrame(video);
    });
  }

  stopVideo(): void {
    this.loop.stop();
  }

  get fps(): number {
    return this.loop.fps;
  }

  // ---- Still mode ----

  processStill(source: ImageSource): void {
    this.stopVideo();
    this.stillSource = source;
    this.onStillChange?.(true);
    this.renderStill(source);
  }

  clearStill(): void {
    if (!this.stillSource) return;
    this.stillSource = null;
    this.onStillChange?.(false);
  }

  get hasStill(): boolean {
    return this.stillSource !== null;
  }

  // ---- Params ----

  setParam(name: string, value: number | boolean): void {
    const v = typeof value === "boolean" ? (value ? 1 : 0) : value;
    this.gl.setParam(name, v);
    this.reprocessStill();
  }

  applyParams(params: Record<string, number | boolean>): void {
    for (const [key, val] of Object.entries(params)) {
      const v = typeof val === "boolean" ? (val ? 1 : 0) : val;
      this.gl.setParam(key, v);
    }
    this.reprocessStill();
  }

  // ---- Lifecycle ----

  dispose(): void {
    this.loop.stop();
    this.gl.dispose();
  }

  // ---- Internal ----

  private calcSize(
    srcW: number,
    srcH: number,
  ): { width: number; height: number } {
    let w = srcW;
    let h = srcH;
    if (w > MAX_DIM || h > MAX_DIM) {
      const scale = MAX_DIM / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    w = w & ~1;
    h = h & ~1;
    return { width: Math.max(w, 2), height: Math.max(h, 2) };
  }

  private async renderStill(source: ImageSource): Promise<void> {
    const srcW =
      source instanceof HTMLImageElement ? source.naturalWidth : source.width;
    const srcH =
      source instanceof HTMLImageElement ? source.naturalHeight : source.height;
    if (srcW === 0 || srcH === 0) return;

    const { width, height } = this.calcSize(srcW, srcH);
    const bitmap = await createImageBitmap(source, {
      resizeWidth: width,
      resizeHeight: height,
    });
    if (this.stillSource !== source) {
      bitmap.close();
      return;
    }

    this.gl.resize(width, height);
    this.gl.processFrame(bitmap);
    bitmap.close();
  }

  private reprocessStill(): void {
    if (this.stillSource) {
      this.renderStill(this.stillSource);
    }
  }
}
