import React from 'react';
import { Route } from 'lucide-react';
import { useOSStore } from '@/store/use-os-store';
import { cn } from '@/lib/utils';
import { useIsLandscapeMobile } from '@/hooks/use-landscape-mobile';

export function DistanceBubble() {
  const totalDistanceKm = useOSStore((s) => s.totalDistanceKm);
  const isLandscapeMobile = useIsLandscapeMobile();

  const value = totalDistanceKm >= 100 ? totalDistanceKm.toFixed(0) : totalDistanceKm.toFixed(1);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className={cn("flex items-center", isLandscapeMobile ? "gap-1.5" : "gap-3")}>
        <Route className={cn("text-primary", isLandscapeMobile ? "w-4 h-4" : "w-7 h-7")} />
        <span className={cn(
          "font-black tracking-tighter tabular-nums leading-none",
          isLandscapeMobile ? "text-3xl" : "text-6xl md:text-7xl"
        )}>
          {value}
        </span>
      </div>
      <div className={cn(
        "text-muted-foreground uppercase tracking-wider font-semibold",
        isLandscapeMobile ? "text-[10px] mt-0.5" : "text-sm md:text-lg mt-2"
      )}>
        KM Driven
      </div>
    </div>
  );
}
