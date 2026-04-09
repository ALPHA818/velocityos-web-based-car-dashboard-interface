import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { isEmbeddedWebViewAvailable, openEmbeddedWebView } from '@/lib/embedded-web-view';
import { recordTelemetryEvent } from '@/lib/telemetry';

export const APP_INTEGRATION_STORAGE_KEY = 'velocityos_app_integrations_v2';

export const INTEGRATED_APP_IDS = ['phone', 'whatsapp', 'spotify', 'youtubeMusic'] as const;
export const MUSIC_INTEGRATION_IDS = ['spotify', 'youtubeMusic'] as const;

export type IntegratedAppId = (typeof INTEGRATED_APP_IDS)[number];
export type IntegratedMusicSourceId = (typeof MUSIC_INTEGRATION_IDS)[number];
export type InsideAppPresentation = 'preview' | 'fullscreen';

export interface AppIntegrationPreset {
  launchUrl: string;
  webUrl: string;
  supportsEmbed: boolean;
  autoConnect: boolean;
  helperText: string;
}

export interface AppIntegrationState extends AppIntegrationPreset {
  connected: boolean;
  embedInPanel: boolean;
  lastConnectedAt: number | null;
}

export const APP_INTEGRATION_TITLES: Record<IntegratedAppId, string> = {
  phone: 'Phone',
  whatsapp: 'WhatsApp',
  spotify: 'Spotify',
  youtubeMusic: 'YouTube Music',
};

export const INTEGRATION_PRESETS: Record<IntegratedAppId, AppIntegrationPreset> = {
  phone: {
    launchUrl: 'tel:',
    webUrl: '',
    supportsEmbed: false,
    autoConnect: false,
    helperText: 'Opens your default phone dialer using tel: links.',
  },
  whatsapp: {
    launchUrl: 'whatsapp://',
    webUrl: 'https://web.whatsapp.com/',
    supportsEmbed: true,
    autoConnect: true,
    helperText: 'Open WhatsApp in a preview window inside VelocityOS, expand it to full screen, or launch native WhatsApp.',
  },
  spotify: {
    launchUrl: 'spotify:',
    webUrl: 'https://open.spotify.com/',
    supportsEmbed: true,
    autoConnect: true,
    helperText: 'Open Spotify in a preview window inside VelocityOS, expand it to full screen, or launch native Spotify.',
  },
  youtubeMusic: {
    launchUrl: 'vnd.youtube.music://',
    webUrl: 'https://music.youtube.com/',
    supportsEmbed: true,
    autoConnect: true,
    helperText: 'Open YouTube Music in a preview window inside VelocityOS, expand it to full screen, or launch native YT Music.',
  },
};

export function isIntegratedAppId(appId: string): appId is IntegratedAppId {
  return INTEGRATED_APP_IDS.includes(appId as IntegratedAppId);
}

export function isIntegratedMusicSourceId(appId: string): appId is IntegratedMusicSourceId {
  return MUSIC_INTEGRATION_IDS.includes(appId as IntegratedMusicSourceId);
}

export function buildDefaultIntegrationState(appId: IntegratedAppId): AppIntegrationState {
  const preset = INTEGRATION_PRESETS[appId];
  return {
    ...preset,
    connected: preset.autoConnect,
    embedInPanel: preset.supportsEmbed,
    lastConnectedAt: preset.autoConnect ? Date.now() : null,
  };
}

export function loadAppIntegrationState(): Record<IntegratedAppId, AppIntegrationState> {
  const defaults = INTEGRATED_APP_IDS.reduce((acc, appId) => {
    acc[appId] = buildDefaultIntegrationState(appId);
    return acc;
  }, {} as Record<IntegratedAppId, AppIntegrationState>);

  if (typeof window === 'undefined') return defaults;

  try {
    const raw = window.localStorage.getItem(APP_INTEGRATION_STORAGE_KEY);
    if (!raw) return defaults;

    const parsed = JSON.parse(raw) as Partial<Record<IntegratedAppId, Partial<AppIntegrationState>>>;

    for (const appId of INTEGRATED_APP_IDS) {
      const candidate = parsed?.[appId];
      if (!candidate || typeof candidate !== 'object') continue;

      defaults[appId] = {
        ...defaults[appId],
        connected: typeof candidate.connected === 'boolean' ? candidate.connected : defaults[appId].connected,
        launchUrl: typeof candidate.launchUrl === 'string' ? candidate.launchUrl : defaults[appId].launchUrl,
        webUrl: typeof candidate.webUrl === 'string' ? candidate.webUrl : defaults[appId].webUrl,
        embedInPanel: typeof candidate.embedInPanel === 'boolean' ? candidate.embedInPanel : defaults[appId].embedInPanel,
        lastConnectedAt:
          typeof candidate.lastConnectedAt === 'number' && Number.isFinite(candidate.lastConnectedAt)
            ? candidate.lastConnectedAt
            : defaults[appId].lastConnectedAt,
      };
    }
  } catch {
    return defaults;
  }

  return defaults;
}

