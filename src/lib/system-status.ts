import type { NetworkStatus } from '@/hooks/use-network-status';
import {
  INTEGRATED_APP_IDS,
  type AppIntegrationState,
  type IntegratedAppId,
} from '@/lib/app-integrations';
import {
  summarizeNativeMonitorStatus,
  type NativeMonitorConfig,
  type NativeMonitorStatusSummary,
} from '@/lib/native-monitor';
import type { TelemetrySnapshot } from '@/lib/telemetry';
import type { GpsStatus } from '@/store/use-os-store';

export type StatusTone = 'healthy' | 'warning' | 'critical' | 'inactive';

export interface SystemStatusItem {
  id: 'gps' | 'connectivity' | 'mic' | 'share' | 'integrations' | 'native';
  label: string;
  value: string;
  detail: string;
  tone: StatusTone;
}

export interface SystemStatusSnapshot {
  tone: StatusTone;
  title: string;
  detail: string;
  items: SystemStatusItem[];
  diagnostics: {
    connectedIntegrations: number;
    totalIntegrations: number;
    errorCount: number;
    warningCount: number;
    averageColdStartMs: number | null;
    lastSlowScreenLabel: string | null;
    nativeMonitor: NativeMonitorStatusSummary;
  };
}

interface SystemStatusInput {
  gpsStatus: GpsStatus;
  network: NetworkStatus;
  micEnabled: boolean;
  isSharingLive: boolean;
  trackingId: string | null;
  integrations: Partial<Record<IntegratedAppId, AppIntegrationState>>;
  telemetry: TelemetrySnapshot;
  nativeMonitorConfig?: NativeMonitorConfig | null;
}

const tonePriority: Record<StatusTone, number> = {
  healthy: 0,
  inactive: 1,
  warning: 2,
  critical: 3,
};

function selectWorstTone(tones: StatusTone[]) {
  return tones.reduce<StatusTone>((worst, tone) => (tonePriority[tone] > tonePriority[worst] ? tone : worst), 'healthy');
}

function getGpsItem(gpsStatus: GpsStatus): SystemStatusItem {
  if (gpsStatus === 'granted') {
    return { id: 'gps', label: 'GPS', value: 'Locked', detail: 'Live position updates are streaming.', tone: 'healthy' };
  }

  if (gpsStatus === 'denied') {
    return { id: 'gps', label: 'GPS', value: 'Permission denied', detail: 'Turn on location access before driving.', tone: 'critical' };
  }

  if (gpsStatus === 'unsupported') {
    return { id: 'gps', label: 'GPS', value: 'Unavailable', detail: 'This platform cannot provide geolocation.', tone: 'critical' };
  }

  return { id: 'gps', label: 'GPS', value: 'Searching', detail: 'Waiting for a confident location fix.', tone: 'warning' };
}

function getConnectivityItem(network: NetworkStatus): SystemStatusItem {
  if (!network.isOnline) {
    return {
      id: 'connectivity',
      label: 'Connectivity',
      value: 'Offline',
      detail: 'Cloud lookups and live integrations are disconnected.',
      tone: 'critical',
    };
  }

  if (network.effectiveType === '2g' || network.effectiveType === 'slow-2g') {
    return {
      id: 'connectivity',
      label: 'Connectivity',
      value: 'Constrained',
      detail: 'Online with reduced bandwidth for search and preview windows.',
      tone: 'warning',
    };
  }

  return {
    id: 'connectivity',
    label: 'Connectivity',
    value: network.effectiveType?.toUpperCase() ?? 'Online',
    detail: 'Search, sync, and media integrations are reachable.',
    tone: 'healthy',
  };
}

function getMicItem(micEnabled: boolean): SystemStatusItem {
  return micEnabled
    ? { id: 'mic', label: 'Voice control', value: 'Listening', detail: 'Wake-word navigation is armed.', tone: 'healthy' }
    : { id: 'mic', label: 'Voice control', value: 'Muted', detail: 'Turn voice control on to use hands-free commands.', tone: 'inactive' };
}

function getShareItem(isSharingLive: boolean, trackingId: string | null): SystemStatusItem {
  return isSharingLive && trackingId
    ? { id: 'share', label: 'Live share', value: 'Broadcasting', detail: 'Tracking beacon is active for this drive.', tone: 'healthy' }
    : { id: 'share', label: 'Live share', value: 'Standby', detail: 'No active live-share session is running.', tone: 'inactive' };
}

function getIntegrationItem(integrations: Partial<Record<IntegratedAppId, AppIntegrationState>>): {
  item: SystemStatusItem;
  connectedCount: number;
  totalCount: number;
} {
  const totalCount = INTEGRATED_APP_IDS.length;
  const connectedCount = INTEGRATED_APP_IDS.filter((appId) => Boolean(integrations[appId]?.connected)).length;

  if (connectedCount === 0) {
    return {
      connectedCount,
      totalCount,
      item: {
        id: 'integrations',
        label: 'Integrations',
        value: '0 ready',
        detail: 'Link phone, messaging, and music apps for one-tap launch.',
        tone: 'warning',
      },
    };
  }

  if (connectedCount === totalCount) {
    return {
      connectedCount,
      totalCount,
      item: {
        id: 'integrations',
        label: 'Integrations',
        value: `${connectedCount}/${totalCount}`,
        detail: 'Every built-in integration has a working launch path.',
        tone: 'healthy',
      },
    };
  }

  return {
    connectedCount,
    totalCount,
    item: {
      id: 'integrations',
      label: 'Integrations',
      value: `${connectedCount}/${totalCount}`,
      detail: 'Some launch targets are ready, but a few still need setup.',
      tone: 'warning',
    },
  };
}

function getSummaryTitle(tone: StatusTone) {
  switch (tone) {
    case 'critical':
      return 'Driver attention recommended';
    case 'warning':
      return 'System health needs a tune-up';
    case 'inactive':
      return 'Standby systems available';
    default:
      return 'System health looks stable';
  }
}

export function buildSystemStatusSnapshot(input: SystemStatusInput): SystemStatusSnapshot {
  const gpsItem = getGpsItem(input.gpsStatus);
  const connectivityItem = getConnectivityItem(input.network);
  const micItem = getMicItem(input.micEnabled);
  const shareItem = getShareItem(input.isSharingLive, input.trackingId);
  const integrationSummary = getIntegrationItem(input.integrations);
  const nativeMonitor = summarizeNativeMonitorStatus(input.nativeMonitorConfig ?? null);

  const items: SystemStatusItem[] = [
    gpsItem,
    connectivityItem,
    micItem,
    shareItem,
    integrationSummary.item,
    {
      id: 'native',
      label: 'Native monitor',
      value: nativeMonitor.label,
      detail: nativeMonitor.detail,
      tone: nativeMonitor.tone,
    },
  ];

  const tone = selectWorstTone(items.map((item) => item.tone));
  const detailParts = [
    gpsItem.detail,
    connectivityItem.detail,
    integrationSummary.item.detail,
  ];

  return {
    tone,
    title: getSummaryTitle(tone),
    detail: detailParts.find(Boolean) ?? 'Runtime services are ready.',
    items,
    diagnostics: {
      connectedIntegrations: integrationSummary.connectedCount,
      totalIntegrations: integrationSummary.totalCount,
      errorCount: input.telemetry.errorCount,
      warningCount: input.telemetry.warningCount,
      averageColdStartMs: input.telemetry.averageColdStartMs,
      lastSlowScreenLabel: input.telemetry.lastSlowScreen?.route ?? null,
      nativeMonitor,
    },
  };
}