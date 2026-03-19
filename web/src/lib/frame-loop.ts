/**
 * Self-contained requestAnimationFrame loop with FPS measurement.
 */
export class FrameLoop {
  private frameId = 0;
  private count = 0;
  private lastTime = 0;
  private _fps = 0;
  private callback: (() => void) | null = null;

  get fps(): number {
    return this._fps;
  }

  /** Called each time the FPS value is updated (~1/s). */
  onFpsUpdate: ((fps: number) => void) | null = null;

  start(callback: () => void): void {
    this.stop();
    this.callback = callback;
    this.count = 0;
    this.lastTime = performance.now();
    this._fps = 0;
    const loop = () => {
      this.callback?.();
      this.tick();
      this.frameId = requestAnimationFrame(loop);
    };
    this.frameId = requestAnimationFrame(loop);
  }

  stop(): void {
    cancelAnimationFrame(this.frameId);
    this.frameId = 0;
    this.callback = null;
  }

  private tick(): void {
    this.count++;
    const now = performance.now();
    if (now - this.lastTime >= 1000) {
      this._fps = this.count;
      this.onFpsUpdate?.(this._fps);
      this.count = 0;
      this.lastTime = now;
    }
  }
}
