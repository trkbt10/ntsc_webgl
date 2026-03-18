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

const PROCESS_WIDTH = 320;
const PROCESS_HEIGHT = 240;

export function useNtsc() {
  const ntscRef = useRef<NtscHandle | null>(null);
  const rendererRef = useRef<RendererHandle | null>(null);
  const captureCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
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

  // Stable init — safe to pass as ref callback dependency.
  // Guards against double-invoke (strict mode / re-mount).
  const init = useCallback(async (canvas: HTMLCanvasElement) => {
    if (initCalledRef.current) return;
    initCalledRef.current = true;

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

      captureCanvasRef.current = document.createElement("canvas");
      captureCanvasRef.current.width = PROCESS_WIDTH;
      captureCanvasRef.current.height = PROCESS_HEIGHT;
      captureCtxRef.current = captureCanvasRef.current.getContext("2d", {
        willReadFrequently: true,
      })!;
      initNtsc(ntscRef.current, PROCESS_WIDTH, PROCESS_HEIGHT);

      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const processVideoFrame = useCallback((video: HTMLVideoElement) => {
    const ntsc = ntscRef.current;
    const renderer = rendererRef.current;
    const ctx = captureCtxRef.current;
    if (!ntsc || !renderer || !ctx) return;

    ctx.drawImage(video, 0, 0, PROCESS_WIDTH, PROCESS_HEIGHT);
    const imageData = ctx.getImageData(0, 0, PROCESS_WIDTH, PROCESS_HEIGHT);
    const output = processNtscFrame(
      ntsc,
      new Uint8Array(imageData.data.buffer),
    );
    drawFrame(renderer, PROCESS_WIDTH, PROCESS_HEIGHT, output);

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
      if (!ntsc || !renderer || !ctx) return;

      ctx.drawImage(source, 0, 0, PROCESS_WIDTH, PROCESS_HEIGHT);
      const imageData = ctx.getImageData(0, 0, PROCESS_WIDTH, PROCESS_HEIGHT);
      const output = processNtscFrame(
        ntsc,
        new Uint8Array(imageData.data.buffer),
      );
      drawFrame(renderer, PROCESS_WIDTH, PROCESS_HEIGHT, output);
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
    };
  }, []);

  return {
    loading,
    loadingText,
    error,
    fps,
    params,
    activePreset,
    init,
    processVideoFrame,
    processImageSource,
    startVideoLoop,
    stopLoop,
    setParam,
    applyPreset,
  };
}
