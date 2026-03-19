import { useCallback } from "react";

/**
 * Wrapper for the View Transitions API.
 * Falls back to immediate execution when unsupported.
 */
export function useViewTransition() {
  const startTransition = useCallback((update: () => void) => {
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      (document as any).startViewTransition(update);
    } else {
      update();
    }
  }, []);

  return { startTransition };
}
