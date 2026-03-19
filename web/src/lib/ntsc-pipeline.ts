import { NtscEffect } from "./ntsc-effect";
import {
  createRenderer,
  drawFrame,
  syncCanvasSize,
  type RendererHandle,
} from "./renderer";
import { FrameLoop } from "./frame-loop";

type ImageSource = HTMLImageElement | HTMLCanvasElement;
type RenderSource = HTMLVideoElement | ImageSource;

/**
 * Self-contained NTSC processing pipeline.
 *
 * Owns the full lifecycle: WASM effect, pixel capture, WebGL rendering,
 * video loop, still-image management, canvas resize observation.
 *
 * Consumers call methods — the pipeline handles mode switching,
 * reprocessing, and resource management internally.
 */
export class NtscPipeline {
  private readonly effect: NtscEffect;
  private readonly renderer: RendererHandle;
  private readonly captureCanvas = document.createElement("canvas");
  private readonly captureCtx: CanvasRenderingContext2D;
  private captureBuffer = new Uint8Array(0);
  private readonly loop = new FrameLoop();
  private readonly resizeObserver: ResizeObserver;
  private stillSource: ImageSource | null = null;

  /** Fires when FPS measurement updates (~1/s during video mode). */
  onFpsUpdate: ((fps: number) => void) | null = null;

  /** Fires when the still-source presence changes. */
  onStillChange: ((hasStill: boolean) => void) | null = null;

  private constructor(effect: NtscEffect, renderer: RendererHandle) {
    this.effect = effect;
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
    const effect = await NtscEffect.load(wasmUrl);
    const renderer = createRenderer(canvas);
    if (!renderer) throw new Error("WebGL not supported");
    return new NtscPipeline(effect, renderer);
  }

  // ---- Video mode ----

  startVideo(video: HTMLVideoElement): void {
    this.clearStill();
    this.loop.start(() => this.render(video));
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
    this.render(source);
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
    this.effect.setParam(name, value);
    this.redrawStill();
  }

  applyParams(params: Record<string, number | boolean>): void {
    this.effect.applyParams(params);
    this.redrawStill();
  }

  // ---- Lifecycle ----

  dispose(): void {
    this.loop.stop();
    this.resizeObserver.disconnect();
  }

  // ---- Internal ----

  private redrawStill(): void {
    if (this.stillSource) this.render(this.stillSource);
  }

  private render(source: RenderSource): void {
    const srcW =
      source instanceof HTMLVideoElement
        ? source.videoWidth
        : source instanceof HTMLImageElement
          ? source.naturalWidth
          : source.width;
    const srcH =
      source instanceof HTMLVideoElement
        ? source.videoHeight
        : source instanceof HTMLImageElement
          ? source.naturalHeight
          : source.height;
    if (srcW === 0 || srcH === 0) return;

    syncCanvasSize(this.renderer);
    const { width, height } = this.effect.initSize(srcW, srcH);

    if (this.captureCanvas.width !== width) this.captureCanvas.width = width;
    if (this.captureCanvas.height !== height)
      this.captureCanvas.height = height;
    this.captureCtx.drawImage(source, 0, 0, width, height);
    const imageData = this.captureCtx.getImageData(0, 0, width, height);
    const size = width * height * 4;
    if (this.captureBuffer.length !== size) {
      this.captureBuffer = new Uint8Array(size);
    }
    this.captureBuffer.set(imageData.data);

    const output = this.effect.process(this.captureBuffer);
    drawFrame(this.renderer, width, height, output);
  }
}
