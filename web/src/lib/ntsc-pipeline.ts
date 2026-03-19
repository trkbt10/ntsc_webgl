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
import NTSCWorker from './ntsc-worker.ts?worker';

type ImageSource = HTMLImageElement | HTMLCanvasElement;

/**
 * Cap the long edge to keep per-frame WASM cost under ~16 ms on
 * mid-range mobile devices. The NTSC artefact detail is still clearly
 * visible at this resolution.
 */
const MAX_DIM = 640;

// ---- Worker message types ----

interface WorkerFrameMsg {
  type: "frame";
  pixels: ArrayBuffer;
  width: number;
  height: number;
}

/**
 * Self-contained NTSC processing pipeline.
 *
 * Owns the full lifecycle: WASM handle, pixel capture, WebGL rendering,
 * video loop, still-image management, canvas resize observation.
 *
 * When possible, heavy work (WASM + pixel capture) runs in a Web Worker;
 * falls back to inline processing if Worker creation fails.
 */
export class NtscPipeline {
  private readonly renderer: RendererHandle;
  private readonly loop = new FrameLoop();
  private readonly resizeObserver: ResizeObserver;
  private stillSource: ImageSource | null = null;
  private processSize = { width: 0, height: 0 };
  private lastFrame: { pixels: Uint8Array; width: number; height: number } | null = null;

  // Worker mode
  private worker: Worker | null = null;
  private workerBusy = false;

  // Inline fallback mode
  private handle: NtscHandle | null = null;
  private captureCanvas: HTMLCanvasElement | null = null;
  private captureCtx: CanvasRenderingContext2D | null = null;
  private outputBuffer = new Uint8Array(0);

  /** Fires when FPS measurement updates (~1/s during video mode). */
  onFpsUpdate: ((fps: number) => void) | null = null;

  /** Fires when the still-source presence changes. */
  onStillChange: ((hasStill: boolean) => void) | null = null;

  private constructor(renderer: RendererHandle) {
    this.renderer = renderer;

    this.loop.onFpsUpdate = (fps) => this.onFpsUpdate?.(fps);

    this.resizeObserver = new ResizeObserver(() => this.redrawStill());
    this.resizeObserver.observe(renderer.gl.canvas as HTMLCanvasElement);
  }

  static async create(
    canvas: HTMLCanvasElement,
    wasmUrl: string,
  ): Promise<NtscPipeline> {
    const renderer = createRenderer(canvas);
    if (!renderer) throw new Error("WebGL not supported");

    const pipeline = new NtscPipeline(renderer);

    // Try worker mode first
    try {
      const worker = new NTSCWorker({
        name: "NTSC Worker",
      });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          worker.terminate();
          reject(new Error("Worker init timeout"));
        }, 10_000);

        worker.onmessage = (e) => {
          if (e.data.type === "ready") {
            clearTimeout(timeout);
            resolve();
          } else if (e.data.type === "error") {
            clearTimeout(timeout);
            reject(new Error(e.data.message));
          }
        };
        worker.onerror = (e) => {
          clearTimeout(timeout);
          reject(e);
        };