export function saveAppIntegrationState(state: Record<IntegratedAppId, AppIntegrationState>): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(APP_INTEGRATION_STORAGE_KEY, JSON.stringify(state));
}

export function canOpenIntegrationInsideApp(integration: AppIntegrationState): boolean {
  return Boolean(integration.webUrl.trim());
}

function resolveIntegrationId(integration: AppIntegrationState): IntegratedAppId | 'custom' {
  const matched = INTEGRATED_APP_IDS.find((appId) => {
    const preset = INTEGRATION_PRESETS[appId];
    return preset.launchUrl === integration.launchUrl || preset.webUrl === integration.webUrl;
  });

  return matched ?? 'custom';
}

export async function openConnectedAppInsideApp(
  integration: AppIntegrationState,
  options: { title?: string; presentation?: InsideAppPresentation } = {}
): Promise<void> {
  const webUrl = integration.webUrl.trim();
  const presentation = options.presentation ?? 'preview';
  const title = options.title?.trim() || 'Embedded Preview';
  const integrationId = resolveIntegrationId(integration);

  if (!webUrl) {
    recordTelemetryEvent({
      type: 'integration-launch-failure',
      level: 'warning',
      message: 'Inside-app integration launch skipped because no web URL is configured.',
      route: window.location.pathname,
      metadata: { integrationId, presentation },
    });
    toast.error('Set a web URL before opening this integration inside VelocityOS.');
    return;
  }

  try {
    if (isEmbeddedWebViewAvailable()) {
      const opened = await openEmbeddedWebView({
        url: webUrl,
        title,
        startFullscreen: presentation === 'fullscreen',
      });

      if (opened) {
        recordTelemetryEvent({
          type: 'integration-launch',
          level: 'info',
          message: 'Integration opened inside VelocityOS.',
          route: window.location.pathname,
          metadata: { integrationId, presentation, mode: 'embedded-web-view' },
        });
        return;
      }
    }

    if (Capacitor.isNativePlatform()) {
      await Browser.open({
        url: webUrl,
        toolbarColor: '#09111f',
      });
      recordTelemetryEvent({
        type: 'integration-launch',
        level: 'info',
        message: 'Integration opened in the native browser shell.',
        route: window.location.pathname,
        metadata: { integrationId, presentation, mode: 'capacitor-browser' },
      });
      return;
    }

    window.open(webUrl, '_blank', 'noopener,noreferrer');
    recordTelemetryEvent({
      type: 'integration-launch',
      level: 'info',
      message: 'Integration opened in a new browser tab.',
      route: window.location.pathname,
      metadata: { integrationId, presentation, mode: 'browser-tab' },
    });
  } catch {
    recordTelemetryEvent({
      type: 'integration-launch-failure',
      level: 'error',
      message: 'Inside-app integration launch failed.',
      route: window.location.pathname,
      metadata: { integrationId, presentation },
    });
    toast.error('Could not open the inside-app preview for this integration.');
  }
}

export function launchConnectedApp(integration: AppIntegrationState): void {
  const launchUrl = integration.launchUrl.trim();
  const webUrl = integration.webUrl.trim();
  const integrationId = resolveIntegrationId(integration);

  if (!launchUrl && !webUrl) {
    recordTelemetryEvent({
      type: 'integration-launch-failure',
      level: 'warning',
      message: 'Integration launch blocked because no launch or web URL is configured.',
      route: window.location.pathname,
      metadata: { integrationId },
    });
    toast.error('Set at least one launch URL before opening this integration.');
    return;
  }

  const openWebFallback = () => {
    if (!webUrl) return;
    recordTelemetryEvent({
      type: 'integration-launch-failure',
      level: 'warning',
      message: 'Native integration launch did not hide the app, so VelocityOS used the web fallback.',
      route: window.location.pathname,
      metadata: { integrationId },
    });
    void openConnectedAppInsideApp(integration, { presentation: 'preview' });
  };

  if (!launchUrl) {
    openWebFallback();
    return;
  }

  if (/^https?:\/\//i.test(launchUrl) || launchUrl.startsWith('/')) {
    if (launchUrl.startsWith('/')) {
      recordTelemetryEvent({
        type: 'integration-launch',
        level: 'info',
        message: 'Integration launched using an internal route.',
        route: window.location.pathname,
        metadata: { integrationId, launchUrl },
      });
      window.location.href = launchUrl;
      return;
    }
    recordTelemetryEvent({
      type: 'integration-launch',
      level: 'info',
      message: 'Integration launched using a direct web URL.',
      route: window.location.pathname,
      metadata: { integrationId, launchUrl },
    });
    window.location.assign(launchUrl);
    return;
  }

  const wasHidden = document.hidden;
  recordTelemetryEvent({
    type: 'integration-launch',
    level: 'info',
    message: 'Integration launch intent sent to the native target.',
    route: window.location.pathname,
    metadata: { integrationId, launchUrl },
  });
  window.location.href = launchUrl;

  if (webUrl) {
    window.setTimeout(() => {
      if (!document.hidden && !wasHidden) {
        openWebFallback();
      }
    }, 900);
  }
}
