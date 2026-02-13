import React, { useEffect, useRef } from 'react';
import { formatSpeed, haversineDistance } from '@/lib/drive-utils';
import { Navigation } from 'lucide-react';
import { useOSStore } from '@/store/use-os-store';
import { cn } from '@/lib/utils';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';
export function Speedometer() {
  const currentPos = useOSStore((s) => s.currentPos);
  const currentSpeed = useOSStore((s) => s.currentSpeed);
  const units = useOSStore((s) => s.settings.units);
  const speedValue = useMotionValue(0);
  const smoothSpeed = useSpring(speedValue, {
    damping: 25, // Reduced damping for faster response
    stiffness: 120, // Increased stiffness for punchier updates
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
      if (dt > 0.4 && dt < 8) {
        const dist = haversineDistance(currentPos[0], currentPos[1], prev.pos[0], prev.pos[1]);
        const calcSpeed = dist / dt;
        // Faster smoothing to reduce lag during acceleration
        computedSpeed = (computedSpeed * 0.4) + (calcSpeed * 0.6);
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
          className="text-[12rem] font-black tracking-tight tabular-nums text-primary transition-all duration-300 leading-none select-none text-neon"
          style={{
            textShadow: "0 0 60px rgba(59,130,246,0.45)"
          }}
        >
          {displaySpeed}
        </motion.span>
        <span className="text-4xl font-black text-muted-foreground uppercase tracking-[0.3em] tabular-nums ml-2">
          {units}
        </span>
      </div>
      <div className="mt-8 flex gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Bar key={i} index={i} smoothSpeed={smoothSpeed} />
        ))}
      </div>
    </div>
  );
}
function Bar({ index, smoothSpeed }: { index: number; smoothSpeed: any }) {
  const threshold = index * 10; // Dynamic scaling based on 6 bars up to 60+ units
  const opacity = useTransform(smoothSpeed, [threshold - 10, threshold], [0.15, 1]);
  const scaleY = useTransform(smoothSpeed, [threshold - 10, threshold], [1, 1.45]);
  const bgColor = useTransform(
    smoothSpeed,
    [threshold - 10, threshold, threshold + 30],
    ["#18181b", "#3b82f6", "#ffffff"] // Gradient shift to white as speed peaks
  );
  return (
    <motion.div
      style={{ 
        opacity, 
        scaleY, 
        backgroundColor: bgColor,
        boxShadow: useTransform(smoothSpeed, [threshold - 5, threshold], ["none", "0 0 15px rgba(59,130,246,0.5)"])
      }}
      className="h-4 w-18 rounded-full transition-shadow duration-300"
    />
  );
}