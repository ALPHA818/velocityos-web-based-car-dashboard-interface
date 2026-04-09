import React, { useEffect, useRef } from 'react';
import { formatSpeed, haversineDistance } from '@/lib/drive-utils';
import { Navigation } from 'lucide-react';
import { useOSStore } from '@/store/use-os-store';
import { cn } from '@/lib/utils';
import { motion, useSpring, useMotionValue, useTransform, type MotionValue } from 'framer-motion';
import { useIsLandscapeMobile } from '@/hooks/use-landscape-mobile';
import { getWidgetSkinById } from '@/lib/cosmetic-market';
export function Speedometer() {
  const currentPos = useOSStore((s) => s.currentPos);
  const currentSpeed = useOSStore((s) => s.currentSpeed);
  const units = useOSStore((s) => s.settings.units);
  const activeWidgetSkinId = useOSStore((s) => s.activeWidgetSkinId);
  const isLandscapeMobile = useIsLandscapeMobile();
  const speedValue = useMotionValue(0);
  const activeWidgetSkin = getWidgetSkinById(activeWidgetSkinId) ?? getWidgetSkinById('widget-core-digital');
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

  const widgetTone = activeWidgetSkin?.style === 'retro'
    ? {
        shell: 'border-amber-300/18 bg-amber-950/18',
        trim: 'border-amber-200/25',
        value: 'font-mono text-amber-300 tracking-[0.06em]',
        unit: 'font-mono text-amber-100/75',
        shadow: isLandscapeMobile ? '0 0 26px rgba(245,158,11,0.35)' : '0 0 56px rgba(245,158,11,0.42)',
        barPalette: { start: '#292524', mid: '#f59e0b', end: '#fde68a', shadow: '0 0 16px rgba(245,158,11,0.45)' },
        glow: 'rgba(245,158,11,0.28)',
      }
    : activeWidgetSkin?.style === 'motorsport'
      ? {
          shell: 'border-rose-300/16 bg-zinc-950/38',
          trim: 'border-rose-200/22',
          value: 'text-rose-100',
          unit: 'text-rose-200/70',
          shadow: isLandscapeMobile ? '0 0 28px rgba(244,63,94,0.36)' : '0 0 58px rgba(244,63,94,0.45)',
          barPalette: { start: '#1f1f23', mid: '#fb7185', end: '#fecdd3', shadow: '0 0 18px rgba(251,113,133,0.45)' },
          glow: 'rgba(244,63,94,0.26)',
        }
      : activeWidgetSkin?.style === 'luxury'
        ? {
            shell: 'border-white/14 bg-stone-950/48',
            trim: 'border-amber-100/18',
            value: 'font-serif text-amber-50',
            unit: 'font-serif text-amber-100/70',
            shadow: isLandscapeMobile ? '0 0 24px rgba(251,191,36,0.22)' : '0 0 52px rgba(251,191,36,0.26)',
            barPalette: { start: '#292524', mid: '#f5deb0', end: '#fff7ed', shadow: '0 0 14px rgba(253,230,138,0.32)' },
            glow: 'rgba(251,191,36,0.18)',
          }
        : activeWidgetSkin?.style === 'cyber'
          ? {
              shell: 'border-emerald-400/16 bg-emerald-950/18',
              trim: 'border-emerald-200/22',
              value: 'font-mono text-emerald-300 tracking-[0.06em]',
              unit: 'font-mono text-cyan-200/78',
              shadow: isLandscapeMobile ? '0 0 28px rgba(16,185,129,0.34)' : '0 0 60px rgba(16,185,129,0.42)',
              barPalette: { start: '#0b1120', mid: '#34d399', end: '#67e8f9', shadow: '0 0 18px rgba(52,211,153,0.42)' },
              glow: 'rgba(16,185,129,0.2)',
            }
          : activeWidgetSkin?.style === 'expedition'
            ? {
                shell: 'border-lime-300/16 bg-lime-950/16',
                trim: 'border-lime-100/20',
                value: 'font-mono text-lime-100 tracking-[0.04em]',
                unit: 'font-mono text-lime-200/70',
                shadow: isLandscapeMobile ? '0 0 24px rgba(163,230,53,0.26)' : '0 0 54px rgba(163,230,53,0.3)',
                barPalette: { start: '#1a2e05', mid: '#84cc16', end: '#d9f99d', shadow: '0 0 16px rgba(132,204,22,0.36)' },
                glow: 'rgba(163,230,53,0.18)',
              }
            : {
                shell: 'border-white/10 bg-black/20',
                trim: 'border-white/10',
                value: 'text-primary',
                unit: 'text-muted-foreground',
                shadow: isLandscapeMobile ? '0 0 30px rgba(59,130,246,0.38)' : '0 0 60px rgba(59,130,246,0.45)',
                barPalette: { start: '#18181b', mid: '#3b82f6', end: '#ffffff', shadow: '0 0 15px rgba(59,130,246,0.5)' },
                glow: 'rgba(59,130,246,0.18)',
              };

  return (
    <div className={cn("flex h-full flex-col items-center justify-center overflow-hidden relative rounded-[2rem] border", widgetTone.shell, isLandscapeMobile && "gap-0.5")}>
      <div className={cn("pointer-events-none absolute inset-3 rounded-[1.65rem] border", widgetTone.trim)} />
      {activeWidgetSkin?.style === 'retro' && (
        <div
          className="pointer-events-none absolute inset-3 rounded-[1.65rem] opacity-20"
          style={{ backgroundImage: 'repeating-linear-gradient(180deg, rgba(251,191,36,0.2) 0 2px, transparent 2px 6px)' }}
        />
      )}
      {activeWidgetSkin?.style === 'motorsport' && (
        <div className="pointer-events-none absolute inset-x-6 top-4 h-1 rounded-full bg-gradient-to-r from-transparent via-rose-300/80 to-transparent opacity-70" />
      )}
      {activeWidgetSkin?.style === 'cyber' && (
        <div className="pointer-events-none absolute inset-4 rounded-[1.5rem]" style={{ boxShadow: 'inset 0 0 0 1px rgba(52,211,153,0.18), 0 0 28px rgba(16,185,129,0.12)' }} />
      )}
      {activeWidgetSkin?.style === 'expedition' && (
        <div className="pointer-events-none absolute inset-4 rounded-[1.55rem] opacity-25" style={{ backgroundImage: 'linear-gradient(135deg, rgba(163,230,53,0.18), transparent 45%), repeating-linear-gradient(90deg, rgba(163,230,53,0.14) 0 1px, transparent 1px 14px)' }} />
      )}
      <div className={cn("absolute top-0 right-0 opacity-10", isLandscapeMobile ? "hidden" : "p-3 md:p-4")}>
        <Navigation className={cn(isLandscapeMobile ? "w-8 h-8" : "w-12 h-12 md:w-20 md:h-20")} />
      </div>
      <div className={cn("flex items-baseline gap-2 sm:gap-3 md:gap-4 relative", isLandscapeMobile && "gap-1.5") }>
        <motion.span
          className={cn(
            "font-black tracking-tight tabular-nums transition-all duration-300 leading-none select-none text-neon",
            widgetTone.value,
            isLandscapeMobile
              ? "text-[2.4rem] sm:text-[2.8rem]"
              : "text-[5.25rem] sm:text-[7rem] md:text-[9rem] lg:text-[12rem]"
          )}
          style={{ textShadow: widgetTone.shadow }}
        >
          {displaySpeed}
        </motion.span>
        <span className={cn(
          "font-black uppercase tabular-nums",
          widgetTone.unit,
          isLandscapeMobile
            ? "text-xs tracking-[0.14em] ml-0.5"
            : "text-lg sm:text-2xl md:text-4xl tracking-[0.22em] md:tracking-[0.3em] ml-1 md:ml-2"
        )}>
          {units}
        </span>
      </div>
      {!isLandscapeMobile && (
        <div className="mt-4 sm:mt-6 md:mt-8 flex gap-2 sm:gap-3 md:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Bar key={i} index={i} smoothSpeed={smoothSpeed} compact={false} palette={widgetTone.barPalette} />
          ))}
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-10 bottom-2 h-10 rounded-full blur-2xl" style={{ background: widgetTone.glow }} />
    </div>
  );
}

function Bar({
  index,
  smoothSpeed,
  compact,
  palette,
}: {
  index: number;
  smoothSpeed: MotionValue<number>;
  compact: boolean;
  palette: { start: string; mid: string; end: string; shadow: string };
}) {
  const threshold = index * 10; // Dynamic scaling based on 6 bars up to 60+ units
  const opacity = useTransform(smoothSpeed, [threshold - 10, threshold], [0.15, 1]);
  const scaleY = useTransform(smoothSpeed, [threshold - 10, threshold], [1, 1.45]);
  const bgColor = useTransform(
    smoothSpeed,
    [threshold - 10, threshold, threshold + 30],
    [palette.start, palette.mid, palette.end]
  );
  return (
    <motion.div
      style={{ 
        opacity, 
        scaleY, 
        backgroundColor: bgColor,
        boxShadow: useTransform(smoothSpeed, [threshold - 5, threshold], ['none', palette.shadow])
      }}
      className={cn(
        "rounded-full transition-shadow duration-300",
        compact ? "h-2.5 w-6 sm:w-7" : "h-3 sm:h-4 w-8 sm:w-12 md:w-14 lg:w-[4.5rem]"
      )}
    />
  );
}