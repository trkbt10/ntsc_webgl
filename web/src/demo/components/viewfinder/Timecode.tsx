/**
 * @source Date.now() — browser system clock
 * @description Displays elapsed recording time in HH:MM:SS:FF format.
 *   Starts counting when recording=true, resets to 00:00:00:00 when false.
 */
import { useState, useEffect, useRef } from "react";

export function Timecode({ recording = false }: { recording?: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);
  useEffect(() => {
    if (!recording) { setElapsed(0); return; }
    startRef.current = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - startRef.current), 100);
    return () => clearInterval(id);
  }, [recording]);

  const fmt = (n: number, d = 2) => String(n).padStart(d, "0");
  const totalSec = Math.floor(elapsed / 1000);
  const h = fmt(Math.floor(totalSec / 3600));
  const m = fmt(Math.floor((totalSec % 3600) / 60));
  const s = fmt(totalSec % 60);
  const f = fmt(Math.floor((elapsed % 1000) / (1000 / 30)));

  return (
    <span style={{ fontFamily: "monospace", fontSize: 13, color: "#fff", letterSpacing: 1, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
      {h}:{m}:{s}:{f}
    </span>
  );
}
