import React, { useState, useEffect, useRef } from 'react';
import { formatSpeed, haversineDistance } from '@/lib/drive-utils';
import { Navigation } from 'lucide-react';
import { useOSStore } from '@/store/use-os-store';
import { cn } from '@/lib/utils';
export function Speedometer() {
  const currentPos = useOSStore((s) => s.currentPos);
  const currentSpeed = useOSStore((s) => s.currentSpeed);
  const units = useOSStore((s) => s.settings.units);
  const [displaySpeed, setDisplaySpeed] = useState<number>(0);
  const prevRef = useRef<{ pos: [number, number]; ts: number } | null>(null);
  useEffect(() => {
    if (!currentPos) return;
    const now = Date.now();
    let computedSpeed = currentSpeed || 0;
    // Fallback haversine calculation for redundancy
    if (prevRef.current) {
      const prev = prevRef.current;
      const dt = (now - prev.ts) / 1000;
      if (dt > 0.5 && dt < 10) {
        const dist = haversineDistance(currentPos[0], currentPos[1], prev.pos[0], prev.pos[1]);
        const calcSpeed = dist / dt;
        // Average the reported GPS speed and computed speed for smoother display
        computedSpeed = (computedSpeed + calcSpeed) / 2;
      }
    }
    setDisplaySpeed(formatSpeed(computedSpeed, units));
    prevRef.current = { pos: currentPos, ts: now };
  }, [currentPos, currentSpeed, units]);
  return (
    <div className="flex flex-col items-center justify-center h-full relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Navigation className="w-16 h-16" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-9xl md:text-[10rem] font-black tracking-tighter tabular-nums text-primary drop-shadow-[0_0_30px_rgba(59,130,246,0.4)]">
          {displaySpeed}
        </span>
        <span className="text-3xl font-bold text-muted-foreground uppercase tracking-[0.2em]">
          {units}
        </span>
      </div>
      <div className="mt-6 flex gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-2 w-12 rounded-full transition-colors duration-500",
              displaySpeed > i * 20 ? "bg-primary shadow-glow" : "bg-zinc-800"
            )}
          />
        ))}
      </div>
    </div>
  );
}