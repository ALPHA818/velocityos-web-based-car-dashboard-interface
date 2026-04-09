import type { SavedLocation } from '@shared/types';

export type GpsPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';
export type NavigationFailureKind = 'gps-permission' | 'weak-signal' | 'route-fetch' | 'offline';
export type NavigationRouteState = 'idle' | 'loading' | 'ready' | 'fallback';
export type GpsSignalState = 'blocked' | 'weak' | 'strong';

export interface NavigationAlert {
  tone: 'info' | 'success' | 'warning' | 'destructive';
  title: string;
  detail: string;
  compactLabel: string;
  actionHint?: 'settings' | 'navigation';
}

interface NavigationAlertInput {
  gpsStatus: GpsPermissionState;
  routeState: NavigationRouteState;
  routeFailureKind: NavigationFailureKind | null;
  routeFailureMessage: string | null;
  lastGpsFixAt: number | null;
  activeDestination: SavedLocation | null;
  activeRoute: { distance: number; duration: number } | null;
  now?: number;
}

const WEAK_SIGNAL_MS = 9000;

export function getGpsSignalState(gpsStatus: GpsPermissionState, lastGpsFixAt: number | null, now = Date.now()): GpsSignalState {
  if (gpsStatus !== 'granted') {
    return 'blocked';
  }

  if (!lastGpsFixAt) {
    return 'weak';
  }

  return now - lastGpsFixAt > WEAK_SIGNAL_MS ? 'weak' : 'strong';
}

export function formatRouteDistance(distanceMeters: number | null | undefined) {
  if (!distanceMeters || !Number.isFinite(distanceMeters)) {
    return '--';
  }

  return `${(distanceMeters / 1000).toFixed(distanceMeters >= 10000 ? 0 : 1)} km`;
}

export function formatRouteMinutes(durationSeconds: number | null | undefined) {
  if (!durationSeconds || !Number.isFinite(durationSeconds)) {
    return '--';
  }

  return `${Math.max(1, Math.round(durationSeconds / 60))} min`;
}

export function getNavigationAlert({
  gpsStatus,
  routeState,
  routeFailureKind,
  routeFailureMessage,
  lastGpsFixAt,
  activeDestination,
  activeRoute,
  now,
}: NavigationAlertInput): NavigationAlert | null {
  const hasDestination = Boolean(activeDestination);
  if (!hasDestination && routeState === 'idle') {
    return null;
  }

  const gpsSignal = getGpsSignalState(gpsStatus, lastGpsFixAt, now);

  if (gpsStatus === 'denied' || gpsStatus === 'unsupported') {
    return {
      tone: 'destructive',
      title: 'Location access blocked',
      detail: routeFailureMessage ?? 'Enable GPS permission to calculate live routes while driving.',
      compactLabel: 'GPS blocked',
      actionHint: 'settings',
    };
  }

  if (routeFailureKind === 'offline') {
    return {
      tone: 'warning',
      title: 'Offline fallback active',
      detail: routeFailureMessage ?? 'The destination pin stays visible, but turn-by-turn routing is paused until the network returns.',
      compactLabel: 'Offline fallback',
      actionHint: 'navigation',
    };
  }

  if (routeFailureKind === 'route-fetch') {
    return {
      tone: 'warning',
      title: 'Route fetch failed',
      detail: routeFailureMessage ?? 'VelocityOS is holding on the destination only. Retry after the routing service recovers.',
      compactLabel: 'Route failed',
      actionHint: 'navigation',
    };
  }

  if (hasDestination && gpsSignal === 'weak') {
    return {
      tone: 'warning',
      title: 'GPS signal weak',
      detail: routeFailureMessage ?? 'Map position may drift until the next solid GPS fix. VelocityOS will refresh routing automatically.',
      compactLabel: 'Weak signal',
      actionHint: 'navigation',
    };
  }

  if (routeState === 'loading' && hasDestination) {
    return {
      tone: 'info',
      title: 'Updating route',
      detail: 'Fetching the latest path and ETA for your destination.',
      compactLabel: 'Routing',
      actionHint: 'navigation',
    };
  }

  if (routeState === 'ready' && activeRoute && activeDestination) {
    return {
      tone: 'success',
      title: `Route locked to ${activeDestination.label}`,
      detail: `${formatRouteDistance(activeRoute.distance)} remaining with an ETA of ${formatRouteMinutes(activeRoute.duration)}.`,
      compactLabel: 'Route ready',
      actionHint: 'navigation',
    };
  }

  if (hasDestination) {
    return {
      tone: 'info',
      title: `Destination pinned${activeDestination ? `: ${activeDestination.label}` : ''}`,
      detail: 'VelocityOS is holding the destination marker while route guidance catches up.',
      compactLabel: 'Destination only',
      actionHint: 'navigation',
    };
  }

  return null;
}