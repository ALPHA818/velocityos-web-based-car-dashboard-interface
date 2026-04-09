import React from 'react';
import { Cloud, Sun, CloudRain, CloudLightning, Thermometer, MapPinOff, AlertTriangle } from 'lucide-react';
import { useOSStore } from '@/store/use-os-store';
import { cn } from '@/lib/utils';
import { getWidgetSkinById } from '@/lib/cosmetic-market';
import { useWeatherSnapshot } from '@/hooks/use-weather-snapshot';
export function WeatherWidget() {
  const gpsStatus = useOSStore((s) => s.gpsStatus);
  const activeWidgetSkinId = useOSStore((s) => s.activeWidgetSkinId);
  const activeWidgetSkin = getWidgetSkinById(activeWidgetSkinId) ?? getWidgetSkinById('widget-core-digital');
  const { weather, error } = useWeatherSnapshot();

  const shellClassName = activeWidgetSkin?.style === 'retro'
    ? 'border-amber-300/20 bg-amber-950/20 text-amber-100'
    : activeWidgetSkin?.style === 'motorsport'
      ? 'border-rose-300/18 bg-zinc-950/40 text-rose-50'
      : activeWidgetSkin?.style === 'luxury'
        ? 'border-white/15 bg-stone-950/45 text-amber-50'
        : activeWidgetSkin?.style === 'cyber'
          ? 'border-emerald-400/18 bg-emerald-950/20 text-emerald-50'
          : activeWidgetSkin?.style === 'expedition'
            ? 'border-lime-300/18 bg-lime-950/18 text-lime-50'
            : 'border-white/10 bg-white/5 text-foreground';

  const badgeClassName = activeWidgetSkin?.style === 'retro'
    ? 'bg-amber-100/10 text-amber-200'
    : activeWidgetSkin?.style === 'motorsport'
      ? 'bg-rose-200/10 text-rose-200'
      : activeWidgetSkin?.style === 'luxury'
        ? 'bg-white/10 text-amber-100'
        : activeWidgetSkin?.style === 'cyber'
          ? 'bg-emerald-200/10 text-emerald-200'
          : activeWidgetSkin?.style === 'expedition'
            ? 'bg-lime-200/10 text-lime-200'
            : 'bg-white/5 text-muted-foreground';

  const accentTextClassName = activeWidgetSkin?.style === 'retro'
    ? 'text-amber-200'
    : activeWidgetSkin?.style === 'motorsport'
      ? 'text-rose-200'
      : activeWidgetSkin?.style === 'luxury'
        ? 'text-amber-100'
        : activeWidgetSkin?.style === 'cyber'
          ? 'text-emerald-200'
          : activeWidgetSkin?.style === 'expedition'
            ? 'text-lime-200'
            : 'text-muted-foreground';

  const valueClassName = activeWidgetSkin?.style === 'retro'
    ? 'font-mono text-amber-200 tracking-[0.08em]'
    : activeWidgetSkin?.style === 'luxury'
      ? 'font-serif text-amber-50'
      : activeWidgetSkin?.style === 'cyber'
        ? 'font-mono text-emerald-200 tracking-[0.08em]'
        : activeWidgetSkin?.style === 'expedition'
          ? 'font-mono text-lime-100 tracking-[0.06em]'
          : 'font-bold';

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 text-yellow-500" />;
    if (code < 4) return <Cloud className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 text-zinc-400" />;
    if (code < 70) return <CloudRain className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 text-blue-400" />;
    return <CloudLightning className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 text-cyan-300" />;
  };
  if (error) {
    return (
      <div className={cn('flex h-full flex-col items-center justify-center gap-2 rounded-[1.75rem] border opacity-70', shellClassName)}>
        <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 text-destructive" />
        <span className="text-xs uppercase font-black tracking-widest text-destructive">Weather Unavailable</span>
      </div>
    );
  }
  if (gpsStatus === 'denied' && !weather) {
     return (
       <div className={cn('flex h-full flex-col items-center justify-center gap-2 rounded-[1.75rem] border opacity-50', shellClassName)}>
         <MapPinOff className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 text-muted-foreground" />
         <span className="text-xs uppercase font-black tracking-widest">No Location</span>
       </div>
     );
  }
  if (!weather) return <div className={cn('h-full w-full animate-pulse rounded-2xl border md:rounded-3xl', shellClassName)} />;
  return (
    <div className={cn('flex h-full flex-col items-center justify-center gap-3 rounded-[1.75rem] border px-4 py-3 md:gap-4', shellClassName)}>
      <div className={cn('rounded-full p-3 md:p-4', badgeClassName)}>
        {getWeatherIcon(weather.code)}
      </div>
      <div className="flex items-center gap-1">
        <Thermometer className={cn('h-5 w-5 md:h-6 md:w-6', accentTextClassName)} />
        <span className={cn('text-3xl sm:text-4xl md:text-5xl tabular-nums leading-none', valueClassName)}>
          {weather.temp}°
        </span>
      </div>
      <span className={cn('text-[10px] font-black uppercase tracking-[0.28em]', badgeClassName)}>{activeWidgetSkin?.label}</span>
    </div>
  );
}