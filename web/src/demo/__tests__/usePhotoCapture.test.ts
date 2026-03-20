import { describe, it, expect, vi } from "vitest";
import { canvasToBlob, generateThumbnail } from "../hooks/usePhotoCapture";

// Mock canvas for node/jsdom environment
function createMockCanvas(width = 640, height = 480): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  // jsdom doesn't implement canvas drawing, so mock toBlob and getContext
  const ctx = {
    drawImage: vi.fn(),
  };
  vi.spyOn(canvas, "getContext").mockReturnValue(ctx as any);
  vi.spyOn(canvas, "toBlob").mockImplementation((cb, type, _quality) => {
    cb(new Blob(["fake-image"], { type: type ?? "image/png" }));
  });

  return canvas;
}

describe("canvasToBlob", () => {
  it("resolves with a Blob", async () => {
    const canvas = createMockCanvas();
    const blob = await canvasToBlob(canvas, "image/png");
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("image/png");
  });

  it("rejects when toBlob returns null", async () => {
    const canvas = createMockCanvas();
    vi.spyOn(canvas, "toBlob").mockImplementation((cb) => cb(null));
    await expect(canvasToBlob(canvas, "image/png")).rejects.toThrow("toBlob failed");
  });
});

describe("generateThumbnail", () => {
  it("creates a JPEG thumbnail at 160px width", async () => {
    // We need to mock document.createElement to return a mockable canvas
    const thumbCanvas = createMockCanvas(160, 120);
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "canvas") return thumbCanvas;
      return origCreateElement(tag);
    });

    const sourceCanvas = createMockCanvas(1920, 1080);
    const thumb = await generateThumbnail(sourceCanvas);

    expect(thumb).toBeInstanceOf(Blob);
    expect(thumbCanvas.width).toBe(160);
    // Height should be proportional: 160 / 1920 * 1080 = 90
    expect(thumbCanvas.height).toBe(90);
  });
});
