import React, { useEffect, useRef } from 'react';
import { formatSpeed, haversineDistance } from '@/lib/drive-utils';
import { Navigation } from 'lucide-react';
import { useOSStore } from '@/store/use-os-store';
import { cn } from '@/lib/utils';
import { motion, useSpring, useMotionValue, useTransform, animate } from 'framer-motion';
export function Speedometer() {
  const currentPos = useOSStore((s) => s.currentPos);
  const currentSpeed = useOSStore((s) => s.currentSpeed);
  const units = useOSStore((s) => s.settings.units);
  const speedValue = useMotionValue(0);
  const smoothSpeed = useSpring(speedValue, {
    damping: 30,
    stiffness: 100,
    mass: 1
  });
  const displaySpeed = useTransform(smoothSpeed, (latest) => Math.round(latest));
  const prevRef = useRef<{ pos: [number, number]; ts: number } | null>(null);
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
        // Weighted average to filter GPS noise
        computedSpeed = (computedSpeed + calcSpeed) / 2;
      }
    }
    const targetConverted = formatSpeed(computedSpeed, units);
    speedValue.set(targetConverted);
    prevRef.current = { pos: currentPos, ts: now };
  }, [currentPos, currentSpeed, units, speedValue]);
  return (
    <div className="flex flex-col items-center justify-center h-full relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Navigation className="w-20 h-20" />
      </div>
      <div className="flex items-baseline gap-4 relative">
        <motion.span
          className="text-[12rem] font-black tracking-tighter tabular-nums text-primary transition-all duration-300"
          style={{
            textShadow: "0 0 40px rgba(59,130,246,0.3)"
          }}
        >
          {displaySpeed}
        </motion.span>
        <span className="text-4xl font-black text-muted-foreground uppercase tracking-[0.3em] ml-2">
          {units}
        </span>
      </div>
      <div className="mt-8 flex gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Bar key={i} index={i} smoothSpeed={smoothSpeed} />
        ))}
      </div>
    </div>
  );
}
function Bar({ index, smoothSpeed }: { index: number; smoothSpeed: any }) {
  const threshold = index * 15;
  const opacity = useTransform(smoothSpeed, [threshold - 5, threshold], [0.3, 1]);
  const scaleY = useTransform(smoothSpeed, [threshold - 5, threshold], [1, 1.25]);
  const bgColor = useTransform(
    smoothSpeed, 
    [threshold - 1, threshold], 
    ["#27272a", "#3b82f6"]
  );
  return (
    <motion.div
      style={{ opacity, scaleY, backgroundColor: bgColor }}
      className="h-3 w-16 rounded-full"
    />
  );
}