import React from 'react';
import {
  Activity,
  AlertTriangle,
  Gauge,
  MapPin,
  Mic,
  PlugZap,
  Radio,
  Share2,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

import {
  INTEGRATED_APP_IDS,
  loadAppIntegrationState,
  type AppIntegrationState,
  type IntegratedAppId,
} from '@/lib/app-integrations';
import { buildSystemStatusSnapshot, type StatusTone, type SystemStatusItem } from '@/lib/system-status';
import {
  clearTelemetryEvents,
  getTelemetrySnapshot,
  subscribeToTelemetryUpdates,
  type TelemetryEvent,
  type TelemetrySnapshot,
} from '@/lib/telemetry';
import { cn } from '@/lib/utils';
import type { NetworkStatus } from '@/hooks/use-network-status';
import type { NativeMonitorConfig } from '@/lib/native-monitor';
import type { GpsStatus } from '@/store/use-os-store';

interface SystemStatusHubProps {
  gpsStatus: GpsStatus;
  network: NetworkStatus;
  micEnabled: boolean;
  isSharingLive: boolean;
  trackingId: string | null;
  nativeMonitorConfig?: NativeMonitorConfig | null;
  variant?: 'strip' | 'hub';
  className?: string;
  isLandscapeMobile?: boolean;
}

const ITEM_ICONS: Record<SystemStatusItem['id'], LucideIcon> = {
  gps: MapPin,
  connectivity: Radio,
  mic: Mic,
  share: Share2,
  integrations: PlugZap,
  native: ShieldCheck,
};

const TONE_STYLES: Record<StatusTone, string> = {
  healthy: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-100',
  warning: 'border-amber-400/35 bg-amber-500/10 text-amber-100',
  critical: 'border-destructive/35 bg-destructive/10 text-rose-100',
  inactive: 'border-white/10 bg-white/5 text-muted-foreground',
};

function readIntegrationSnapshot() {
  const loaded = loadAppIntegrationState();
  return INTEGRATED_APP_IDS.reduce((acc, appId) => {
    acc[appId] = loaded[appId];
    return acc;
  }, {} as Record<IntegratedAppId, AppIntegrationState>);
}

function formatEventLabel(event: TelemetryEvent) {
  const timestamp = new Date(event.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${timestamp} • ${event.message}`;
}

export function SystemStatusHub({
  gpsStatus,
  network,
  micEnabled,
  isSharingLive,
  trackingId,
  nativeMonitorConfig = null,
  variant = 'hub',
  className,
  isLandscapeMobile = false,
}: SystemStatusHubProps) {
  const [integrations, setIntegrations] = React.useState<Record<IntegratedAppId, AppIntegrationState>>(() => readIntegrationSnapshot());
  const [telemetry, setTelemetry] = React.useState<TelemetrySnapshot>(() => getTelemetrySnapshot());

  React.useEffect(() => {
    const refreshIntegrations = () => setIntegrations(readIntegrationSnapshot());
    const refreshTelemetry = () => setTelemetry(getTelemetrySnapshot());

    const unsubscribeTelemetry = subscribeToTelemetryUpdates(refreshTelemetry);
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshIntegrations();
        refreshTelemetry();
      }
    };

    refreshIntegrations();
    refreshTelemetry();
    window.addEventListener('storage', refreshIntegrations);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribeTelemetry();
      window.removeEventListener('storage', refreshIntegrations);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const snapshot = React.useMemo(
    () => buildSystemStatusSnapshot({
      gpsStatus,
      network,
      micEnabled,
      isSharingLive,
      trackingId,
      integrations,
      telemetry,
      nativeMonitorConfig,
    }),
    [gpsStatus, network, micEnabled, isSharingLive, trackingId, integrations, telemetry, nativeMonitorConfig]
  );

  if (variant === 'strip') {
    return (
      <section className={cn('dashboard-card border py-3', className)}>
        <div className={cn('flex flex-wrap items-center gap-2', isLandscapeMobile ? 'justify-start' : 'justify-between')}>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground">System strip</div>
            <div className="text-sm font-black">{snapshot.title}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {snapshot.items.slice(0, 5).map((item) => {
              const Icon = ITEM_ICONS[item.id];
              return (
                <div key={item.id} className={cn('flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em]', TONE_STYLES[item.tone])}>
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                  <span className="opacity-80">{item.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn('dashboard-card space-y-5', className)}>
      <div className={cn('flex items-start justify-between gap-4', isLandscapeMobile && 'flex-col')}>
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground">Unified health hub</div>
          <h2 className={cn('mt-2 font-black tracking-tight', isLandscapeMobile ? 'text-lg' : 'text-3xl')}>{snapshot.title}</h2>
          <p className={cn('mt-2 text-muted-foreground', isLandscapeMobile ? 'text-xs' : 'text-sm')}>{snapshot.detail}</p>
        </div>
        <button
          type="button"
          onClick={clearTelemetryEvents}
          className={cn('rounded-full border border-white/15 bg-white/5 font-black uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-white', isLandscapeMobile ? 'px-3 py-2 text-[10px]' : 'px-4 py-2 text-[11px]')}
        >
          Clear diagnostics
        </button>
      </div>

      <div className={cn('grid', isLandscapeMobile ? 'grid-cols-1 gap-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4')}>
        {snapshot.items.map((item) => {
          const Icon = ITEM_ICONS[item.id];
          return (
            <div key={item.id} className={cn('rounded-[1.8rem] border p-4', TONE_STYLES[item.tone])}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] opacity-80">{item.label}</div>
                  <div className={cn('mt-2 font-black tracking-tight', isLandscapeMobile ? 'text-base' : 'text-xl')}>{item.value}</div>
                </div>
                <Icon className={cn(isLandscapeMobile ? 'h-5 w-5' : 'h-6 w-6')} />
              </div>
              <p className={cn('mt-3 opacity-80', isLandscapeMobile ? 'text-[11px]' : 'text-sm')}>{item.detail}</p>
            </div>
          );
        })}
      </div>

      <div className={cn('grid', isLandscapeMobile ? 'grid-cols-2 gap-2' : 'grid-cols-4 gap-3')}>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Errors</div>
          <div className="mt-2 text-2xl font-black tabular-nums">{snapshot.diagnostics.errorCount}</div>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Warnings</div>
          <div className="mt-2 text-2xl font-black tabular-nums">{snapshot.diagnostics.warningCount}</div>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Cold start</div>
          <div className="mt-2 text-2xl font-black tabular-nums">{snapshot.diagnostics.averageColdStartMs ? `${snapshot.diagnostics.averageColdStartMs}ms` : 'N/A'}</div>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Slow screen</div>
          <div className="mt-2 text-sm font-black uppercase tracking-[0.16em]">{snapshot.diagnostics.lastSlowScreenLabel ?? 'None logged'}</div>
        </div>
      </div>

      <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
          <Gauge className="h-4 w-4" />
          Recent diagnostics
        </div>
        <div className="mt-4 space-y-2">
          {telemetry.recentFailures.length > 0 ? (
            telemetry.recentFailures.map((event) => (
              <div key={event.id} className="flex items-start gap-3 rounded-[1.2rem] border border-white/10 bg-black/20 px-3 py-2">
                <AlertTriangle className={cn('mt-0.5 h-4 w-4 shrink-0', event.level === 'error' ? 'text-destructive' : 'text-amber-300')} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{event.message}</div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{formatEventLabel(event)}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[1.2rem] border border-white/10 bg-black/20 px-3 py-3 text-sm text-muted-foreground">
              No failures logged in this session window.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}