import { describe, it, expect } from "vitest";
import type { MediaEntry, CaptureMode } from "../media-store-types";

describe("media-store-types", () => {
  it("CaptureMode accepts photo and video", () => {
    const photo: CaptureMode = "photo";
    const video: CaptureMode = "video";
    expect(photo).toBe("photo");
    expect(video).toBe("video");
  });

  it("MediaEntry can be constructed with required fields", () => {
    const entry: MediaEntry = {
      id: "test-id",
      type: "photo",
      blob: new Blob(["img"], { type: "image/png" }),
      thumbnail: new Blob(["thumb"], { type: "image/jpeg" }),
      timestamp: Date.now(),
      size: 100,
      width: 1920,
      height: 1080,
      mimeType: "image/png",
    };
    expect(entry.id).toBe("test-id");
    expect(entry.type).toBe("photo");
    expect(entry.duration).toBeUndefined();
  });

  it("MediaEntry supports optional duration for video", () => {
    const entry: MediaEntry = {
      id: "vid-id",
      type: "video",
      blob: new Blob(["vid"], { type: "video/webm" }),
      thumbnail: new Blob(["thumb"], { type: "image/jpeg" }),
      timestamp: Date.now(),
      size: 5000,
      width: 1280,
      height: 720,
      mimeType: "video/webm",
      duration: 3000,
    };
    expect(entry.duration).toBe(3000);
  });
});
