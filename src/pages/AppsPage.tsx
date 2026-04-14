import React, { useEffect, useRef, useState } from 'react';
import { CarLayout } from '@/components/layout/CarLayout';
import {
  Phone,
  MessageCircle,
  Calendar,
  Cloud,
  Radio,
  Settings,
  Shield,
  Navigation,
  CheckCircle2,
  CalendarDays,
  X,
  Store,
  MapPinned,
  Paintbrush,
  SlidersHorizontal,
  ArrowRight,
  Bot,
  Send,
  Trash2,
  Volume2,
  Square,
  Headphones,
  Music2,
  Link2,
  ExternalLink,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsLandscapeMobile } from '@/hooks/use-landscape-mobile';
import { MiniPlayer } from '@/components/drive/MiniPlayer';
import { WeatherWidget } from '@/components/drive/WeatherWidget';
import { useOSStore } from '@/store/use-os-store';
import { applyMarketTheme, getThemeById } from '@/lib/theme-market';
import {
  APP_INTEGRATION_TITLES,
  INTEGRATED_APP_IDS,
  buildDefaultIntegrationState,
  canOpenIntegrationInsideApp,
  isIntegratedAppId,
  launchConnectedApp,
  loadAppIntegrationState,
  openConnectedAppInsideApp,
  saveAppIntegrationState,
  type AppIntegrationState,
  type IntegratedAppId,
  type InsideAppPresentation,
} from '@/lib/app-integrations';
import {
  askOllama,
  buildOfflineAssistantReply,
  clearAssistantHistory,
  getOllamaConnectionHint,
  isLoopbackOllamaBaseUrl,
  loadAssistantHistory,
  saveAssistantHistory,
  type AssistantMessage,
} from '@/lib/ollama-assistant';
import { getAiVoicePreferences, speakWithAiVoice, stopAiVoice } from '@/lib/ai-voice';

type EmbeddedAppId =
  | 'phone'
  | 'whatsapp'
  | 'weather'
  | 'radio'
  | 'calendar'
  | 'safety'
  | 'nav'
  | 'themes'
  | 'settings'
  | 'assistant'
  | 'spotify'
  | 'youtubeMusic';

interface AppItem {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  embedded: EmbeddedAppId;
  action?: () => void;
}

const APPS: AppItem[] = [
  { id: 'phone', label: 'Phone', icon: Phone, color: 'bg-green-500', embedded: 'phone' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'bg-emerald-500', embedded: 'whatsapp' },
  { id: 'assistant', label: 'AI', icon: Bot, color: 'bg-cyan-500', embedded: 'assistant' },
  { id: 'nav', label: 'Maps', icon: Navigation, color: 'bg-indigo-500', embedded: 'nav' },
  { id: 'weather', label: 'Weather', icon: Cloud, color: 'bg-sky-400', embedded: 'weather' },
  { id: 'spotify', label: 'Spotify', icon: Headphones, color: 'bg-emerald-600', embedded: 'spotify' },
  { id: 'youtube-music', label: 'YT Music', icon: Music2, color: 'bg-red-500', embedded: 'youtubeMusic' },
  { id: 'radio', label: 'Radio', icon: Radio, color: 'bg-orange-500', embedded: 'radio' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, color: 'bg-rose-500', embedded: 'calendar' },
  { id: 'safety', label: 'Safety', icon: Shield, color: 'bg-amber-500', embedded: 'safety' },
  { id: 'theme-store', label: 'Store', icon: Store, color: 'bg-fuchsia-500', embedded: 'themes' },
  { id: 'settings', label: 'Settings', icon: Settings, color: 'bg-zinc-600', embedded: 'settings' },
];

const EMBEDDED_TITLES: Record<EmbeddedAppId, string> = {
  phone: APP_INTEGRATION_TITLES.phone,
  whatsapp: APP_INTEGRATION_TITLES.whatsapp,
  weather: 'Weather',
  radio: 'Radio',
  calendar: 'Calendar',
  safety: 'Safety',
  nav: 'Maps',
  themes: 'Store',
  settings: 'Settings',
  assistant: 'AI',
  spotify: APP_INTEGRATION_TITLES.spotify,
  youtubeMusic: APP_INTEGRATION_TITLES.youtubeMusic,
};

