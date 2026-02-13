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
  const speedRef = useRef<number>(0);
  useEffect(() => {
    if (!currentPos) return;
    const now = Date.now();
    let computedSpeed = currentSpeed || 0;
    if (prevRef.current) {
      const prev = prevRef.current;
      const dt = (now - prev.ts) / 1000;
      if (dt > 0.5 && dt < 10) {
        const dist = haversineDistance(currentPos[0], currentPos[1], prev.pos[0], prev.pos[1]);
        const calcSpeed = dist / dt;
        computedSpeed = (computedSpeed + calcSpeed) / 2;
      }
    }
    const targetSpeed = formatSpeed(computedSpeed, units);
    // Smooth Lerp
    const lerpSpeed = () => {
      const diff = targetSpeed - speedRef.current;
      if (Math.abs(diff) < 0.1) {
        speedRef.current = targetSpeed;
        setDisplaySpeed(Math.round(targetSpeed));
        return;
      }
      speedRef.current += diff * 0.2; // Lerp factor
      setDisplaySpeed(Math.round(speedRef.current));
      requestAnimationFrame(lerpSpeed);
    };
    lerpSpeed();
    prevRef.current = { pos: currentPos, ts: now };
  }, [currentPos, currentSpeed, units]);
  return (
    <div className="flex flex-col items-center justify-center h-full relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Navigation className="w-20 h-20" />
      </div>
      <div className="flex items-baseline gap-4 relative">
        <span 
          className="text-[12rem] font-black tracking-tighter tabular-nums text-primary transition-all duration-300"
          style={{ 
            filter: `drop-shadow(0 0 ${Math.min(displaySpeed, 100) / 2}px rgba(59,130,246,0.8))` 
          }}
        >
          {displaySpeed}
        </span>
        <span className="text-4xl font-black text-muted-foreground uppercase tracking-[0.3em] ml-2">
          {units}
        </span>
      </div>
      <div className="mt-8 flex gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              "h-3 w-16 rounded-full transition-all duration-500",
              displaySpeed > i * 15 ? "bg-primary shadow-glow-lg scale-y-125" : "bg-zinc-800"
            )}
            style={{ 
              opacity: displaySpeed > i * 15 ? 1 : 0.3,
              boxShadow: displaySpeed > i * 15 ? `0 0 ${displaySpeed/2}px rgba(59,130,246,0.6)` : 'none'
            }}
          />
        ))}
      </div>
    </div>
  );
}