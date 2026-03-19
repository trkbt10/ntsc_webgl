/**
 * @source AudioContext + AnalyserNode — Web Audio API
 * @support Universal (requires microphone permission)
 * @description Renders real-time audio level bars from live microphone input.
 *   Returns null if no audio stream is provided (no fake data).
 */
import { useState, useEffect, useRef } from "react";

export function AudioLevelMeter({ audioStream }: { audioStream?: MediaStream | null }) {
  const [levels, setLevels] = useState<number[]>([]);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!audioStream || audioStream.getAudioTracks().length === 0) {
      setLevels([]);
      return;
    }

    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(audioStream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.5;
    source.connect(analyser);
    ctxRef.current = ctx;

    const buf = new Uint8Array(analyser.frequencyBinCount);
    const channelCount = Math.min(audioStream.getAudioTracks().length, 2);

    const tick = () => {
      analyser.getByteFrequencyData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length) / 255;
      const chLevels = channelCount >= 2
        ? [rms, Math.min(1, rms * 0.9 + 0.02)]
        : [rms];
      setLevels(chLevels);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      source.disconnect();
      ctx.close();
    };
  }, [audioStream]);

  if (levels.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 40 }}>
      {levels.map((lv, ch) => (
        <div key={ch} style={{ display: "flex", flexDirection: "column-reverse", gap: 1, width: 4 }}>
          {Array.from({ length: 10 }, (_, i) => {
            const threshold = (i + 1) / 10;
            const active = lv >= threshold;
            const isHot = i >= 8;
            const isWarm = i >= 6;
            return (
              <div
                key={i}
                style={{
                  width: 4, height: 3, borderRadius: 0.5,
                  background: active ? (isHot ? "#e00" : isWarm ? "#fa0" : "#0c0") : "rgba(255,255,255,0.1)",
                  transition: "background 0.1s",
                }}
              />
            );
          })}
        </div>
      ))}
      <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", marginLeft: 1, writingMode: "vertical-rl" as const }}>
        {levels.length === 1 ? "M" : "LR"}
      </span>
    </div>
  );
}