function isIntegratedApp(appId: EmbeddedAppId): appId is IntegratedAppId {
  return isIntegratedAppId(appId);
}

function createAssistantMessage(role: 'user' | 'assistant', content: string): AssistantMessage {
  const hasRandomUuid =
    typeof globalThis !== 'undefined' &&
    Boolean(globalThis.crypto) &&
    typeof globalThis.crypto.randomUUID === 'function';

  return {
    id: hasRandomUuid ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    role,
    content,
    ts: Date.now(),
  };
}

function PhonePanel() {
  const [dial, setDial] = useState('');

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">Dial number</div>
      <input
        value={dial}
        onChange={(e) => setDial(e.target.value.replace(/[^0-9+]/g, ''))}
        placeholder="+1 555 0100"
        className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2"
      />
      <button
        onClick={() => {
          if (!dial) {
            toast.error('Enter a number first');
            return;
          }
          window.location.href = `tel:${dial}`;
        }}
        className="rounded-lg bg-green-500/20 border border-green-500/40 px-4 py-2 font-bold text-green-300"
      >
        Call
      </button>
    </div>
  );
}

function WhatsAppPanel() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const openWhatsApp = () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      toast.error('Enter a phone number with country code');
      return;
    }

    const base = `https://wa.me/${cleanPhone}`;
    const url = message.trim() ? `${base}?text=${encodeURIComponent(message.trim())}` : base;
    window.location.assign(url);
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">Open WhatsApp chat</div>
      <input
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        placeholder="15550100"
        className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2"
      />
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Type message (optional)"
        rows={3}
        className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2"
      />
      <div className="flex gap-2">
        <button
          onClick={openWhatsApp}
          className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-4 py-2 font-bold text-emerald-200"
        >
          Open Chat
        </button>
        <button
          onClick={() => window.location.assign('https://web.whatsapp.com/')}
          className="rounded-lg border border-white/20 px-4 py-2 font-bold"
        >
          WhatsApp Web
        </button>
      </div>
    </div>
  );
}

function SpotifyPanel() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
        Spotify integration is available below. Connect once to launch the native app or open Spotify in a preview window that can expand to full screen.
      </div>
      <button
        onClick={() => window.location.assign('https://open.spotify.com/')}
        className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-4 py-2 font-bold text-emerald-200"
      >
        Open Spotify Web
      </button>
    </div>
  );
}

function YouTubeMusicPanel() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">
        YouTube Music integration is available below. Connect to use app deep-link or open a preview window that can switch to full screen inside VelocityOS.
      </div>
      <button
        onClick={() => window.location.assign('https://music.youtube.com/')}
        className="rounded-lg bg-rose-500/20 border border-rose-500/40 px-4 py-2 font-bold text-rose-200"
      >
        Open YouTube Music Web
      </button>
    </div>
  );
}

interface IntegrationDockProps {
  appTitle: string;
  integration: AppIntegrationState;
  onPatch: (patch: Partial<AppIntegrationState>) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onLaunch: () => void;
  onOpenInsideApp: (presentation: InsideAppPresentation) => void;
}

