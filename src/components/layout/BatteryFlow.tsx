import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useOSStore } from '@/store/use-os-store';
import { getWidgetSkinById } from '@/lib/cosmetic-market';

interface BatteryFlowProps {
  level: number;
  charging: boolean;
  compact?: boolean;
  orientation?: 'vertical' | 'horizontal';
}

export function BatteryFlow({ level, charging, compact, orientation = 'vertical' }: BatteryFlowProps) {
  const clamped = Math.max(0, Math.min(100, level));
  const horizontal = orientation === 'horizontal';
  const activeWidgetSkinId = useOSStore(s => s.activeWidgetSkinId);
  const activeWidgetSkin = getWidgetSkinById(activeWidgetSkinId) ?? getWidgetSkinById('widget-core-digital');

  const frameClassName = activeWidgetSkin?.style === 'retro'
    ? 'border-amber-300/80 bg-amber-950/35'
    : activeWidgetSkin?.style === 'motorsport'
      ? 'border-rose-300/80 bg-zinc-950/75'
      : activeWidgetSkin?.style === 'luxury'
        ? 'border-amber-100/55 bg-zinc-950/80'
        : activeWidgetSkin?.style === 'cyber'
          ? 'border-emerald-300/65 bg-emerald-950/25'
          : activeWidgetSkin?.style === 'expedition'
            ? 'border-lime-200/70 bg-lime-950/20'
            : 'border-white/70 bg-black/40';

  const terminalClassName = activeWidgetSkin?.style === 'retro'
    ? 'border-amber-200/70 bg-amber-100/20'
    : activeWidgetSkin?.style === 'motorsport'
      ? 'border-rose-200/70 bg-rose-100/20'
      : activeWidgetSkin?.style === 'luxury'
        ? 'border-amber-50/50 bg-white/15'
        : activeWidgetSkin?.style === 'cyber'
          ? 'border-emerald-200/60 bg-emerald-100/15'
          : activeWidgetSkin?.style === 'expedition'
            ? 'border-lime-100/60 bg-lime-100/15'
            : 'border-white/60 bg-white/20';

  const fillGradient = charging
    ? 'from-emerald-300/90 via-emerald-400/90 to-emerald-500/90'
    : clamped < 20
      ? 'from-rose-300/90 via-rose-400/90 to-rose-500/90'
      : activeWidgetSkin?.style === 'retro'
        ? 'from-amber-200/90 via-amber-400/90 to-orange-500/90'
        : activeWidgetSkin?.style === 'motorsport'
          ? 'from-rose-200/90 via-rose-400/90 to-red-500/90'
          : activeWidgetSkin?.style === 'luxury'
            ? 'from-stone-100/90 via-amber-100/85 to-amber-300/85'
            : activeWidgetSkin?.style === 'cyber'
              ? 'from-emerald-200/90 via-cyan-300/90 to-sky-400/90'
              : activeWidgetSkin?.style === 'expedition'
                ? 'from-lime-200/90 via-emerald-300/90 to-teal-400/90'
                : 'from-cyan-300/90 via-sky-400/90 to-blue-500/90';

  const labelClassName = activeWidgetSkin?.style === 'retro'
    ? 'font-mono text-amber-200 tracking-[0.14em]'
    : activeWidgetSkin?.style === 'luxury'
      ? 'font-serif text-amber-50'
      : activeWidgetSkin?.style === 'cyber'
        ? 'font-mono text-emerald-200 tracking-[0.14em]'
        : activeWidgetSkin?.style === 'expedition'
          ? 'font-mono text-lime-100 tracking-[0.12em]'
          : 'text-white';

  return (
    <div className={cn('flex items-center', horizontal ? 'gap-1.5' : 'flex-col gap-1')}>
      <div
        className={cn(
          'relative overflow-hidden rounded-md border-2',
          frameClassName,
          horizontal
            ? compact
              ? 'w-10 h-6'
              : 'w-14 h-7'
            : compact
              ? 'w-6 h-10'
              : 'w-8 h-12'
        )}
      >
        <div
          className={cn(
            'absolute rounded-sm border',
            terminalClassName,
            horizontal
              ? compact
                ? '-right-1 top-1/2 -translate-y-1/2 w-1 h-2'
                : '-right-1 top-1/2 -translate-y-1/2 w-1 h-2.5'
              : compact
                ? '-top-1 left-1/2 -translate-x-1/2 w-2 h-1'
                : '-top-1 left-1/2 -translate-x-1/2 w-2.5 h-1'
          )}
        />

        <motion.div
          className={cn(
            'absolute',
            fillGradient,
            horizontal ? 'inset-y-0 left-0 bg-gradient-to-r' : 'inset-x-0 bottom-0 bg-gradient-to-t'
          )}
          animate={horizontal ? { width: `${clamped}%` } : { height: `${clamped}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <motion.div
            className={cn(
              'absolute rounded-full bg-white/50 blur-[1px]',
              horizontal ? '-left-1 top-0 bottom-0 w-2' : '-top-1 left-0 right-0 h-2'
            )}
            animate={horizontal ? { y: ['-8%', '8%', '-8%'] } : { x: ['-8%', '8%', '-8%'] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
      <span className={cn('font-black tabular-nums leading-none', compact ? 'text-[9px]' : 'text-[11px]', labelClassName)}>{clamped}%</span>
    </div>
  );
}
