/**
 * @source window.matchMedia("(orientation: portrait)")
 * @support Universal
 * @description Returns true if viewport is portrait (height > width).
 *   Updates on orientation change / resize.
 */
import { useState, useEffect } from "react";

export function useOrientation(): "portrait" | "landscape" {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    () => window.innerHeight > window.innerWidth ? "portrait" : "landscape",
  );

  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait)");
    const update = (e: MediaQueryListEvent | MediaQueryList) => {
      setOrientation(e.matches ? "portrait" : "landscape");
    };
    update(mq);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return orientation;
}
