import { useRef, useState, useCallback, useEffect } from "react";
import {
  loadNtsc,
  initNtsc,
  setNtscParam,
  processNtscFrame,
  type NtscHandle,
  type NtscParam,
} from "../../lib/ntsc-wasm";
import { createRenderer, drawFrame, type RendererHandle } from "../renderer";
import { PRESETS } from "../presets";
import wasmUrl from "../../../../_build/wasm-gc/debug/build/cmd/wasm/wasm.wasm?url";

export type ParamState = Record<string, number | boolean>;

/** Compute processing resolution from the canvas's CSS display size. */
function computeProcessSize(canvas: HTMLCanvasElement): {
  width: number;
  height: number;
} {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw = canvas.clientWidth || window.innerWidth;
  const ch = canvas.clientHeight || window.innerHeight;
  let w = Math.round(cw * dpr);
  let h = Math.round(ch * dpr);
  // Cap for performance — NTSC effect is processed at reduced resolution,
  // WebGL LINEAR filtering handles upscaling smoothly.
  const maxDim = 640;
  if (w > maxDim || h > maxDim) {
    const scale = maxDim / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }
  // Ensure even dimensions (interlacing requires even height)
  w = w & ~1;
  h = h & ~1;
  return { width: Math.max(w, 2), height: Math.max(h, 2) };
}

/**
 * Draw source onto ctx preserving source aspect ratio.
 * Fills background with black, centers the source.
 */
function drawPreserveAspect(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
): void {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, dstW, dstH);
  const scale = Math.min(dstW / srcW, dstH / srcH);
  const drawW = srcW * scale;
  const drawH = srcH * scale;
  ctx.drawImage(source, (dstW - drawW) / 2, (dstH - drawH) / 2, drawW, drawH);
}

