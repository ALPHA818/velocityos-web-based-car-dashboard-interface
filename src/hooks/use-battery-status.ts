import { useEffect, useState } from 'react';

interface BatteryManagerLike extends EventTarget {
  level: number;
  charging: boolean;
  addEventListener(type: 'levelchange' | 'chargingchange', listener: () => void): void;
  removeEventListener(type: 'levelchange' | 'chargingchange', listener: () => void): void;
}

interface BatteryStatus {
  level: number;
  charging: boolean;
  supported: boolean;
}

export function useBatteryStatus(): BatteryStatus {
  const [status, setStatus] = useState<BatteryStatus>({
    level: 100,
    charging: false,
    supported: false,
  });

  useEffect(() => {
    let battery: BatteryManagerLike | null = null;
    let disposed = false;

    const update = () => {
      if (!battery || disposed) return;
      setStatus({
        level: Math.round((battery.level || 0) * 100),
        charging: !!battery.charging,
        supported: true,
      });
    };

    const nav = navigator as Navigator & {
      getBattery?: () => Promise<BatteryManagerLike>;
    };

    if (typeof nav.getBattery !== 'function') {
      return;
    }

    nav.getBattery()
      .then((manager) => {
        if (disposed) return;
        battery = manager;
        update();
        manager.addEventListener('levelchange', update);
        manager.addEventListener('chargingchange', update);
      })
      .catch(() => {
        // Keep fallback values when battery API is unavailable.
      });

    return () => {
      disposed = true;
      if (!battery) return;
      battery.removeEventListener('levelchange', update);
      battery.removeEventListener('chargingchange', update);
    };
  }, []);

  return status;
}
