import React, { useState, useEffect } from 'react';
import { formatSpeed, haversineDistance } from '@/lib/drive-utils';
import { Navigation } from 'lucide-react';
import { useOSStore } from '@/store/use-os-store';
export function Speedometer() {
  const [speed, setSpeed] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const prevRef = React.useRef<{ coords: { latitude: number; longitude: number }; timestamp: number } | null>(null);
  const units = useOSStore((s) => s.settings.units);
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("GPS not supported");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { coords, timestamp } = position;
        if (prevRef.current) {
          const prev = prevRef.current;
          const dt = (timestamp - prev.timestamp) / 1000;
          if (dt > 0.5 && dt < 30) {
            const dist = haversineDistance(coords.latitude, coords.longitude, prev.coords.latitude, prev.coords.longitude);
            const computedSpeed = dist / dt;
            const gpsSpeed = coords.speed || 0;
            const s = (computedSpeed + gpsSpeed) / 2;
            setSpeed(formatSpeed(s, units));
          } else {
            setSpeed(formatSpeed(coords.speed || 0, units));
          }
        } else {
          setSpeed(formatSpeed(coords.speed || 0, units));
        }
        prevRef.current = { coords: { latitude: coords.latitude, longitude: coords.longitude }, timestamp };
      },
      (err) => {
        if (err.code === 1) {
          setError("Location Denied");
        } else {
          setError(`GPS Error (${err.code})`);
          console.error(`Geolocation error: ${err.message}`);
        }
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
        <div className="mt-4 px-4 py-2 bg-destructive/10 rounded-full flex items-center gap-2">
          <span className="text-xs text-destructive font-black uppercase tracking-tighter">
            {error === "Location Denied" ? "Enable Location in Settings" : error}
          </span>
        </div>
      )}
    </div>
  );
}