import React, { useMemo } from 'react';
import { CarLayout } from '@/components/layout/CarLayout';
import { useOSStore } from '@/store/use-os-store';
import { cn } from '@/lib/utils';
import { useIsLandscapeMobile } from '@/hooks/use-landscape-mobile';
import { Award, Flame, GaugeCircle, MapPinned, Route, TrendingUp } from 'lucide-react';
import { getTripCosmeticById, getWidgetSkinById } from '@/lib/cosmetic-market';
import { getTripInsightSummary } from '@/lib/trip-insights';
import { SystemStatePanel } from '@/components/system/SystemStatePanel';
import { useNavigate } from 'react-router-dom';

export default function TripsPage() {
  const navigate = useNavigate();
  const trips = useOSStore((s) => s.trips || []);
  const totalDistanceKm = useOSStore((s) => s.totalDistanceKm);
  const activeTripCosmeticId = useOSStore((s) => s.activeTripCosmeticId);
  const activeWidgetSkinId = useOSStore((s) => s.activeWidgetSkinId);
  const isLandscapeMobile = useIsLandscapeMobile();
  const activeTripCosmetic = getTripCosmeticById(activeTripCosmeticId) ?? getTripCosmeticById('trip-core-navigator');
  const activeWidgetSkin = getWidgetSkinById(activeWidgetSkinId) ?? getWidgetSkinById('widget-core-digital');

  const shellClassName = activeWidgetSkin?.style === 'retro'
    ? 'border-amber-300/18 bg-amber-950/18 text-amber-100'
    : activeWidgetSkin?.style === 'motorsport'
      ? 'border-rose-300/16 bg-zinc-950/38 text-rose-50'
      : activeWidgetSkin?.style === 'luxury'
        ? 'border-white/15 bg-stone-950/46 text-amber-50'
        : activeWidgetSkin?.style === 'cyber'
          ? 'border-emerald-400/16 bg-emerald-950/18 text-emerald-50'
          : activeWidgetSkin?.style === 'expedition'
            ? 'border-lime-300/18 bg-lime-950/18 text-lime-50'
            : 'border-white/10 bg-black/35 text-foreground';

  const valueClassName = activeWidgetSkin?.style === 'retro'
    ? 'font-mono text-amber-200 tracking-[0.08em]'
    : activeWidgetSkin?.style === 'luxury'
      ? 'font-serif text-amber-50'
      : activeWidgetSkin?.style === 'cyber'
        ? 'font-mono text-emerald-200 tracking-[0.08em]'
        : activeWidgetSkin?.style === 'expedition'
          ? 'font-mono text-lime-100 tracking-[0.06em]'
          : 'text-foreground';

  const totalDurationMin = trips.reduce((sum, trip) => {
    const durationMs = trip.endTime ? trip.endTime - trip.startTime : Date.now() - trip.startTime;
    return sum + Math.max(0, Math.round(durationMs / 60000));
  }, 0);
  const tripInsights = useMemo(() => getTripInsightSummary(trips), [trips]);

  const getTripRank = (distanceKm: number, durationMin: number) => {
    if (distanceKm >= 80) return 'Long Haul';
    if (durationMin >= 90) return 'Endurance';
    if (distanceKm >= 25) return 'Cruise';
    return 'Sprint';
  };

  return (
    <CarLayout>
      <div className={cn('max-w-7xl mx-auto', isLandscapeMobile ? 'px-2 py-2 space-y-3' : 'px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6')}>
        <header className="space-y-1">
          <h1 className={cn('font-black tracking-tighter', isLandscapeMobile ? 'text-2xl' : 'text-5xl')}>Trips</h1>
          <p className={cn('text-muted-foreground', isLandscapeMobile ? 'text-xs' : 'text-lg')}>A new trip is created each time driving starts</p>
        </header>

        <section className={cn('relative overflow-hidden rounded-[2rem] border px-4 py-4', shellClassName)}>
          <div className="absolute inset-0 opacity-70" style={{ background: activeTripCosmetic?.surface }} />
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <span
                className="inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em]"
                style={{ borderColor: activeTripCosmetic?.glow, color: activeTripCosmetic?.glow, background: 'rgba(8,12,18,0.42)' }}
              >
                {activeTripCosmetic?.badgeLabel}
              </span>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{activeTripCosmetic?.frameLabel}</div>
                <h2 className={cn('mt-2 font-black tracking-tight', valueClassName, isLandscapeMobile ? 'text-2xl' : 'text-4xl')}>Trip Progression Active</h2>
              </div>
            </div>
            <div className={cn('grid gap-3', isLandscapeMobile ? 'grid-cols-2' : 'grid-cols-4')}>
              <div className="rounded-[1.4rem] border px-3 py-3" style={{ borderColor: `${activeTripCosmetic?.glow}44`, background: activeTripCosmetic?.plate }}>
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground"><Route className="h-3.5 w-3.5" /> Distance</div>
                <div className={cn('mt-2 text-2xl font-black tabular-nums', valueClassName)}>{totalDistanceKm.toFixed(1)} km</div>
              </div>
              <div className="rounded-[1.4rem] border px-3 py-3" style={{ borderColor: `${activeTripCosmetic?.glow}44`, background: activeTripCosmetic?.plate }}>
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground"><GaugeCircle className="h-3.5 w-3.5" /> Sessions</div>
                <div className={cn('mt-2 text-2xl font-black tabular-nums', valueClassName)}>{trips.length}</div>
              </div>
              <div className="rounded-[1.4rem] border px-3 py-3" style={{ borderColor: `${activeTripCosmetic?.glow}44`, background: activeTripCosmetic?.plate }}>
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground"><Award className="h-3.5 w-3.5" /> Wheel Time</div>
                <div className={cn('mt-2 text-2xl font-black tabular-nums', valueClassName)}>{totalDurationMin} min</div>
              </div>
              <div className="rounded-[1.4rem] border px-3 py-3" style={{ borderColor: `${activeTripCosmetic?.glow}44`, background: activeTripCosmetic?.plate }}>
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground"><Flame className="h-3.5 w-3.5" /> Streak</div>
                <div className={cn('mt-2 text-2xl font-black tabular-nums', valueClassName)}>{tripInsights.drivingStreakDays} day</div>
              </div>
            </div>
          </div>
        </section>

        {trips.length > 0 && (
          <section className={cn('grid', isLandscapeMobile ? 'grid-cols-1 gap-3' : 'grid-cols-12 gap-4')}>
            <div className={cn('relative overflow-hidden rounded-[1.8rem] border p-4', shellClassName, isLandscapeMobile ? 'col-span-1' : 'col-span-7')}>
              <div className="absolute inset-0 opacity-60" style={{ background: activeTripCosmetic?.surface }} />
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Session comparison</div>
                    <div className={cn('mt-1 font-black tracking-tight', valueClassName, isLandscapeMobile ? 'text-xl' : 'text-3xl')}>
                      {tripInsights.comparison ? 'Latest drive vs previous' : 'Keep driving to unlock comparison'}
                    </div>
                  </div>
                  <TrendingUp className={cn(isLandscapeMobile ? 'h-5 w-5' : 'h-7 w-7')} />
                </div>
                {tripInsights.comparison ? (
                  <div className={cn('mt-4 grid', isLandscapeMobile ? 'grid-cols-2 gap-2' : 'grid-cols-3 gap-3')}>
                    <div className="rounded-[1.2rem] border px-3 py-3" style={{ borderColor: `${activeTripCosmetic?.glow}44`, background: activeTripCosmetic?.plate }}>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Distance delta</div>
                      <div className={cn('mt-1 font-black tabular-nums', valueClassName)}>{tripInsights.comparison.distanceDeltaKm >= 0 ? '+' : ''}{tripInsights.comparison.distanceDeltaKm.toFixed(2)} km</div>
                    </div>
                    <div className="rounded-[1.2rem] border px-3 py-3" style={{ borderColor: `${activeTripCosmetic?.glow}44`, background: activeTripCosmetic?.plate }}>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Duration delta</div>
                      <div className={cn('mt-1 font-black tabular-nums', valueClassName)}>{tripInsights.comparison.durationDeltaMin >= 0 ? '+' : ''}{tripInsights.comparison.durationDeltaMin} min</div>
                    </div>
                    <div className="rounded-[1.2rem] border px-3 py-3" style={{ borderColor: `${activeTripCosmetic?.glow}44`, background: activeTripCosmetic?.plate }}>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Avg speed delta</div>
                      <div className={cn('mt-1 font-black tabular-nums', valueClassName)}>{tripInsights.comparison.averageSpeedDeltaKph >= 0 ? '+' : ''}{tripInsights.comparison.averageSpeedDeltaKph.toFixed(1)} kph</div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Once you have at least two completed trips, VelocityOS compares the latest session against the one before it.</p>
                )}
              </div>
            </div>
            <div className={cn('relative overflow-hidden rounded-[1.8rem] border p-4', shellClassName, isLandscapeMobile ? 'col-span-1' : 'col-span-5')}>
              <div className="absolute inset-0 opacity-60" style={{ background: activeTripCosmetic?.surface }} />
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Route memory</div>
                    <div className={cn('mt-1 font-black tracking-tight', valueClassName, isLandscapeMobile ? 'text-xl' : 'text-3xl')}>
                      {tripInsights.favoriteDestination ? tripInsights.favoriteDestination.label : 'No favorite destination yet'}
                    </div>
                  </div>
                  <MapPinned className={cn(isLandscapeMobile ? 'h-5 w-5' : 'h-7 w-7')} />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {tripInsights.favoriteDestination ? `${tripInsights.favoriteDestination.count} sessions routed here` : 'Destination labels will appear once trips start with active navigation'}
                  </div>
                  {tripInsights.recentRouteMemory.length > 0 ? tripInsights.recentRouteMemory.map((memory) => (
                    <div key={memory.label} className="rounded-[1.1rem] border px-3 py-2" style={{ borderColor: `${activeTripCosmetic?.glow}44`, background: activeTripCosmetic?.plate }}>
                      <div className="font-semibold truncate">{memory.label}</div>
                    </div>
                  )) : (
                    <div className="rounded-[1.1rem] border px-3 py-3 text-sm text-muted-foreground" style={{ borderColor: `${activeTripCosmetic?.glow}44`, background: activeTripCosmetic?.plate }}>
                      Route memory will fill in as you start trips with a destination selected.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {trips.length === 0 ? (
          <SystemStatePanel
            kind="empty"
            eyebrow="Trip memory"
            title="No trips recorded yet"
            message="A trip is created once motion starts. Save a destination, start driving, and VelocityOS will begin logging sessions automatically."
            primaryAction={{ label: 'Open Navigation', onClick: () => navigate('/navigation') }}
            className={cn(shellClassName, 'border')}
            compact={isLandscapeMobile}
          />
        ) : (
          <ul className={cn('grid', isLandscapeMobile ? 'grid-cols-1 gap-2' : 'grid-cols-1 md:grid-cols-2 gap-4')}>
            {trips
              .slice()
              .reverse()
              .map((trip, i) => {
                const durationMs = trip.endTime ? trip.endTime - trip.startTime : Date.now() - trip.startTime;
                const durationMin = Math.max(0, Math.round(durationMs / 60000));
                const tripRank = getTripRank(trip.distanceKm || 0, durationMin);

                return (
                  <li key={`${trip.startTime}-${i}`} className={cn('relative overflow-hidden rounded-[1.8rem] border p-4', shellClassName)}>
                    <div className="absolute inset-0 opacity-60" style={{ background: activeTripCosmetic?.surface }} />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{activeTripCosmetic?.badgeLabel}</div>
                          <div className={cn('mt-1 text-xl font-black', valueClassName)}>Trip {trips.length - i}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{trip.destinationLabel ?? 'Open-road session'}</div>
                        </div>
                        <span
                          className="rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em]"
                          style={{ borderColor: `${activeTripCosmetic?.glow}55`, color: activeTripCosmetic?.glow, background: 'rgba(8,12,18,0.36)' }}
                        >
                          {tripRank}
                        </span>
                      </div>
                      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                        <div>Start: {new Date(trip.startTime).toLocaleString()}</div>
                        <div>End: {trip.endTime ? new Date(trip.endTime).toLocaleString() : 'Ongoing'}</div>
                      </div>
                      <div className={cn('mt-4 grid gap-3', isLandscapeMobile ? 'grid-cols-2' : 'grid-cols-3')}>
                        <div className="rounded-[1.2rem] border px-3 py-2" style={{ borderColor: `${activeTripCosmetic?.glow}44`, background: activeTripCosmetic?.plate }}>
                          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Distance</div>
                          <div className={cn('mt-1 text-lg font-black tabular-nums', valueClassName)}>{(trip.distanceKm || 0).toFixed(2)} km</div>
                        </div>
                        <div className="rounded-[1.2rem] border px-3 py-2" style={{ borderColor: `${activeTripCosmetic?.glow}44`, background: activeTripCosmetic?.plate }}>
                          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Duration</div>
                          <div className={cn('mt-1 text-lg font-black tabular-nums', valueClassName)}>{durationMin} min</div>
                        </div>
                        <div className="rounded-[1.2rem] border px-3 py-2" style={{ borderColor: `${activeTripCosmetic?.glow}44`, background: activeTripCosmetic?.plate }}>
                          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Avg speed</div>
                          <div className={cn('mt-1 text-lg font-black tabular-nums', valueClassName)}>{Math.round(trip.averageSpeedKph ?? 0)} kph</div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        <span>{activeTripCosmetic?.frameLabel}</span>
                        <span>Peak {Math.round(trip.maxSpeedKph ?? 0)} kph</span>
                      </div>
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    </CarLayout>
  );
}
