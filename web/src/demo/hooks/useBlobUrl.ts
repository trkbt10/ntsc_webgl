import { useState, useEffect } from "react";

// ── Low-level utilities (SoT for all Object URL operations) ──

/** Create an Object URL from a Blob. All createObjectURL calls must go through here. */
export function createBlobUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/** Revoke an Object URL. All revokeObjectURL calls must go through here. */
export function revokeBlobUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/** Create a temporary Object URL, use it, then immediately revoke. */
export function withBlobUrl<T>(blob: Blob, fn: (url: string) => T): T {
  const url = createBlobUrl(blob);
  try {
    return fn(url);
  } finally {
    revokeBlobUrl(url);
  }
}

/** Trigger a browser file download from a Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  withBlobUrl(blob, (url) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  });
}

// ── React hook ──

/**
 * Manages the lifecycle of a Blob Object URL within a React component.
 * Creates a URL when blob changes, revokes the old one, and cleans up on unmount.
 */
export function useBlobUrl(blob: Blob | null, key?: string): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }

    const objectUrl = createBlobUrl(blob);
    setUrl(objectUrl);

    return () => {
      revokeBlobUrl(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key ?? blob]);

  return url;
}
