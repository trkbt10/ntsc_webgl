/**
 * @source MediaRecorder recording state (boolean)
 * @description Shows ●REC (blinking) when recording, STBY when idle.
 *   Connected to actual canvas recording via useCanvasRecorder.
 */
import { useState, useEffect } from "react";

export function RecIndicator({ recording = false, photoMode = false }: { recording?: boolean; photoMode?: boolean }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!recording) { setVisible(true); return; }
    const id = setInterval(() => setVisible((v) => !v), 600);
    return () => clearInterval(id);
  }, [recording]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: 10, height: 10, borderRadius: "50%",
          background: recording ? "#e00" : "#888",
          boxShadow: recording ? "0 0 6px #e00" : "none",
          opacity: recording && !visible ? 0 : 1,
          transition: "opacity 0.15s",
        }}
      />
      <span
        style={{
          fontSize: 13, fontWeight: 700,
          color: recording ? "#e00" : "#888",
          fontFamily: "monospace", letterSpacing: 1,
          textShadow: "0 1px 3px rgba(0,0,0,0.8)",
        }}
      >
        {photoMode ? "PHOTO" : recording ? "REC" : "STBY"}
      </span>
    </div>
  );
}
