import React from 'react';
import { Route } from 'lucide-react';
import { useOSStore } from '@/store/use-os-store';
import { cn } from '@/lib/utils';
import { useIsLandscapeMobile } from '@/hooks/use-landscape-mobile';
import { getTripCosmeticById, getWidgetSkinById } from '@/lib/cosmetic-market';

export function DistanceBubble() {
  const totalDistanceKm = useOSStore((s) => s.totalDistanceKm);
  const tripCount = useOSStore((s) => s.trips.length);
  const activeTripCosmeticId = useOSStore((s) => s.activeTripCosmeticId);
  const activeWidgetSkinId = useOSStore((s) => s.activeWidgetSkinId);
  const isLandscapeMobile = useIsLandscapeMobile();
  const activeTripCosmetic = getTripCosmeticById(activeTripCosmeticId) ?? getTripCosmeticById('trip-core-navigator');
  const activeWidgetSkin = getWidgetSkinById(activeWidgetSkinId) ?? getWidgetSkinById('widget-core-digital');

  const value = totalDistanceKm >= 100 ? totalDistanceKm.toFixed(0) : totalDistanceKm.toFixed(1);
  const milestoneLabel = totalDistanceKm >= 1000 ? 'Road Veteran' : totalDistanceKm >= 250 ? 'On Pace' : 'New Run';

  const frameClassName = activeWidgetSkin?.style === 'retro'
    ? 'border-amber-300/20 bg-amber-950/20 text-amber-100'
    : activeWidgetSkin?.style === 'motorsport'
      ? 'border-rose-300/18 bg-zinc-950/38 text-rose-50'
      : activeWidgetSkin?.style === 'luxury'
        ? 'border-white/15 bg-stone-950/45 text-amber-50'
        : activeWidgetSkin?.style === 'cyber'
          ? 'border-emerald-400/18 bg-emerald-950/18 text-emerald-50'
          : activeWidgetSkin?.style === 'expedition'
            ? 'border-lime-300/18 bg-lime-950/18 text-lime-50'
            : 'border-white/10 bg-white/5 text-foreground';

  const valueClassName = activeWidgetSkin?.style === 'retro'
    ? 'font-mono text-amber-200 tracking-[0.06em]'
    : activeWidgetSkin?.style === 'luxury'
      ? 'font-serif text-amber-50'
      : activeWidgetSkin?.style === 'cyber'
        ? 'font-mono text-emerald-200 tracking-[0.08em]'
        : activeWidgetSkin?.style === 'expedition'
          ? 'font-mono text-lime-100 tracking-[0.05em]'
          : 'text-foreground';

  return (
    <div className={cn('relative flex h-full flex-col justify-center overflow-hidden rounded-[1.8rem] border px-4 py-3', frameClassName)}>
      <div className="absolute inset-0 opacity-60" style={{ background: activeTripCosmetic?.surface }} />
      <div className="absolute inset-x-5 top-4 h-px opacity-60" style={{ background: activeTripCosmetic?.glow }} />
      <div className="relative z-10 flex items-center justify-between">
        <span
          className="rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.22em]"
          style={{ borderColor: activeTripCosmetic?.glow, color: activeTripCosmetic?.glow, background: 'rgba(10,10,12,0.36)' }}
        >
          {activeTripCosmetic?.badgeLabel}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{milestoneLabel}</span>
      </div>
      <div
        className="relative z-10 mt-3 rounded-[1.4rem] border px-3 py-3"
        style={{ borderColor: `${activeTripCosmetic?.glow}44`, background: activeTripCosmetic?.plate, boxShadow: `0 0 24px ${activeTripCosmetic?.glow}22` }}
      >
        <div className={cn('flex items-center', isLandscapeMobile ? 'gap-1.5' : 'gap-3')}>
          <Route className={cn(isLandscapeMobile ? 'w-4 h-4' : 'w-7 h-7')} style={{ color: activeTripCosmetic?.glow }} />
          <span className={cn(
            'font-black tracking-tighter tabular-nums leading-none',
            valueClassName,
            isLandscapeMobile ? 'text-3xl' : 'text-6xl md:text-7xl'
          )}>
            {value}
          </span>
        </div>
        <div className={cn(
          'uppercase tracking-wider font-semibold',
          isLandscapeMobile ? 'mt-0.5 text-[10px]' : 'mt-2 text-sm md:text-lg'
        )}>
          KM Driven
        </div>
      </div>
      <div className="relative z-10 mt-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        <span>{tripCount} Trips Logged</span>
        <span>{activeTripCosmetic?.frameLabel}</span>
      </div>
    </div>
  );
}
