import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BatteryFlowProps {
  level: number;
  charging: boolean;
  compact?: boolean;
  orientation?: 'vertical' | 'horizontal';
}

export function BatteryFlow({ level, charging, compact, orientation = 'vertical' }: BatteryFlowProps) {
  const clamped = Math.max(0, Math.min(100, level));
  const horizontal = orientation === 'horizontal';
  const fillColor = charging
    ? 'from-emerald-300/90 via-emerald-400/90 to-emerald-500/90'
    : clamped < 20
      ? 'from-rose-300/90 via-rose-400/90 to-rose-500/90'
      : 'from-cyan-300/90 via-sky-400/90 to-blue-500/90';

  return (
    <div className={cn('flex items-center', horizontal ? 'gap-1.5' : 'flex-col gap-1')}>
      <div
        className={cn(
          'relative rounded-md border-2 border-white/70 bg-black/40 overflow-hidden',
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
            'absolute rounded-sm border border-white/60 bg-white/20',
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
      <span className={cn('font-black tabular-nums leading-none', compact ? 'text-[9px]' : 'text-[11px]')}>{clamped}%</span>
    </div>
  );
}
