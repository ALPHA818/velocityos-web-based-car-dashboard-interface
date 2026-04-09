import React, { useEffect } from 'react';
import { CarLayout } from '@/components/layout/CarLayout';
import { Speedometer } from '@/components/drive/Speedometer';
import { WeatherWidget } from '@/components/drive/WeatherWidget';
import { MiniPlayer } from '@/components/drive/MiniPlayer';
import { Toaster } from '@/components/ui/sonner';
import { motion } from 'framer-motion';
import { useOSStore } from '@/store/use-os-store';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsLandscapeMobile } from '@/hooks/use-landscape-mobile';
import { AlertTriangle, ArrowUpRight, Compass, MapPin } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { formatRouteDistance, formatRouteMinutes, getNavigationAlert } from '@/lib/navigation-status';
import { useNavigationStatusState, useParkedDemoState } from '@/store/os-domain-hooks';
export function HomePage() {
  const navigate = useNavigate();
  const fetchSettings = useOSStore((s) => s.fetchSettings);
  const fetchLocations = useOSStore((s) => s.fetchLocations);
  const hasLocations = useOSStore((s) => s.locations.length > 0);
  const totalDistanceKm = useOSStore((s) => s.totalDistanceKm);
  const tripCount = useOSStore((s) => s.trips.length);
  const { parkedDemoStatus, isParkedDemoOpen, openParkedDemo } = useParkedDemoState();
  const {
    gpsStatus,
    currentSpeed,
    activeDestination,
    activeRoute,
    routeState,
    routeFailureKind,
    routeFailureMessage,
    lastGpsFixAt,
  } = useNavigationStatusState();
  const isLandscapeMobile = useIsLandscapeMobile();
  const network = useNetworkStatus({ offlineGraceMs: 3000 });
  const isParked = !currentSpeed || currentSpeed < 0.8;
  const navigationAlert = getNavigationAlert({
    gpsStatus,
    routeState,
    routeFailureKind,
    routeFailureMessage,
    lastGpsFixAt,
    activeDestination,
    activeRoute,
  });

  const attentionCardClassName = navigationAlert?.tone === 'destructive'
    ? 'border-rose-400/35 bg-rose-500/15 text-rose-50'
    : navigationAlert?.tone === 'warning'
      ? 'border-amber-400/35 bg-amber-500/15 text-amber-50'
      : !network.isOnline
        ? 'border-amber-400/35 bg-amber-500/12 text-amber-50'
        : 'border-emerald-400/25 bg-emerald-500/10 text-emerald-50';

  useEffect(() => {
    fetchSettings();
    if (!hasLocations) {
      fetchLocations();
    }
  }, [fetchSettings, fetchLocations, hasLocations]);

  useEffect(() => {
    if (isParked && parkedDemoStatus === 'pending' && !isParkedDemoOpen) {
      openParkedDemo();
    }
  }, [isParked, parkedDemoStatus, isParkedDemoOpen, openParkedDemo]);

  return (
    <CarLayout>
      <div className={cn(
        'h-auto md:h-full grid md:grid-cols-12',
        isLandscapeMobile
          ? 'grid-cols-1 auto-rows-[minmax(96px,auto)] gap-1.5'
          : 'grid-cols-1 auto-rows-[minmax(140px,auto)] gap-3 sm:gap-4 md:gap-6'
      )}>
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'dashboard-card relative overflow-hidden border md:col-span-12',
            isLandscapeMobile ? 'p-3 rounded-[1.6rem]' : 'p-5 md:p-6 rounded-[2rem]'
          )}
        >
          <div className="absolute inset-0 opacity-80" style={{ background: navigationAlert?.tone === 'destructive' ? 'linear-gradient(145deg, rgba(127,29,29,0.32), rgba(15,23,42,0.92))' : 'linear-gradient(145deg, rgba(30,64,175,0.22), rgba(15,23,42,0.9))' }} />
          <div className={cn('relative z-10 flex gap-4', isLandscapeMobile ? 'flex-col' : 'items-end justify-between')}>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]">
                  {navigationAlert?.compactLabel ?? (activeDestination ? 'Route ready' : 'Navigation idle')}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]">
                  {network.isOnline ? 'Network online' : 'Network offline'}
                </span>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">Where you're going</div>
                <h1 className={cn('mt-2 font-black tracking-tight', isLandscapeMobile ? 'text-2xl' : 'text-5xl')}>
                  {activeDestination?.label ?? 'Choose the next stop before you pull away'}
                </h1>
                <p className={cn('mt-2 max-w-3xl text-white/75', isLandscapeMobile ? 'text-[11px]' : 'text-sm')}>
                  {navigationAlert?.detail ?? 'Open Navigation to search globally, save places, or resume a route.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/navigation')}
                  className={cn('inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/15', isLandscapeMobile ? 'px-3 py-2 text-[10px]' : 'px-4 py-3 text-[11px]')}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {activeDestination ? 'Resume navigation' : 'Open navigation'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/trips')}
                  className={cn('inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-black/30', isLandscapeMobile ? 'px-3 py-2 text-[10px]' : 'px-4 py-3 text-[11px]')}
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Trip insights
                </button>
                <button
                  type="button"
                  onClick={openParkedDemo}
                  className={cn('inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-black/30', isLandscapeMobile ? 'px-3 py-2 text-[10px]' : 'px-4 py-3 text-[11px]')}
                >
                  <Compass className="h-3.5 w-3.5" />
                  {parkedDemoStatus === 'completed' ? 'Replay parked demo' : 'Parked demo'}
                </button>
              </div>
            </div>
            <div className={cn('grid gap-3', isLandscapeMobile ? 'grid-cols-2' : 'grid-cols-2 min-w-[18rem]')}>
              <div className="rounded-[1.35rem] border border-white/10 bg-black/20 px-3 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">Route</div>
                <div className={cn('mt-2 font-black tabular-nums', isLandscapeMobile ? 'text-lg' : 'text-2xl')}>{formatRouteDistance(activeRoute?.distance)}</div>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-black/20 px-3 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">ETA</div>
                <div className={cn('mt-2 font-black tabular-nums', isLandscapeMobile ? 'text-lg' : 'text-2xl')}>{formatRouteMinutes(activeRoute?.duration)}</div>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-black/20 px-3 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">Trips logged</div>
                <div className={cn('mt-2 font-black tabular-nums', isLandscapeMobile ? 'text-lg' : 'text-2xl')}>{tripCount}</div>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-black/20 px-3 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">Lifetime distance</div>
                <div className={cn('mt-2 font-black tabular-nums', isLandscapeMobile ? 'text-lg' : 'text-2xl')}>{totalDistanceKm.toFixed(totalDistanceKm >= 100 ? 0 : 1)} km</div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'col-span-1 min-h-[120px] sm:min-h-[140px] md:col-span-7 dashboard-card flex items-center justify-center relative overflow-hidden',
            isLandscapeMobile && 'min-h-[92px]'
          )}
        >
          <Speedometer />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          className={cn(
            'col-span-1 min-h-[120px] sm:min-h-[140px] md:col-span-5 dashboard-card',
            isLandscapeMobile && 'min-h-[92px]'
          )}
        >
          <MiniPlayer />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          className={cn(
            'col-span-1 min-h-[120px] sm:min-h-[140px] md:col-span-7 dashboard-card cursor-pointer border',
            attentionCardClassName,
            isLandscapeMobile && 'min-h-[92px]'
          )}
          onClick={() => navigate(navigationAlert?.actionHint === 'settings' ? '/settings' : '/navigation')}
        >
          <div className="flex h-full flex-col justify-between gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">Needs attention</div>
                <div className={cn('mt-2 font-black tracking-tight', isLandscapeMobile ? 'text-lg' : 'text-3xl')}>
                  {navigationAlert?.title ?? (!network.isOnline ? 'Network is offline' : 'Core driving systems look healthy')}
                </div>
                <div className={cn('mt-2 text-white/75', isLandscapeMobile ? 'text-[11px]' : 'text-sm')}>
                  {navigationAlert?.detail ?? (!network.isOnline ? 'Live routing and connected search stay in fallback until the network returns.' : 'Navigation, playback, and telemetry are all ready for the drive.')}
                </div>
              </div>
              <AlertTriangle className={cn(isLandscapeMobile ? 'h-5 w-5' : 'h-7 w-7')} />
            </div>
            <div className={cn('grid', isLandscapeMobile ? 'grid-cols-3 gap-2' : 'grid-cols-3 gap-3')}>
              <div className="rounded-[1.2rem] border border-white/10 bg-black/20 px-3 py-3">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">GPS</div>
                <div className="mt-1 font-black uppercase">{gpsStatus}</div>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-black/20 px-3 py-3">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">Network</div>
                <div className="mt-1 font-black uppercase">{network.isOnline ? 'online' : 'offline'}</div>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-black/20 px-3 py-3">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">Route</div>
                <div className="mt-1 font-black uppercase">{navigationAlert?.compactLabel ?? (activeDestination ? 'ready' : 'idle')}</div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          className={cn(
            'col-span-1 min-h-[120px] sm:min-h-[140px] md:col-span-5 dashboard-card',
            isLandscapeMobile && 'min-h-[92px]'
          )}
        >
          <WeatherWidget />
        </motion.div>
      </div>
      <Toaster theme="dark" richColors position="top-center" />
    </CarLayout>
  );
}