function IntegrationDock({
  appTitle,
  integration,
  onPatch,
  onConnect,
  onDisconnect,
  onLaunch,
  onOpenInsideApp,
}: IntegrationDockProps) {
  return (
    <div className="mt-4 space-y-3 rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-wider font-black text-cyan-100">Integration</div>
          <div className="text-sm font-bold text-cyan-50">{appTitle}</div>
        </div>
        <span
          className={cn(
            'rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wide',
            integration.connected
              ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
              : 'border-white/20 bg-white/5 text-muted-foreground'
          )}
        >
          {integration.connected ? 'Connected' : 'Not connected'}
        </span>
      </div>

      <p className="text-[11px] text-cyan-100/90">{integration.helperText}</p>

      <div className="space-y-2">
        <label className="block text-[11px] uppercase tracking-wide font-bold text-cyan-100/80">App launch URL</label>
        <input
          value={integration.launchUrl}
          onChange={(event) => onPatch({ launchUrl: event.target.value })}
          className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm"
          placeholder="spotify:"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-[11px] uppercase tracking-wide font-bold text-cyan-100/80">Web fallback URL</label>
        <input
          value={integration.webUrl}
          onChange={(event) => onPatch({ webUrl: event.target.value })}
          className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm"
          placeholder="https://open.spotify.com/"
        />
      </div>

      {integration.supportsEmbed && (
        <label className="flex items-center gap-2 text-xs text-cyan-100/90">
          <input
            type="checkbox"
            checked={integration.embedInPanel}
            onChange={(event) => onPatch({ embedInPanel: event.target.checked })}
            className="accent-cyan-400"
          />
          Show preview tools in VelocityOS
        </label>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onConnect}
          className="rounded-lg border border-cyan-300/40 bg-cyan-500/20 px-3 py-2 text-xs font-black uppercase tracking-wide text-cyan-100"
        >
          <span className="inline-flex items-center gap-1"><Link2 className="w-3.5 h-3.5" /> Save Connection</span>
        </button>
        <button
          onClick={onLaunch}
          className="rounded-lg border border-emerald-300/40 bg-emerald-500/20 px-3 py-2 text-xs font-black uppercase tracking-wide text-emerald-100"
        >
          <span className="inline-flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5" /> Open Native App</span>
        </button>
        {integration.supportsEmbed && (
          <>
            <button
              onClick={() => onOpenInsideApp('preview')}
              disabled={!canOpenIntegrationInsideApp(integration)}
              className="rounded-lg border border-sky-300/40 bg-sky-500/20 px-3 py-2 text-xs font-black uppercase tracking-wide text-sky-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="inline-flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5" /> Preview Inside App</span>
            </button>
            <button
              onClick={() => onOpenInsideApp('fullscreen')}
              disabled={!canOpenIntegrationInsideApp(integration)}
              className="rounded-lg border border-indigo-300/40 bg-indigo-500/20 px-3 py-2 text-xs font-black uppercase tracking-wide text-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="inline-flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5" /> Start Full Screen</span>
            </button>
          </>
        )}
        <button
          onClick={onDisconnect}
          className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-black uppercase tracking-wide text-muted-foreground"
        >
          Disconnect
        </button>
      </div>

      {integration.connected && integration.embedInPanel && integration.webUrl && integration.supportsEmbed && (
        <div className="space-y-3 rounded-lg border border-white/15 bg-black/20 p-3">
          <div className="text-[10px] uppercase font-black tracking-wide text-muted-foreground">
            Preview Window
          </div>
          <div className="text-xs text-cyan-100/90">
            Services like Spotify and YouTube Music often block iframe playback. VelocityOS keeps them usable with a native preview window instead, and you can expand it to full screen from the toolbar whenever you want.
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onOpenInsideApp('preview')}
              className="rounded-lg border border-sky-300/40 bg-sky-500/20 px-3 py-2 text-xs font-black uppercase tracking-wide text-sky-100"
            >
              <span className="inline-flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5" /> Preview Now</span>
            </button>
            <button
              onClick={() => onOpenInsideApp('fullscreen')}
              className="rounded-lg border border-indigo-300/40 bg-indigo-500/20 px-3 py-2 text-xs font-black uppercase tracking-wide text-indigo-100"
            >
              <span className="inline-flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5" /> Open Full Screen</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarPanel() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-rose-400"><CalendarDays className="w-4 h-4" /> Today</div>
      <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm">09:30 Vehicle check</div>
      <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm">14:00 Design review</div>
      <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm">18:30 Charge and park</div>
    </div>
  );
}

function SafetyPanel() {
  const gpsStatus = useOSStore((s) => s.gpsStatus);
  const speed = useOSStore((s) => s.currentSpeed);

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3">
        <span>GPS</span>
        <span className={cn('font-bold', gpsStatus === 'granted' ? 'text-emerald-400' : 'text-rose-400')}>{gpsStatus}</span>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3">
        <span>Speed feed</span>
        <span className="font-bold tabular-nums">{speed ? (speed * 3.6).toFixed(1) : '0.0'} km/h</span>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3">
        <span>Systems</span>
        <span className="flex items-center gap-1 text-emerald-400 font-bold"><CheckCircle2 className="w-4 h-4" /> Nominal</span>
      </div>
    </div>
  );
}

function NavigationPanel() {
  const navigate = useNavigate();
  const locations = useOSStore((s) => s.locations);
  const recentLocations = useOSStore((s) => s.recentLocations);
  const openMap = useOSStore((s) => s.openMap);

  const mergedDestinations = [...recentLocations, ...locations].filter(
    (location, index, all) => all.findIndex((candidate) => candidate.id === location.id) === index
  );
  const quickDestinations = mergedDestinations.slice(0, 3);

  return (
    <div className="space-y-3">
      <button
        onClick={() => openMap()}
        className="w-full flex items-center justify-between rounded-lg border border-indigo-400/30 bg-indigo-500/15 px-3 py-2"
      >
        <span className="font-bold text-indigo-200">Open live map overlay</span>
        <MapPinned className="w-4 h-4 text-indigo-200" />
      </button>

      <div className="space-y-2">
        {quickDestinations.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-muted-foreground">
            No saved destinations yet. Use Navigation once to populate quick launches.
          </div>
        ) : (
          quickDestinations.map((destination) => (
            <button
              key={destination.id}
              onClick={() => openMap(destination)}
              className="w-full flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-left"
            >
              <span className="text-sm font-medium truncate pr-2">{destination.label}</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))
        )}
      </div>

      <button
        onClick={() => navigate('/navigation')}
        className="rounded-lg border border-white/20 px-4 py-2 font-bold text-sm"
      >
        Open Full Navigation
      </button>
    </div>
  );
}

