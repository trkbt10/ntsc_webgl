import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBlobUrl } from "../hooks/useBlobUrl";

// Install @testing-library/react if not present — vitest + jsdom provides the DOM

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("useBlobUrl", () => {
  it("returns null for null blob", () => {
    const { result } = renderHook(() => useBlobUrl(null));
    expect(result.current).toBeNull();
  });

  it("creates an object URL for a blob", () => {
    const blob = new Blob(["test"], { type: "text/plain" });
    const { result } = renderHook(() => useBlobUrl(blob));
    expect(result.current).toMatch(/^blob:/);
  });

  it("revokes old URL when blob changes", () => {
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL");
    const blob1 = new Blob(["a"], { type: "text/plain" });
    const blob2 = new Blob(["b"], { type: "text/plain" });

    const { result, rerender } = renderHook(
      ({ blob }) => useBlobUrl(blob),
      { initialProps: { blob: blob1 as Blob | null } },
    );

    const firstUrl = result.current;
    expect(firstUrl).toMatch(/^blob:/);

    rerender({ blob: blob2 });

    expect(revokeSpy).toHaveBeenCalledWith(firstUrl);
    expect(result.current).toMatch(/^blob:/);
    expect(result.current).not.toBe(firstUrl);
  });

  it("revokes URL on unmount", () => {
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL");
    const blob = new Blob(["test"], { type: "text/plain" });
    const { result, unmount } = renderHook(() => useBlobUrl(blob));

    const url = result.current;
    unmount();

    expect(revokeSpy).toHaveBeenCalledWith(url);
  });

  it("uses key for stable identity", () => {
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL");
    const blob1 = new Blob(["a"], { type: "text/plain" });
    const blob2 = new Blob(["a"], { type: "text/plain" }); // different ref, same content

    const { result, rerender } = renderHook(
      ({ blob, key }) => useBlobUrl(blob, key),
      { initialProps: { blob: blob1 as Blob | null, key: "stable-id" } },
    );

    const firstUrl = result.current;

    // Same key, different blob ref — should NOT recreate URL
    rerender({ blob: blob2, key: "stable-id" });
    expect(result.current).toBe(firstUrl);
    expect(revokeSpy).not.toHaveBeenCalled();

    // Different key — should recreate URL
    rerender({ blob: blob2, key: "new-id" });
    expect(revokeSpy).toHaveBeenCalledWith(firstUrl);
    expect(result.current).not.toBe(firstUrl);
  });

  it("transitions from blob to null", () => {
    const blob = new Blob(["test"], { type: "text/plain" });
    const { result, rerender } = renderHook(
      ({ blob }) => useBlobUrl(blob),
      { initialProps: { blob: blob as Blob | null } },
    );

    expect(result.current).toMatch(/^blob:/);

    rerender({ blob: null });
    expect(result.current).toBeNull();
  });
});
