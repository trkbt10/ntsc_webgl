/**
 * NTSC Cam — Demo application
 * Camera + WASM NTSC processing + WebGL rendering
 */

import {
  loadNtsc,
  initNtsc,
  setNtscParam,
  processNtscFrame,
  type NtscHandle,
  type NtscParam,
} from "../lib/ntsc-wasm";
import { createRenderer, drawFrame, type RendererHandle } from "./renderer";
import {
  PRESETS,
  RANGE_PARAMS,
  CHECKBOX_PARAMS,
  paramToSlider,
  sliderToParam,
  displayValue,
} from "./presets";
import wasmUrl from "../../../_build/wasm-gc/debug/build/cmd/wasm/wasm.wasm?url";

const PROCESS_WIDTH = 320;
const PROCESS_HEIGHT = 240;

let ntsc: NtscHandle;
let renderer: RendererHandle;
let facingMode = "user";
let captureCtx: CanvasRenderingContext2D | null = null;
let frameCount = 0;
let lastFpsTime = performance.now();

// --- Camera ---
async function startCamera(
  video: HTMLVideoElement,
  facing: string,
): Promise<void> {
  if (video.srcObject) {
    (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: facing,
    },
    audio: false,
  });
  video.srcObject = stream;
  await video.play();
}

// --- Preset application ---
function applyPreset(name: string): void {
  const preset = PRESETS[name];
  if (!preset) return;

  for (const [key, val] of Object.entries(preset)) {
    const el = document.getElementById(key) as
      | HTMLInputElement
      | HTMLSelectElement
      | null;
    if (!el) continue;

    if (el instanceof HTMLInputElement && el.type === "checkbox") {
      el.checked = val as boolean;
    } else if (el instanceof HTMLInputElement && el.type === "range") {
      el.value = String(paramToSlider(key, val as number));
      const vEl = document.getElementById(`v_${key}`);
      if (vEl) vEl.textContent = displayValue(key, val as number);
    }

    const wasmVal =
      el instanceof HTMLInputElement && el.type === "checkbox"
        ? (val ? 1 : 0)
        : (val as number);
    setNtscParam(ntsc, key as NtscParam, wasmVal);
  }

  document.querySelectorAll<HTMLButtonElement>(".preset-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.preset === name);
  });
}

// --- Controls ---
function setupControls(): void {
  for (const param of RANGE_PARAMS) {
    const el = document.getElementById(param) as HTMLInputElement | null;
    if (!el) continue;
    el.addEventListener("input", () => {
      const value = sliderToParam(param, parseFloat(el.value));
      const vEl = document.getElementById(`v_${param}`);
      if (vEl) vEl.textContent = displayValue(param, value);
      setNtscParam(ntsc, param, value);
    });
  }

  for (const param of CHECKBOX_PARAMS) {
    const el = document.getElementById(param) as HTMLInputElement | null;
    if (!el) continue;
    el.addEventListener("change", () => {
      setNtscParam(ntsc, param, el.checked ? 1 : 0);
    });
  }

  document
    .querySelectorAll<HTMLButtonElement>(".preset-btn")
    .forEach((btn) => {
      btn.addEventListener("click", () =>
        applyPreset(btn.dataset.preset ?? ""),
      );
    });

  // Settings panel
  const panel = document.getElementById("panel")!;
  const settingsBtn = document.getElementById("settings-btn")!;
  settingsBtn.addEventListener("click", () => {
    panel.classList.toggle("open");
    settingsBtn.classList.toggle("active");
  });
  document.getElementById("output-canvas")!.addEventListener("click", () => {
    panel.classList.remove("open");
    settingsBtn.classList.remove("active");
  });

  // Camera flip
  document
    .getElementById("flip-btn")!
    .addEventListener("click", async () => {
      facingMode = facingMode === "user" ? "environment" : "user";
      try {
        await startCamera(
          document.getElementById("camera") as HTMLVideoElement,
          facingMode,
        );
      } catch (e) {
        console.warn("Could not flip camera:", e);
      }
    });
}

// --- Frame loop ---
function processFrame(): void {
  const video = document.getElementById("camera") as HTMLVideoElement;
  const captureCanvas = document.getElementById(
    "capture-canvas",
  ) as HTMLCanvasElement;

  if (!captureCtx) {
    captureCanvas.width = PROCESS_WIDTH;
    captureCanvas.height = PROCESS_HEIGHT;
    captureCtx = captureCanvas.getContext("2d", { willReadFrequently: true })!;
    initNtsc(ntsc, PROCESS_WIDTH, PROCESS_HEIGHT);
  }

  captureCtx.drawImage(video, 0, 0, PROCESS_WIDTH, PROCESS_HEIGHT);
  const imageData = captureCtx.getImageData(
    0,
    0,
    PROCESS_WIDTH,
    PROCESS_HEIGHT,
  );

  const output = processNtscFrame(
    ntsc,
    new Uint8Array(imageData.data.buffer),
  );
  drawFrame(renderer, PROCESS_WIDTH, PROCESS_HEIGHT, output);

  // FPS
  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    const fpsEl = document.getElementById("fps");
    if (fpsEl) fpsEl.textContent = `${frameCount} fps`;
    frameCount = 0;
    lastFpsTime = now;
  }

  requestAnimationFrame(processFrame);
}

// --- Main ---
async function main(): Promise<void> {
  const loadingEl = document.getElementById("loading")!;
  const loadingText = document.getElementById("loading-text")!;

  try {
    loadingText.textContent = "Loading WASM...";
    ntsc = await loadNtsc(wasmUrl);

    loadingText.textContent = "Setting up renderer...";
    const r = createRenderer(
      document.getElementById("output-canvas") as HTMLCanvasElement,
    );
    if (!r) throw new Error("WebGL not supported");
    renderer = r;

    setupControls();

    loadingText.textContent = "Starting camera...";
    await startCamera(
      document.getElementById("camera") as HTMLVideoElement,
      facingMode,
    );

    applyPreset("broadcast");

    loadingEl.classList.add("hide");
    setTimeout(() => {
      loadingEl.style.display = "none";
    }, 400);
    document.getElementById("status")!.textContent = "";

    processFrame();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    loadingText.textContent = msg;
    console.error(e);
  }
}

main();