function ThemesPanel() {
  const navigate = useNavigate();
  const unlockedThemeIds = useOSStore((s) => s.unlockedThemeIds);
  const activeThemeId = useOSStore((s) => s.activeThemeId);
  const setActiveTheme = useOSStore((s) => s.setActiveTheme);

  const unlockedThemes = unlockedThemeIds
    .map((themeId) => getThemeById(themeId))
    .filter((theme): theme is NonNullable<typeof theme> => Boolean(theme));

  const applyNextTheme = () => {
    if (!unlockedThemes.length) {
      toast.error('No unlocked themes yet');
      return;
    }

    const currentIndex = unlockedThemes.findIndex((theme) => theme.id === activeThemeId);
    const nextTheme = unlockedThemes[(currentIndex + 1 + unlockedThemes.length) % unlockedThemes.length];
    setActiveTheme(nextTheme.id);
    applyMarketTheme(nextTheme);
    toast.success(`Applied ${nextTheme.name}`);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Active theme</span>
          <span className="font-bold">{activeThemeId || 'System default'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Unlocked</span>
          <span className="font-bold">{unlockedThemeIds.length}</span>
        </div>
      </div>

      <button
        onClick={applyNextTheme}
        className="w-full flex items-center justify-between rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/15 px-3 py-2"
      >
        <span className="font-bold text-fuchsia-200">Cycle unlocked theme</span>
        <Paintbrush className="w-4 h-4 text-fuchsia-200" />
      </button>

      <button
        onClick={() => navigate('/theme-store')}
        className="rounded-lg border border-white/20 px-4 py-2 font-bold text-sm"
      >
        Open Full Store
      </button>
    </div>
  );
}

function SettingsPanel() {
  const navigate = useNavigate();
  const settings = useOSStore((s) => s.settings);
  const updateSettings = useOSStore((s) => s.updateSettings);

  return (
    <div className="space-y-3">
      <button
        onClick={() => updateSettings({ autoTheme: !settings.autoTheme })}
        className="w-full flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2"
      >
        <span className="text-sm font-medium">Auto Theme</span>
        <span className="font-bold">{settings.autoTheme ? 'On' : 'Off'}</span>
      </button>

      <button
        onClick={() => updateSettings({ units: settings.units === 'kph' ? 'mph' : 'kph' })}
        className="w-full flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2"
      >
        <span className="text-sm font-medium">Units</span>
        <span className="font-bold uppercase">{settings.units}</span>
      </button>

      <button
        onClick={() => updateSettings({ mapPerspective: settings.mapPerspective === 'driving' ? 'top-down' : 'driving' })}
        className="w-full flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2"
      >
        <span className="text-sm font-medium">Map Perspective</span>
        <span className="font-bold capitalize">{settings.mapPerspective}</span>
      </button>

      <button
        onClick={() => navigate('/settings')}
        className="w-full flex items-center justify-between rounded-lg border border-zinc-400/30 bg-zinc-500/15 px-3 py-2"
      >
        <span className="font-bold text-zinc-100">Open Full Settings</span>
        <SlidersHorizontal className="w-4 h-4 text-zinc-100" />
      </button>
    </div>
  );
}

function AssistantPanel() {
  const aiName = useOSStore((s) => s.settings.aiName);
  const aiVoiceControlEnabled = useOSStore((s) => s.settings.aiVoiceControlEnabled);
  const ollamaBaseUrl = useOSStore((s) => s.settings.ollamaBaseUrl);
  const ollamaModel = useOSStore((s) => s.settings.ollamaModel);
  const aiVoiceEnabled = useOSStore((s) => s.settings.aiVoiceEnabled);
  const aiVoiceAutoSpeak = useOSStore((s) => s.settings.aiVoiceAutoSpeak);
  const aiVoiceName = useOSStore((s) => s.settings.aiVoiceName);
  const aiVoiceLang = useOSStore((s) => s.settings.aiVoiceLang);
  const aiVoiceRate = useOSStore((s) => s.settings.aiVoiceRate);
  const aiVoicePitch = useOSStore((s) => s.settings.aiVoicePitch);
  const aiVoiceVolume = useOSStore((s) => s.settings.aiVoiceVolume);

  const aiVoicePreferences = getAiVoicePreferences({
    aiVoiceEnabled,
    aiVoiceAutoSpeak,
    aiVoiceName,
    aiVoiceLang,
    aiVoiceRate,
    aiVoicePitch,
    aiVoiceVolume,
  });

  const [messages, setMessages] = useState<AssistantMessage[]>(() => loadAssistantHistory());
  const [draft, setDraft] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    saveAssistantHistory(messages);
  }, [messages]);

  const runPrompt = async () => {
    const prompt = draft.trim();
    if (!prompt || isThinking) return;

    const userMessage = createAssistantMessage('user', prompt);
    const historyForModel = [...messages.slice(-24), userMessage];
    setMessages((prev) => [...prev, userMessage]);
    setDraft('');
    setIsThinking(true);

    try {
      const reply = await askOllama({
        baseUrl: ollamaBaseUrl,
        model: ollamaModel,
        prompt,
        history: historyForModel,
      });
      setMessages((prev) => [...prev, createAssistantMessage('assistant', reply)]);
      if (aiVoicePreferences.enabled && aiVoicePreferences.autoSpeak) {
        await speakWithAiVoice(reply, aiVoicePreferences);
      }
    } catch {
      const fallback = buildOfflineAssistantReply(prompt, ollamaBaseUrl);
      setMessages((prev) => [...prev, createAssistantMessage('assistant', fallback)]);
      if (aiVoicePreferences.enabled && aiVoicePreferences.autoSpeak) {
        await speakWithAiVoice(fallback, aiVoicePreferences);
      }
      const loopbackOnPhone = isLoopbackOllamaBaseUrl(ollamaBaseUrl);
      toast.info(loopbackOnPhone
        ? 'Offline assistant mode is active. Update the Ollama URL in Settings to a reachable LAN address.'
        : 'Ollama is unavailable. Offline assistant mode is active.');
    } finally {
      setIsThinking(false);
    }
  };

  const clearHistory = () => {
    clearAssistantHistory();
    setMessages([]);
    toast.success('Local AI history cleared');
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3 text-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="uppercase tracking-wide font-bold">AI Name / Wake Word</span>
          <span className="font-black">{aiName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="uppercase tracking-wide font-bold">Voice Control</span>
          <span className="font-black">{aiVoiceControlEnabled ? 'Enabled' : 'Disabled'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="uppercase tracking-wide font-bold">Voice Output</span>
          <span className="font-black">{aiVoiceEnabled ? 'Enabled' : 'Disabled'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="uppercase tracking-wide font-bold">Voice Auto-Speak</span>
          <span className="font-black">{aiVoiceAutoSpeak ? 'Enabled' : 'Disabled'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="uppercase tracking-wide font-bold">Ollama</span>
          <span className="font-black truncate pl-3">{ollamaModel} @ {ollamaBaseUrl}</span>
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
        {messages.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Ask anything. History is stored locally on this device, and if Ollama is unreachable VelocityOS falls back to built-in offline guidance. Say "{aiName}" then a command to navigate by voice.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'rounded-lg px-3 py-2 text-sm whitespace-pre-wrap',
                message.role === 'assistant'
                  ? 'bg-cyan-500/15 border border-cyan-400/30'
                  : 'bg-white/10 border border-white/20'
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold opacity-75">{message.role}</span>
                {message.role === 'assistant' && aiVoiceEnabled && (
                  <button
                    onClick={() => {
                      void speakWithAiVoice(message.content, aiVoicePreferences);
                    }}
                    className="rounded border border-cyan-400/40 bg-cyan-500/10 p-1 text-cyan-100 hover:bg-cyan-500/20"
                    title="Replay with current voice settings"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              {message.content}
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void runPrompt();
            }
          }}
          placeholder="Ask your local AI assistant"
          className="flex-1 rounded-lg border border-white/20 bg-black/20 px-3 py-2"
        />
        <button
          onClick={() => void runPrompt()}
          disabled={isThinking}
          className="rounded-lg bg-cyan-500/20 border border-cyan-500/40 px-3 py-2 font-bold text-cyan-200 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
        <button
          onClick={stopAiVoice}
          className="rounded-lg border border-white/20 px-3 py-2 text-muted-foreground hover:text-foreground"
          title="Stop current speech"
        >
          <Square className="w-4 h-4" />
        </button>
        <button
          onClick={clearHistory}
          className="rounded-lg border border-white/20 px-3 py-2 text-muted-foreground hover:text-foreground"
          title="Clear local history"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {isThinking && <div className="text-xs text-cyan-200">Thinking with Ollama...</div>}
      {isLoopbackOllamaBaseUrl(ollamaBaseUrl) && (
        <div className="rounded-lg border border-amber-400/35 bg-amber-500/10 p-3 text-xs text-amber-100">
          {getOllamaConnectionHint(ollamaBaseUrl)}
        </div>
      )}
    </div>
  );
}

function EmbeddedAppPanel({ id }: { id: EmbeddedAppId }) {
  if (id === 'phone') return <PhonePanel />;
  if (id === 'whatsapp') return <WhatsAppPanel />;
  if (id === 'assistant') return <AssistantPanel />;
  if (id === 'spotify') return <SpotifyPanel />;
  if (id === 'youtubeMusic') return <YouTubeMusicPanel />;
  if (id === 'nav') return <NavigationPanel />;
  if (id === 'weather') return <div className="h-[180px]"><WeatherWidget /></div>;
  if (id === 'radio') return <div className="h-[120px]"><MiniPlayer /></div>;
  if (id === 'calendar') return <CalendarPanel />;
  if (id === 'themes') return <ThemesPanel />;
  if (id === 'settings') return <SettingsPanel />;
  return <SafetyPanel />;
}

export function AppsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMapOpen = useOSStore((s) => s.isMapOpen);
  const openMap = useOSStore((s) => s.openMap);
  const closeMap = useOSStore((s) => s.closeMap);
  const isLandscapeMobile = useIsLandscapeMobile();
  const [activeEmbedded, setActiveEmbedded] = useState<EmbeddedAppId | null>('weather');
  const [integrations, setIntegrations] = useState<Record<IntegratedAppId, AppIntegrationState>>(() => loadAppIntegrationState());
  const panelHeadingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    saveAppIntegrationState(integrations);
  }, [integrations]);

  useEffect(() => {
    if (!activeEmbedded) return;
    const timer = window.setTimeout(() => {
      panelHeadingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      panelHeadingRef.current?.focus();
    }, 40);
    return () => window.clearTimeout(timer);
  }, [activeEmbedded]);

  const updateIntegration = (appId: IntegratedAppId, patch: Partial<AppIntegrationState>) => {
    setIntegrations((prev) => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        ...patch,
      },
    }));
  };

  const connectIntegration = (appId: IntegratedAppId) => {
    setIntegrations((prev) => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        connected: true,
        lastConnectedAt: Date.now(),
      },
    }));
    toast.success(`${EMBEDDED_TITLES[appId]} integration saved`);
  };

  const disconnectIntegration = (appId: IntegratedAppId) => {
    const defaults = buildDefaultIntegrationState(appId);
    setIntegrations((prev) => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        connected: false,
        embedInPanel: false,
        launchUrl: defaults.launchUrl,
        webUrl: defaults.webUrl,
      },
    }));
    toast.info(`${EMBEDDED_TITLES[appId]} integration disconnected`);
  };

  const launchIntegration = (appId: IntegratedAppId) => {
    const integration = integrations[appId];
    if (!integration.connected) {
      toast.error(`Connect ${EMBEDDED_TITLES[appId]} first`);
      return;
    }
    launchConnectedApp(integration);
  };

  const openIntegrationInsideApp = async (appId: IntegratedAppId, presentation: InsideAppPresentation) => {
    const integration = integrations[appId];
    if (!integration.connected) {
      toast.error(`Connect ${EMBEDDED_TITLES[appId]} first`);
      return;
    }
    await openConnectedAppInsideApp(integration, {
      title: EMBEDDED_TITLES[appId],
      presentation,
    });
  };

  const connectAllApps = () => {
    setIntegrations((prev) => {
      const next = { ...prev };
      for (const appId of INTEGRATED_APP_IDS) {
        next[appId] = {
          ...next[appId],
          connected: true,
          lastConnectedAt: Date.now(),
        };
      }
      return next;
    });
    toast.success('All app integrations connected');
  };

  const connectedCount = INTEGRATED_APP_IDS.filter((id) => integrations[id]?.connected).length;

  const openApp = (app: AppItem) => {
    if (app.action) {
      app.action();
      return;
    }

    if (app.embedded === 'themes') {
      closeMap();
      navigate('/theme-store');
      return;
    }

    if (app.embedded === 'settings') {
      closeMap();
      navigate('/settings');
      return;
    }

    if (app.embedded === 'nav') {
      openMap();
      return;
    }

    closeMap();
    setActiveEmbedded(app.embedded);
  };

  const activeIntegratedAppId = activeEmbedded && isIntegratedApp(activeEmbedded) ? activeEmbedded : null;

  return (
    <CarLayout>
      <div className={cn('max-w-7xl mx-auto', isLandscapeMobile ? 'px-2 py-2 space-y-3' : 'px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12 space-y-8')}>
        <header className={cn(isLandscapeMobile ? 'mb-3' : 'mb-6')}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className={cn('font-black tracking-tighter', isLandscapeMobile ? 'text-3xl' : 'text-6xl')}>App Launcher</h1>
              <p className={cn('text-muted-foreground mt-2 font-medium', isLandscapeMobile ? 'text-sm' : 'text-2xl')}>
                Open built-in apps instantly and integrate phone, chat, and music services
              </p>
              <div className={cn('mt-1 text-cyan-200/80 font-bold', isLandscapeMobile ? 'text-[11px]' : 'text-sm')}>
                Connected integrations: {connectedCount}/{INTEGRATED_APP_IDS.length}
              </div>
            </div>
            <button
              onClick={connectAllApps}
              className={cn(
                'rounded-lg border border-cyan-400/40 bg-cyan-500/15 font-black text-cyan-100',
                isLandscapeMobile ? 'px-3 py-2 text-[11px]' : 'px-4 py-2 text-sm'
              )}
            >
              <span className="inline-flex items-center gap-1.5"><Link2 className="w-4 h-4" /> Connect Phone + WhatsApp + Music</span>
            </button>
          </div>
        </header>

        <div className={cn('grid md:grid-cols-4', isLandscapeMobile ? 'grid-cols-4 gap-2.5' : 'grid-cols-2 gap-5')}>
          {APPS.map((app) => {
            const tileIsActive =
              app.embedded === 'nav'
                ? isMapOpen
                : app.embedded === 'themes'
                  ? location.pathname === '/theme-store'
                  : app.embedded === 'settings'
                    ? location.pathname === '/settings'
                    : activeEmbedded === app.embedded;

            const integration = isIntegratedApp(app.embedded) ? integrations[app.embedded] : null;

            return (
              <button
                key={app.id}
                onClick={() => openApp(app)}
                className={cn(
                  'dashboard-card relative flex flex-col items-center justify-center group hover:border-primary/50 transition-all shadow-lg active:shadow-inner',
                  tileIsActive && 'border-primary bg-primary/10',
                  isLandscapeMobile
                    ? 'aspect-auto h-[98px] w-full max-w-[108px] mx-auto gap-2 rounded-2xl p-2'
                    : 'aspect-square gap-4'
                )}
              >
                {integration?.connected && (
                  <span className="absolute right-2 top-2 rounded border border-emerald-400/40 bg-emerald-500/15 p-1 text-emerald-200">
                    <Link2 className="w-3 h-3" />
                  </span>
                )}
                <div
                  className={cn(
                    `${app.color} text-white shadow-lg group-hover:shadow-glow transition-all duration-200`,
                    isLandscapeMobile ? 'p-2 rounded-xl' : 'p-7 rounded-[2rem]'
                  )}
                >
                  <app.icon className={cn(isLandscapeMobile ? 'w-5 h-5' : 'w-10 h-10')} />
                </div>
                <span className={cn('font-black tracking-tight', isLandscapeMobile ? 'text-xs leading-tight' : 'text-xl')}>{app.label}</span>
              </button>
            );
          })}
        </div>

        {activeEmbedded && (
          <section className="dashboard-card">
            <div className="flex items-center justify-between mb-3">
              <h2
                ref={panelHeadingRef}
                tabIndex={-1}
                className={cn('font-black uppercase tracking-wider outline-none', isLandscapeMobile ? 'text-xs' : 'text-lg')}
              >
                {EMBEDDED_TITLES[activeEmbedded]} panel
              </h2>
              <button
                onClick={() => setActiveEmbedded(null)}
                className="rounded-md border border-white/20 p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <EmbeddedAppPanel id={activeEmbedded} />
            {activeIntegratedAppId && (
              <IntegrationDock
                appTitle={EMBEDDED_TITLES[activeIntegratedAppId]}
                integration={integrations[activeIntegratedAppId]}
                onPatch={(patch) => updateIntegration(activeIntegratedAppId, patch)}
                onConnect={() => connectIntegration(activeIntegratedAppId)}
                onDisconnect={() => disconnectIntegration(activeIntegratedAppId)}
                onLaunch={() => launchIntegration(activeIntegratedAppId)}
                onOpenInsideApp={(presentation) => void openIntegrationInsideApp(activeIntegratedAppId, presentation)}
              />
            )}
          </section>
        )}
      </div>
    </CarLayout>
  );
}
