import { useState, useCallback, useEffect } from "react";
import { NtscPipeline } from "../../lib/ntsc-pipeline";

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
    let p: NtscPipeline | null = null;

    try {
      p = NtscPipeline.create(canvas);
      setPipeline(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }

    return () => {
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
