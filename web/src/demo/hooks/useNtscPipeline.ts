import { useState, useCallback, useEffect } from "react";
import { NtscPipeline } from "../../lib/ntsc-pipeline";
import wasmUrl from "../../../../_build/wasm-gc/debug/build/cmd/wasm/wasm.wasm?url";

export function useNtscPipeline() {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [pipeline, setPipeline] = useState<NtscPipeline | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [hasStill, setHasStill] = useState(false);

  const canvasRef = useCallback((node: HTMLCanvasElement | null) => {
    if (node) setCanvas(node);
  }, []);

  useEffect(() => {
    if (!canvas) return;
    let cancelled = false;
    let p: NtscPipeline | null = null;

    (async () => {
      try {
        p = await NtscPipeline.create(canvas, wasmUrl);
        if (!cancelled) setPipeline(p);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
      p?.dispose();
    };
  }, [canvas]);

  useEffect(() => {
    if (!pipeline) return;
    pipeline.onFpsUpdate = setFps;
    pipeline.onStillChange = setHasStill;
    return () => {
      pipeline.onFpsUpdate = null;
      pipeline.onStillChange = null;
    };
  }, [pipeline]);

  return {
    canvasRef,
    pipeline,
    ready: pipeline !== null,
    error,
    fps,
    hasStill,
  };
}
