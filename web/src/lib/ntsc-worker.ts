import {
  loadNtsc,
  initNtsc,
  setNtscParam,
  processNtscFrame,
  type NtscHandle,
  type NtscParam,
} from "./ntsc-wasm";

let handle: NtscHandle | null = null;
let captureCanvas: OffscreenCanvas | null = null;
let captureCtx: OffscreenCanvasRenderingContext2D | null = null;
let outputBuffer = new Uint8Array(0);
let processSize = { width: 0, height: 0 };

// Still mode: cached bitmap for re-processing on param changes
let stillBitmap: ImageBitmap | null = null;

function ensureCapture(): void {
  if (!captureCanvas) {
    captureCanvas = new OffscreenCanvas(1, 1);
    captureCtx = captureCanvas.getContext("2d", {
      willReadFrequently: true,
    })!;
  }
}

function sizeChanged(width: number, height: number): boolean {
  if (processSize.width !== width || processSize.height !== height) {
    processSize = { width, height };
    initNtsc(handle!, width, height);
    return true;
  }
  return false;
}

function processBitmap(
  bitmap: ImageBitmap,
  width: number,
  height: number,
): ArrayBuffer {
  ensureCapture();
  if (captureCanvas!.width !== width) captureCanvas!.width = width;
  if (captureCanvas!.height !== height) captureCanvas!.height = height;

  captureCtx!.drawImage(bitmap, 0, 0);
  const imageData = captureCtx!.getImageData(0, 0, width, height);

  const size = width * height * 4;
  if (outputBuffer.length !== size) {
    outputBuffer = new Uint8Array(size);
  }

  // Pass imageData.data (Uint8ClampedArray) directly — no intermediate copy
  processNtscFrame(handle!, imageData.data, outputBuffer);

  // Copy into a transferable ArrayBuffer
  const transfer = new ArrayBuffer(size);
  new Uint8Array(transfer).set(outputBuffer);
  return transfer;
}

function reprocessStill(): void {
  if (!stillBitmap || !handle) return;
  const buf = processBitmap(
    stillBitmap,
    processSize.width,
    processSize.height,
  );
  postMessage(
    {
      type: "frame",
      pixels: buf,
      width: processSize.width,
      height: processSize.height,
    },
    [buf] as any,
  );
}

self.onmessage = async (e: MessageEvent) => {
  const msg = e.data;
  try {
    switch (msg.type) {
      case "init": {
        handle = await loadNtsc(msg.wasmUrl);
        postMessage({ type: "ready" });
        break;
      }

      case "initSize": {
        if (!handle) break;
        sizeChanged(msg.width, msg.height);
        break;
      }

      case "processFrame": {
        if (!handle) break;
        sizeChanged(msg.width, msg.height);
        const buf = processBitmap(msg.bitmap, msg.width, msg.height);
        msg.bitmap.close();
        postMessage(
          { type: "frame", pixels: buf, width: msg.width, height: msg.height },
          [buf] as any,
        );
        break;
      }

      case "processStill": {
        if (!handle) break;
        stillBitmap?.close();
        stillBitmap = msg.bitmap;
        sizeChanged(msg.width, msg.height);
        const buf = processBitmap(msg.bitmap, msg.width, msg.height);
        postMessage(
          { type: "frame", pixels: buf, width: msg.width, height: msg.height },
          [buf] as any,
        );
        break;
      }

      case "setParam": {
        if (!handle) break;
        setNtscParam(handle, msg.name as NtscParam, msg.value);
        reprocessStill();
        break;
      }

      case "applyParams": {
        if (!handle) break;
        for (const [key, val] of Object.entries(msg.params)) {
          const v = typeof val === "boolean" ? (val ? 1 : 0) : (val as number);
          setNtscParam(handle, key as NtscParam, v);
        }
        reprocessStill();
        break;
      }

      case "clearStill": {
        stillBitmap?.close();
        stillBitmap = null;
        break;
      }
    }
  } catch (err: any) {
    postMessage({ type: "error", message: err?.message ?? String(err) });
  }
};