export function useNtsc() {
  const ntscRef = useRef<NtscHandle | null>(null);
  const rendererRef = useRef<RendererHandle | null>(null);
  const captureCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const frameIdRef = useRef(0);
  const fpsCountRef = useRef({ count: 0, lastTime: performance.now() });
  const initCalledRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Initializing...");
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [params, setParams] = useState<ParamState>(() => ({
    ...PRESETS.broadcast,
  }));
  const [activePreset, setActivePreset] = useState("broadcast");

  /** Update processing buffers for the current canvas display size. */
  const syncSize = useCallback(() => {
    const canvas = canvasRef.current;
    const ntsc = ntscRef.current;
    if (!canvas || !ntsc) return;

    const size = computeProcessSize(canvas);
    if (
      sizeRef.current.width === size.width &&
      sizeRef.current.height === size.height
    )
      return;

    sizeRef.current = size;
    canvas.width = size.width;
    canvas.height = size.height;

    if (!captureCanvasRef.current) {
      captureCanvasRef.current = document.createElement("canvas");
    }
    captureCanvasRef.current.width = size.width;
    captureCanvasRef.current.height = size.height;
    captureCtxRef.current = captureCanvasRef.current.getContext("2d", {
      willReadFrequently: true,
    })!;
    initNtsc(ntsc, size.width, size.height);
  }, []);

  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const onResizeRef = useRef<(() => void) | null>(null);

  // Stable init — safe to pass as ref callback dependency.
  // Guards against double-invoke (strict mode / re-mount).
  const init = useCallback(async (canvas: HTMLCanvasElement) => {
    if (initCalledRef.current) return;
    initCalledRef.current = true;
    canvasRef.current = canvas;

    try {
      setLoadingText("Loading WASM...");
      ntscRef.current = await loadNtsc(wasmUrl);

      setLoadingText("Setting up renderer...");
      const r = createRenderer(canvas);
      if (!r) throw new Error("WebGL not supported");
      rendererRef.current = r;

      for (const [key, val] of Object.entries(PRESETS.broadcast)) {
        const wasmVal =
          typeof val === "boolean" ? (val ? 1 : 0) : (val as number);
        setNtscParam(ntscRef.current, key as NtscParam, wasmVal);
      }

      syncSize();

      // Watch for container resize (image mode needs this)
      resizeObserverRef.current = new ResizeObserver(() => {
        syncSize();
        onResizeRef.current?.();
      });
      resizeObserverRef.current.observe(canvas);

      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [syncSize]);

  const processVideoFrame = useCallback((video: HTMLVideoElement) => {
    syncSize();
    const ntsc = ntscRef.current;
    const renderer = rendererRef.current;
    const ctx = captureCtxRef.current;
    const { width, height } = sizeRef.current;
    if (!ntsc || !renderer || !ctx || width === 0) return;

    drawPreserveAspect(
      ctx,
      video,
      video.videoWidth,
      video.videoHeight,
      width,
      height,
    );
    const imageData = ctx.getImageData(0, 0, width, height);
    const output = processNtscFrame(
      ntsc,
      new Uint8Array(imageData.data.buffer),
    );
    drawFrame(renderer, width, height, output);

    fpsCountRef.current.count++;
    const now = performance.now();
    if (now - fpsCountRef.current.lastTime >= 1000) {
      setFps(fpsCountRef.current.count);
      fpsCountRef.current.count = 0;
      fpsCountRef.current.lastTime = now;
    }
  }, []);

  const processImageSource = useCallback(
    (source: HTMLImageElement | HTMLCanvasElement) => {
      const ntsc = ntscRef.current;
      const renderer = rendererRef.current;
      const ctx = captureCtxRef.current;
      const { width, height } = sizeRef.current;
      if (!ntsc || !renderer || !ctx || width === 0) return;

      const srcW =
        "naturalWidth" in source
          ? (source as HTMLImageElement).naturalWidth
          : source.width;
      const srcH =
        "naturalHeight" in source
          ? (source as HTMLImageElement).naturalHeight
          : source.height;
      drawPreserveAspect(ctx, source, srcW, srcH, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const output = processNtscFrame(
        ntsc,
        new Uint8Array(imageData.data.buffer),
      );
      drawFrame(renderer, width, height, output);
    },
    [],
  );

  const startVideoLoop = useCallback(
    (video: HTMLVideoElement) => {
      cancelAnimationFrame(frameIdRef.current);
      const loop = () => {
        processVideoFrame(video);
        frameIdRef.current = requestAnimationFrame(loop);
      };
      frameIdRef.current = requestAnimationFrame(loop);
    },
    [processVideoFrame],
  );

  const stopLoop = useCallback(() => {
    cancelAnimationFrame(frameIdRef.current);
  }, []);

  const setParam = useCallback((name: string, value: number | boolean) => {
    const ntsc = ntscRef.current;
    if (!ntsc) return;
    const wasmVal = typeof value === "boolean" ? (value ? 1 : 0) : value;
    setNtscParam(ntsc, name as NtscParam, wasmVal);
    setParams((prev) => ({ ...prev, [name]: value }));
    setActivePreset("");
  }, []);

  const applyPreset = useCallback((name: string) => {
    const ntsc = ntscRef.current;
    const preset = PRESETS[name];
    if (!ntsc || !preset) return;
    for (const [key, val] of Object.entries(preset)) {
      const wasmVal =
        typeof val === "boolean" ? (val ? 1 : 0) : (val as number);
      setNtscParam(ntsc, key as NtscParam, wasmVal);
    }
    setParams({ ...preset });
    setActivePreset(name);
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(frameIdRef.current);
      resizeObserverRef.current?.disconnect();
    };
  }, []);

  /** Register a callback invoked on canvas resize (for re-processing static images). */
  const setOnResize = useCallback((cb: (() => void) | null) => {
    onResizeRef.current = cb;
  }, []);

  return {
    loading,
    loadingText,
    error,
    fps,
    params,
    activePreset,
    processSize: sizeRef,
    init,
    processVideoFrame,
    processImageSource,
    startVideoLoop,
    stopLoop,
    setParam,
    applyPreset,
    setOnResize,
  };
}