        worker.postMessage({ type: "init", wasmUrl });
      });

      pipeline.worker = worker;
      worker.onmessage = (e) => pipeline.handleWorkerMessage(e.data);
      worker.onerror = null;
    } catch {
      // Fallback to inline processing
      const handle = await loadNtsc(wasmUrl);
      pipeline.handle = handle;
      pipeline.captureCanvas = document.createElement("canvas");
      pipeline.captureCtx = pipeline.captureCanvas.getContext("2d", {
        willReadFrequently: true,
      })!;
    }

    return pipeline;
  }

  // ---- Worker message handler ----

  private handleWorkerMessage(msg: any): void {
    if (msg.type === "frame") {
      const frame = msg as WorkerFrameMsg;
      const pixels = new Uint8Array(frame.pixels);
      this.lastFrame = { pixels, width: frame.width, height: frame.height };
      this.workerBusy = false;
      syncCanvasSize(this.renderer);
      drawFrame(this.renderer, frame.width, frame.height, pixels);
    }
  }

  // ---- Video mode ----

  startVideo(video: HTMLVideoElement): void {
    this.clearStill();

    if (this.worker) {
      this.loop.start(async () => {
        if (this.workerBusy) return;
        const srcW = video.videoWidth;
        const srcH = video.videoHeight;
        if (srcW === 0 || srcH === 0) return;

        const { width, height } = this.calcSize(srcW, srcH);
        const bitmap = await createImageBitmap(video, {
          resizeWidth: width,
          resizeHeight: height,
        });
        this.workerBusy = true;
        this.worker!.postMessage(
          { type: "processFrame", bitmap, width, height },
          [bitmap] as any,
        );
      });
    } else {
      // Inline fallback
      let rendering = false;
      this.loop.start(async () => {
        if (rendering) return;
        rendering = true;
        try {
          await this.renderVideoInline(video);
        } finally {
          rendering = false;
        }
      });
    }
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
    this.lastFrame = null;
    this.onStillChange?.(true);
    this.prepareStillBitmap(source);
  }

  clearStill(): void {
    if (!this.stillSource) return;
    this.stillSource = null;
    this.lastFrame = null;
    this.onStillChange?.(false);

    if (this.worker) {
      this.worker.postMessage({ type: "clearStill" });
    }
  }

  get hasStill(): boolean {
    return this.stillSource !== null;
  }

  // ---- Params ----

  setParam(name: string, value: number | boolean): void {
    const v = typeof value === "boolean" ? (value ? 1 : 0) : value;
    if (this.worker) {
      this.worker.postMessage({ type: "setParam", name, value: v });
    } else if (this.handle) {
      setNtscParam(this.handle, name as NtscParam, v);
      this.redrawStill();
    }
  }

  applyParams(params: Record<string, number | boolean>): void {
    if (this.worker) {
      this.worker.postMessage({ type: "applyParams", params });
    } else if (this.handle) {
      for (const [key, val] of Object.entries(params)) {
        const v = typeof val === "boolean" ? (val ? 1 : 0) : val;
        setNtscParam(this.handle, key as NtscParam, v);
      }
      this.redrawStill();
    }
  }

  // ---- Lifecycle ----

  dispose(): void {
    this.loop.stop();
    this.resizeObserver.disconnect();
    this.worker?.terminate();
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

  private initSizeInline(srcW: number, srcH: number): { width: number; height: number } {
    const size = this.calcSize(srcW, srcH);
    if (
      this.processSize.width !== size.width ||
      this.processSize.height !== size.height
    ) {
      this.processSize = size;
      initNtsc(this.handle!, size.width, size.height);
    }
    return this.processSize;
  }

  private async prepareStillBitmap(source: ImageSource): Promise<void> {
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

    if (this.worker) {
      this.processSize = { width, height };
      this.worker.postMessage(
        { type: "processStill", bitmap, width, height },
        [bitmap] as any,
      );
    } else {
      this.initSizeInline(srcW, srcH);
      this.renderBitmapInline(bitmap, width, height);
      bitmap.close();
    }
  }

  private redrawStill(): void {
    if (this.lastFrame) {
      syncCanvasSize(this.renderer);
      drawFrame(
        this.renderer,
        this.lastFrame.width,
        this.lastFrame.height,
        this.lastFrame.pixels,
      );
    }
  }

  // ---- Inline fallback methods ----

  private async renderVideoInline(video: HTMLVideoElement): Promise<void> {
    const srcW = video.videoWidth;
    const srcH = video.videoHeight;
    if (srcW === 0 || srcH === 0) return;

    const { width, height } = this.initSizeInline(srcW, srcH);
    const bitmap = await createImageBitmap(video, {
      resizeWidth: width,
      resizeHeight: height,
    });
    this.renderBitmapInline(bitmap, width, height);
    bitmap.close();
  }

  private renderBitmapInline(
    bitmap: ImageBitmap,
    width: number,
    height: number,
  ): void {
    syncCanvasSize(this.renderer);

    const cc = this.captureCanvas!;
    if (cc.width !== width) cc.width = width;
    if (cc.height !== height) cc.height = height;
    this.captureCtx!.drawImage(bitmap, 0, 0);
    const imageData = this.captureCtx!.getImageData(0, 0, width, height);

    const size = width * height * 4;
    if (this.outputBuffer.length !== size) {
      this.outputBuffer = new Uint8Array(size);
    }

    // Pass imageData.data directly — no intermediate captureBuffer copy
    processNtscFrame(this.handle!, imageData.data, this.outputBuffer);

    this.lastFrame = {
      pixels: new Uint8Array(this.outputBuffer),
      width,
      height,
    };
    drawFrame(this.renderer, width, height, this.outputBuffer);
  }
}
