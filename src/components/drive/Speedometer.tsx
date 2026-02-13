import React, { useState, useEffect } from 'react';
import { formatSpeed } from '@/lib/drive-utils';
import { Navigation } from 'lucide-react';
import { useOSStore } from '@/store/use-os-store';
export function Speedometer() {
  const [speed, setSpeed] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const units = useOSStore((s) => s.settings.units);
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("GPS not supported");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const s = position.coords.speed;
        setSpeed(formatSpeed(s, units));
      },
      (err) => {
        console.error(err);
        setError("GPS Error");
      },
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [units]);
  return (
    <div className="flex flex-col items-center justify-center h-full relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-20">
        <Navigation className="w-12 h-12" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-8xl md:text-9xl font-black tracking-tighter tabular-nums text-primary drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          {speed}
        </span>
        <span className="text-2xl font-bold text-muted-foreground uppercase tracking-widest">
          {units}
        </span>
      </div>
      {error && (
        <span className="text-xs text-destructive mt-2 font-semibold uppercase">{error}</span>
      )}
    </div>
  );
}