/**
 * @source navigator.getBattery() — Battery Status API
 * @support Chrome/Edge/Android: yes, Safari/iOS/Firefox: no
 * @returns { level: number | null, charging: boolean | null, supported: boolean }
 *   level: 0.0-1.0 or null if unsupported
 */
import { useState, useEffect } from "react";

interface BatteryState {
  level: number | null;
  charging: boolean | null;
  supported: boolean;
}

export function useBattery(): BatteryState {
  const [state, setState] = useState<BatteryState>({ level: null, charging: null, supported: false });

  useEffect(() => {
    const nav = navigator as any;
    if (typeof nav.getBattery !== "function") {
      setState({ level: null, charging: null, supported: false });
      return;
    }

    let battery: any = null;
    const update = () => {
      if (!battery) return;
      setState({ level: battery.level, charging: battery.charging, supported: true });
    };

    nav.getBattery().then((b: any) => {
      battery = b;
      update();
      b.addEventListener("levelchange", update);
      b.addEventListener("chargingchange", update);
    }).catch(() => {
      setState({ level: null, charging: null, supported: false });
    });

    return () => {
      if (battery) {
        battery.removeEventListener("levelchange", update);
        battery.removeEventListener("chargingchange", update);
      }
    };
  }, []);

  return state;
}
