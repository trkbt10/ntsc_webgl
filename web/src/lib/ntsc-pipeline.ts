import {
  loadNtsc,
  initNtsc,
  setNtscParam,
  processNtscFrame,
  type NtscHandle,
  type NtscParam,
} from "./ntsc-wasm";
import {
  createRenderer,
  drawFrame,
  syncCanvasSize,
  type RendererHandle,
} from "./renderer";
import { FrameLoop } from "./frame-loop";

type ImageSource = HTMLImageElement | HTMLCanvasElement;

/**
 * Cap the long edge to keep per-frame WASM cost under ~16 ms on
 * mid-range mobile devices. The NTSC artefact detail is still clearly
 * visible at this resolution.
 */
const MAX_DIM = 640;

/**
 * Self-contained NTSC processing pipeline.
 *
 * Owns the full lifecycle: WASM handle, pixel capture, WebGL rendering,
 * video loop, still-image management, canvas resize observation.
 *
 * Consumers call methods — the pipeline handles mode switching,
 * reprocessing, and resource management internally.
 */
export class NtscPipeline {
  private readonly handle: NtscHandle;
  private readonly renderer: RendererHandle;
  private readonly captureCanvas = document.createElement("canvas");
  private readonly captureCtx: CanvasRenderingContext2D;
  private captureBuffer = new Uint8Array(0);
  private outputBuffer = new Uint8Array(0);
  private readonly loop = new FrameLoop();
  private readonly resizeObserver: ResizeObserver;
  private stillSource: ImageSource | null = null;
  private stillBitmap: ImageBitmap | null = null;
  private processSize = { width: 0, height: 0 };

  /** Fires when FPS measurement updates (~1/s during video mode). */
  onFpsUpdate: ((fps: number) => void) | null = null;

  /** Fires when the still-source presence changes. */
  onStillChange: ((hasStill: boolean) => void) | null = null;

  private constructor(handle: NtscHandle, renderer: RendererHandle) {
    this.handle = handle;
    this.renderer = renderer;
    this.captureCtx = this.captureCanvas.getContext("2d", {
      willReadFrequently: true,
    })!;

    this.loop.onFpsUpdate = (fps) => this.onFpsUpdate?.(fps);

    this.resizeObserver = new ResizeObserver(() => this.redrawStill());
    this.resizeObserver.observe(renderer.gl.canvas as HTMLCanvasElement);
  }

  static async create(
    canvas: HTMLCanvasElement,
    wasmUrl: string,
  ): Promise<NtscPipeline> {
    const handle = await loadNtsc(wasmUrl);
    const renderer = createRenderer(canvas);
    if (!renderer) throw new Error("WebGL not supported");
    return new NtscPipeline(handle, renderer);
  }

  // ---- Video mode ----

  startVideo(video: HTMLVideoElement): void {
    this.clearStill();
    let rendering = false;
    this.loop.start(async () => {
      if (rendering) return;
      rendering = true;
      try {
        await this.renderVideo(video);
      } finally {
        rendering = false;
      }
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
    this.prepareStillBitmap(source);
  }

  clearStill(): void {
    if (!this.stillSource) return;
    this.stillSource = null;
    this.stillBitmap?.close();
    this.stillBitmap = null;
    this.onStillChange?.(false);
  }

  get hasStill(): boolean {
    return this.stillSource !== null;
  }

  // ---- Params ----

  setParam(name: string, value: number | boolean): void {
    const v = typeof value === "boolean" ? (value ? 1 : 0) : value;
    setNtscParam(this.handle, name as NtscParam, v);
    this.redrawStill();
  }

  applyParams(params: Record<string, number | boolean>): void {
    for (const [key, val] of Object.entries(params)) {
      const v = typeof val === "boolean" ? (val ? 1 : 0) : val;
      setNtscParam(this.handle, key as NtscParam, v);
    }
    this.redrawStill();
  }

  // ---- Lifecycle ----

  dispose(): void {
    this.loop.stop();
    this.resizeObserver.disconnect();
    this.stillBitmap?.close();
  }

  // ---- Internal ----

  private async prepareStillBitmap(source: ImageSource): Promise<void> {
    const srcW =
      source instanceof HTMLImageElement ? source.naturalWidth : source.width;
    const srcH =
      source instanceof HTMLImageElement ? source.naturalHeight : source.height;
    if (srcW === 0 || srcH === 0) return;

    const { width, height } = this.initSize(srcW, srcH);
    this.stillBitmap?.close();
    this.stillBitmap = await createImageBitmap(source, {
      resizeWidth: width,
      resizeHeight: height,
    });
    if (this.stillSource !== source) return;
    this.renderBitmap(this.stillBitmap, width, height);
  }

  private redrawStill(): void {
    if (this.stillBitmap) {
      this.renderBitmap(
        this.stillBitmap,
        this.processSize.width,
        this.processSize.height,
      );
    }
  }

  private initSize(
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
    const width = Math.max(w, 2);
    const height = Math.max(h, 2);

    if (
      this.processSize.width !== width ||
      this.processSize.height !== height
    ) {
      this.processSize = { width, height };
      initNtsc(this.handle, width, height);
    }

    return this.processSize;
  }

  private async renderVideo(video: HTMLVideoElement): Promise<void> {
    const srcW = video.videoWidth;
    const srcH = video.videoHeight;
    if (srcW === 0 || srcH === 0) return;

    const { width, height } = this.initSize(srcW, srcH);
    const bitmap = await createImageBitmap(video, {
      resizeWidth: width,
      resizeHeight: height,
    });
    this.renderBitmap(bitmap, width, height);
    bitmap.close();
  }

  /** Render a pre-scaled ImageBitmap (1:1 draw, no scaling). */
  private renderBitmap(
    bitmap: ImageBitmap,
    width: number,
    height: number,
  ): void {
    syncCanvasSize(this.renderer);

    if (this.captureCanvas.width !== width) this.captureCanvas.width = width;
    if (this.captureCanvas.height !== height)
      this.captureCanvas.height = height;
    this.captureCtx.drawImage(bitmap, 0, 0);
    const imageData = this.captureCtx.getImageData(0, 0, width, height);
    const size = width * height * 4;
    if (this.captureBuffer.length !== size) {
      this.captureBuffer = new Uint8Array(size);
      this.outputBuffer = new Uint8Array(size);
    }
    this.captureBuffer.set(imageData.data);

    processNtscFrame(this.handle, this.captureBuffer, this.outputBuffer);
    drawFrame(this.renderer, width, height, this.outputBuffer);
  }
}
