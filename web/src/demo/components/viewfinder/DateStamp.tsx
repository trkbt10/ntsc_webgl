/**
 * @source Date() — browser system clock
 * @support Universal
 * @description Displays current date/time in Japanese camcorder format (amber text).
 */
import { useState, useEffect } from "react";

export function DateStamp() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const y = now.getFullYear();
  const mo = now.getMonth() + 1;
  const d = now.getDate();
  const h = now.getHours();
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;

  return (
    <span style={{ fontFamily: "monospace", fontSize: 12, color: "#f8a020", textShadow: "0 0 4px rgba(248,160,32,0.4), 0 1px 2px rgba(0,0,0,0.8)", letterSpacing: 0.5 }}>
      {y}年{mo}月{d}日 {ampm} {h12}:{mi}
    </span>
  );
}
