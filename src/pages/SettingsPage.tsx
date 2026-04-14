import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CarLayout } from '@/components/layout/CarLayout';
import { useOSStore } from '@/store/use-os-store';
import { Ruler, LogOut, Info, Download, CheckCircle, XCircle, Sun, Moon, Sparkles, Navigation, Zap, Globe, Layers, Gauge, ShieldAlert, ShieldCheck, Bot, Mic, Play, Server, Square, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { cn } from "@/lib/utils";
import { useIsLandscapeMobile } from '@/hooks/use-landscape-mobile';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useLocation } from 'react-router-dom';
import {
  getNativeMonitorConfig,
  isNativeMonitorPluginAvailable,
  NATIVE_MONITOR_LIMITS,
  openNativeMonitorAppSettings,
  openNativeMonitorHomeSettings,
  requestNativeMonitorPermissions,
  setNativeMonitorConfig,
  type NativeMonitorConfig,
} from '@/lib/native-monitor';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { getAiVoicePreferences, getAvailableAiVoiceProfiles, isAiVoiceOutputSupported, primeSpeechVoices, speakWithAiVoice, stopAiVoice, type AiVoiceProfile } from '@/lib/ai-voice';
import { isLoopbackOllamaBaseUrl } from '@/lib/ollama-assistant';
import { getAmbientEffectById, getScenePackById, getWidgetSkinById } from '@/lib/cosmetic-market';
import { SystemStatusHub } from '@/components/system/SystemStatusHub';
import { useLiveTrackingState, useParkedDemoState } from '@/store/os-domain-hooks';
export function SettingsPage() {
  const location = useLocation();
  const units = useOSStore((s) => s.settings.units);
  const mapTheme = useOSStore((s) => s.settings.mapTheme);
  const mapPerspective = useOSStore((s) => s.settings.mapPerspective);
  const autoTheme = useOSStore((s) => s.settings.autoTheme);
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
  const activeScenePackId = useOSStore((s) => s.activeScenePackId);
  const activeAmbientEffectId = useOSStore((s) => s.activeAmbientEffectId);
  const activeWidgetSkinId = useOSStore((s) => s.activeWidgetSkinId);
  const gpsStatus = useOSStore((s) => s.gpsStatus);
  const currentSpeed = useOSStore((s) => s.currentSpeed);
  const updateSettings = useOSStore((s) => s.updateSettings);
  const resetSystem = useOSStore((s) => s.resetSystem);
  const isLoading = useOSStore((s) => s.isLoading);
  const { isSharingLive, trackingId } = useLiveTrackingState();
  const { parkedDemoStatus, openParkedDemo } = useParkedDemoState();
  const { isInstallable, install } = usePWAInstall();
  const isLandscapeMobile = useIsLandscapeMobile();
  const network = useNetworkStatus({ offlineGraceMs: 3000 });
  const isNativeMonitorAvailable = isNativeMonitorPluginAvailable();
  const isParked = !currentSpeed || currentSpeed < 0.8;
  const activeScene = getScenePackById(activeScenePackId) ?? getScenePackById('scene-garage-grid');
  const activeAmbientEffect = getAmbientEffectById(activeAmbientEffectId) ?? getAmbientEffectById('effect-clear-air');
  const activeWidgetSkin = getWidgetSkinById(activeWidgetSkinId) ?? getWidgetSkinById('widget-core-digital');

  const settingsChromeClassName = activeWidgetSkin?.style === 'retro'
    ? '[&_.dashboard-card]:border [&_.dashboard-card]:border-amber-300/20 [&_.dashboard-card]:bg-amber-950/18 [&_.dashboard-card]:backdrop-blur-xl [&_.dashboard-card]:shadow-[0_24px_64px_-42px_rgba(245,158,11,0.35)]'
    : activeWidgetSkin?.style === 'motorsport'
      ? '[&_.dashboard-card]:border [&_.dashboard-card]:border-rose-300/18 [&_.dashboard-card]:bg-zinc-950/42 [&_.dashboard-card]:backdrop-blur-xl [&_.dashboard-card]:shadow-[0_24px_64px_-42px_rgba(244,63,94,0.35)]'
      : activeWidgetSkin?.style === 'luxury'
        ? '[&_.dashboard-card]:border [&_.dashboard-card]:border-white/15 [&_.dashboard-card]:bg-stone-950/46 [&_.dashboard-card]:backdrop-blur-xl [&_.dashboard-card]:shadow-[0_24px_64px_-42px_rgba(251,191,36,0.24)]'
        : activeWidgetSkin?.style === 'cyber'
          ? '[&_.dashboard-card]:border [&_.dashboard-card]:border-emerald-400/18 [&_.dashboard-card]:bg-emerald-950/20 [&_.dashboard-card]:backdrop-blur-xl [&_.dashboard-card]:shadow-[0_24px_64px_-42px_rgba(16,185,129,0.28)]'
          : activeWidgetSkin?.style === 'expedition'
            ? '[&_.dashboard-card]:border [&_.dashboard-card]:border-lime-300/18 [&_.dashboard-card]:bg-lime-950/18 [&_.dashboard-card]:backdrop-blur-xl [&_.dashboard-card]:shadow-[0_24px_64px_-42px_rgba(132,204,22,0.28)]'
            : '[&_.dashboard-card]:border [&_.dashboard-card]:border-white/10 [&_.dashboard-card]:bg-black/32 [&_.dashboard-card]:backdrop-blur-xl [&_.dashboard-card]:shadow-[0_24px_64px_-42px_rgba(59,130,246,0.22)]';

  const heroCardClassName = activeWidgetSkin?.style === 'retro'
    ? 'border-amber-300/22 bg-amber-950/20 text-amber-50'
    : activeWidgetSkin?.style === 'motorsport'
      ? 'border-rose-300/20 bg-zinc-950/45 text-rose-50'
      : activeWidgetSkin?.style === 'luxury'
        ? 'border-white/15 bg-stone-950/46 text-amber-50'
        : activeWidgetSkin?.style === 'cyber'
          ? 'border-emerald-400/20 bg-emerald-950/22 text-emerald-50'
          : activeWidgetSkin?.style === 'expedition'
            ? 'border-lime-300/20 bg-lime-950/22 text-lime-50'
            : 'border-white/12 bg-black/35 text-foreground';

  const heroTitleClassName = activeWidgetSkin?.style === 'retro'
    ? 'font-mono text-amber-100 tracking-[0.05em]'
    : activeWidgetSkin?.style === 'luxury'
      ? 'font-serif text-amber-50'
      : activeWidgetSkin?.style === 'cyber'
        ? 'font-mono text-emerald-100 tracking-[0.05em]'
        : activeWidgetSkin?.style === 'expedition'
          ? 'font-mono text-lime-50 tracking-[0.04em]'
          : activeWidgetSkin?.style === 'motorsport'
            ? 'text-rose-50 tracking-tight'
            : 'text-foreground';

  const heroCaptionClassName = activeWidgetSkin?.style === 'retro'
    ? 'text-amber-200/72'
    : activeWidgetSkin?.style === 'motorsport'
      ? 'text-rose-100/68'
      : activeWidgetSkin?.style === 'luxury'
        ? 'text-amber-100/68'
        : activeWidgetSkin?.style === 'cyber'
          ? 'text-cyan-200/72'
          : activeWidgetSkin?.style === 'expedition'
            ? 'text-lime-100/72'
            : 'text-muted-foreground';

  const [monitorConfig, setMonitorConfig] = useState<NativeMonitorConfig | null>(null);
  const [isMonitorLoading, setIsMonitorLoading] = useState(true);
  const [isMonitorSaving, setIsMonitorSaving] = useState(false);
  const [monitorSaveState, setMonitorSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isMonitorActionBusy, setIsMonitorActionBusy] = useState(false);
  const [aiNameDraft, setAiNameDraft] = useState(aiName);
  const [ollamaBaseUrlDraft, setOllamaBaseUrlDraft] = useState(ollamaBaseUrl);
  const [ollamaModelDraft, setOllamaModelDraft] = useState(ollamaModel);
  const [aiVoiceLangDraft, setAiVoiceLangDraft] = useState(aiVoiceLang);
  const [voicePreviewText, setVoicePreviewText] = useState('Hello driver, this is your AI voice preview.');
  const [availableVoices, setAvailableVoices] = useState<AiVoiceProfile[]>([]);
  const [isVoiceOutputSupported, setIsVoiceOutputSupported] = useState(false);
  const [isVoiceCatalogLoading, setIsVoiceCatalogLoading] = useState(true);
  const [highlightMicToggle, setHighlightMicToggle] = useState(false);
  const monitorConfigRef = useRef<NativeMonitorConfig | null>(null);
  const monitorSaveTokenRef = useRef(0);

  const aiVoicePreferences = getAiVoicePreferences({
    aiVoiceEnabled,
    aiVoiceAutoSpeak,
    aiVoiceName,
    aiVoiceLang,
    aiVoiceRate,
    aiVoicePitch,
    aiVoiceVolume,
  });

  const selectedVoiceIndex = availableVoices.findIndex((voice) => voice.name === aiVoiceName && voice.lang === aiVoiceLang);

  useEffect(() => {
    setAiNameDraft(aiName);
  }, [aiName]);

  useEffect(() => {
    setOllamaBaseUrlDraft(ollamaBaseUrl);
  }, [ollamaBaseUrl]);

  useEffect(() => {
    setOllamaModelDraft(ollamaModel);
  }, [ollamaModel]);

  useEffect(() => {
    setAiVoiceLangDraft(aiVoiceLang);
  }, [aiVoiceLang]);

  useEffect(() => {
    let active = true;
    let previousOnVoicesChanged: SpeechSynthesis['onvoiceschanged'] | null = null;

    const updateVoices = async () => {
      primeSpeechVoices();

      const [supported, voices] = await Promise.all([
        isAiVoiceOutputSupported(),
        getAvailableAiVoiceProfiles(),
      ]);

      if (!active) {
        return;
      }

      setIsVoiceOutputSupported(supported);
      setAvailableVoices(voices);
      if (voices.length > 0) {
        setIsVoiceCatalogLoading(false);
      }
    };

    void updateVoices();
    const loadingTimeoutId = window.setTimeout(() => {
      if (active) {
        setIsVoiceCatalogLoading(false);
      }
    }, 1800);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      previousOnVoicesChanged = synth.onvoiceschanged;
      synth.onvoiceschanged = () => {
        void updateVoices();
        setIsVoiceCatalogLoading(false);
      };
    }

    return () => {
      active = false;
      window.clearTimeout(loadingTimeoutId);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = previousOnVoicesChanged;
      }
    };
  }, []);

  useEffect(() => {
    const search = new URLSearchParams(location.search);
    if (search.get('focus') !== 'mic-toggle') return;

    const focusMicToggle = () => {
      const card = document.getElementById('settings-mic-toggle-card');
      const toggle = document.getElementById('settings-mic-toggle-switch');
      card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (toggle instanceof HTMLElement) {
        toggle.focus();
      }
      setHighlightMicToggle(true);
    };

    const focusTimer = window.setTimeout(focusMicToggle, 40);
    const clearTimer = window.setTimeout(() => setHighlightMicToggle(false), 2800);
    return () => {
      window.clearTimeout(focusTimer);
      window.clearTimeout(clearTimer);
    };
  }, [location.search]);

  const commitAiSettings = useCallback(() => {
    const nextAiName = aiNameDraft.trim().replace(/\s+/g, ' ').slice(0, 32) || 'nova';
    const nextOllamaBaseUrl = ollamaBaseUrlDraft.trim() || 'http://127.0.0.1:11434';
    const nextOllamaModel = ollamaModelDraft.trim() || 'llama3.2';

    setAiNameDraft(nextAiName);
    setOllamaBaseUrlDraft(nextOllamaBaseUrl);
    setOllamaModelDraft(nextOllamaModel);
    void updateSettings({
      aiName: nextAiName,
      ollamaBaseUrl: nextOllamaBaseUrl,
      ollamaModel: nextOllamaModel,
    });
  }, [aiNameDraft, ollamaBaseUrlDraft, ollamaModelDraft, updateSettings]);

  const commitAiVoiceLang = useCallback(() => {
    const nextLang = aiVoiceLangDraft.trim() || 'en-US';
    setAiVoiceLangDraft(nextLang);
    void updateSettings({ aiVoiceLang: nextLang });
  }, [aiVoiceLangDraft, updateSettings]);

  const handleVoiceSelection = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIndex = Number.parseInt(event.target.value, 10);
    if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= availableVoices.length) {
      void updateSettings({ aiVoiceName: '', aiVoiceLang: aiVoiceLangDraft.trim() || 'en-US' });
      return;
    }

    const selectedVoice = availableVoices[selectedIndex];
    void updateSettings({ aiVoiceName: selectedVoice.name, aiVoiceLang: selectedVoice.lang || 'en-US' });
    setAiVoiceLangDraft(selectedVoice.lang || 'en-US');
  }, [availableVoices, aiVoiceLangDraft, updateSettings]);

  const previewAiVoice = useCallback(async () => {
    primeSpeechVoices();
    const spoken = await speakWithAiVoice(voicePreviewText, aiVoicePreferences);
    if (!spoken) {
      toast.error('Voice preview unavailable. Enable AI voice output and check device speech support.');
    }
  }, [aiVoicePreferences, voicePreviewText]);

  useEffect(() => {
    monitorConfigRef.current = monitorConfig;
  }, [monitorConfig]);

  const loadNativeMonitorConfig = useCallback(async () => {
    setIsMonitorLoading(true);
    try {
      const config = await getNativeMonitorConfig();
      setMonitorConfig(config);
      setMonitorSaveState('idle');
    } catch {
      toast.error('Unable to load native monitor settings');
    } finally {
      setIsMonitorLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNativeMonitorConfig();
  }, [loadNativeMonitorConfig]);

  const applyMonitorPatch = useCallback(async (patch: Partial<NativeMonitorConfig>) => {
    const current = monitorConfigRef.current;
    if (!current) return;

    const nextConfig = { ...current, ...patch };
    monitorConfigRef.current = nextConfig;
    setMonitorConfig(nextConfig);

    const saveToken = ++monitorSaveTokenRef.current;
    setIsMonitorSaving(true);
    setMonitorSaveState('saving');

    try {
      const updated = await setNativeMonitorConfig(nextConfig);
      if (saveToken !== monitorSaveTokenRef.current) return;

      monitorConfigRef.current = updated;
      setMonitorConfig(updated);
      setMonitorSaveState('saved');
    } catch {
      if (saveToken !== monitorSaveTokenRef.current) return;

      setMonitorSaveState('error');
      toast.error('Failed to autosave native monitor settings');
      void loadNativeMonitorConfig();
    } finally {
      if (saveToken === monitorSaveTokenRef.current) {
        setIsMonitorSaving(false);
      }
    }
  }, [loadNativeMonitorConfig]);

  const handleRequestMonitorPermissions = async () => {
    setIsMonitorActionBusy(true);
    try {
      const ok = await requestNativeMonitorPermissions();
      if (ok) {
        toast.success('Permission prompt opened');
      } else {
        toast.error('Unable to request permissions');
      }
    } finally {
      setIsMonitorActionBusy(false);
    }
  };

  const handleOpenHomeSettings = async () => {
    const opened = await openNativeMonitorHomeSettings();
    if (!opened) {
      toast.error('Home app settings are only available on Android');
    }
  };

  const handleOpenAppSettings = async () => {
    const opened = await openNativeMonitorAppSettings();
    if (!opened) {
      toast.error('App settings are only available on Android');
    }
  };

  const strictPrivilegeReady = Boolean(monitorConfig?.isDeviceOwner || monitorConfig?.isDefaultLauncher);

  const handleReset = async () => {
    try {
      await resetSystem();
      toast.success('System reset complete');
    } catch (err) {
      toast.error('Failed to reset system');
    }
  };
  return (
    <CarLayout>
      <div className={cn(
        'relative max-w-7xl mx-auto overflow-hidden',
        settingsChromeClassName,
        isLandscapeMobile ? "px-1.5 py-1.5 space-y-3" : "px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12 space-y-12"
      )}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-52 opacity-80 blur-3xl" style={{ background: `radial-gradient(circle at 16% 18%, ${activeScene?.accent ?? activeWidgetSkin?.accent ?? 'rgba(59,130,246,0.18)'} 0, transparent 44%)` }} />
        <header>
          <h1 className={cn("font-black tracking-tighter", isLandscapeMobile ? "text-2xl" : "text-6xl")}>System Settings</h1>
          <p className={cn("text-muted-foreground mt-2 font-medium", isLandscapeMobile ? "text-xs" : "text-2xl")}>Configure your VelocityOS experience</p>
        </header>
        <section
          className={cn('relative overflow-hidden rounded-[2rem] border backdrop-blur-xl', heroCardClassName, isLandscapeMobile ? 'p-3' : 'p-6')}
          style={{ boxShadow: `0 28px 72px -44px ${activeScene?.glow ?? activeAmbientEffect?.accent ?? 'rgba(59,130,246,0.22)'}` }}
        >
          <div className="absolute inset-0 opacity-80" style={{ background: activeScene?.surface }} />
          <div className="absolute -right-10 top-0 h-28 w-28 rounded-full blur-3xl" style={{ background: activeAmbientEffect?.accent }} />
          <div className={cn('relative z-10 flex gap-4', isLandscapeMobile ? 'flex-col' : 'items-end justify-between')}>
            <div>
              <div className={cn('text-[10px] font-black uppercase tracking-[0.28em]', heroCaptionClassName)}>Active cockpit profile</div>
              <h2 className={cn('mt-2 font-black tracking-tight', heroTitleClassName, isLandscapeMobile ? 'text-xl' : 'text-4xl')}>
                Settings chrome now follows your store loadout
              </h2>
              <p className={cn('mt-2 max-w-3xl', heroCaptionClassName, isLandscapeMobile ? 'text-[11px]' : 'text-sm')}>
                Widget skin styling, scene color, and ambient accents stay visible here while you tune the system.
              </p>
            </div>
            <div className={cn('grid gap-2', isLandscapeMobile ? 'grid-cols-1' : 'grid-cols-3')}>
              <div className="rounded-[1.35rem] border px-3 py-3" style={{ borderColor: `${activeWidgetSkin?.accent ?? 'rgba(255,255,255,0.12)'}44`, background: 'rgba(8,12,18,0.28)' }}>
                <div className={cn('text-[10px] font-semibold uppercase tracking-[0.22em]', heroCaptionClassName)}>Widget skin</div>
                <div className={cn('mt-1 font-black', heroTitleClassName, isLandscapeMobile ? 'text-sm' : 'text-base')}>{activeWidgetSkin?.label}</div>
              </div>
              <div className="rounded-[1.35rem] border px-3 py-3" style={{ borderColor: `${activeScene?.accent ?? 'rgba(255,255,255,0.12)'}44`, background: 'rgba(8,12,18,0.28)' }}>
                <div className={cn('text-[10px] font-semibold uppercase tracking-[0.22em]', heroCaptionClassName)}>Scene</div>
                <div className={cn('mt-1 font-black', heroTitleClassName, isLandscapeMobile ? 'text-sm' : 'text-base')}>{activeScene?.name}</div>
              </div>
              <div className="rounded-[1.35rem] border px-3 py-3" style={{ borderColor: `${activeAmbientEffect?.accent ?? 'rgba(255,255,255,0.12)'}44`, background: 'rgba(8,12,18,0.28)' }}>
                <div className={cn('text-[10px] font-semibold uppercase tracking-[0.22em]', heroCaptionClassName)}>Ambient</div>
                <div className={cn('mt-1 font-black', heroTitleClassName, isLandscapeMobile ? 'text-sm' : 'text-base')}>{activeAmbientEffect?.label}</div>
              </div>
            </div>
          </div>
        </section>
        <div className={cn(isLandscapeMobile ? "space-y-3" : "space-y-8")}>
          <div id="settings-personalization" className={cn(isLandscapeMobile ? "space-y-3" : "space-y-8")}>
            <div className="space-y-1">
              <div className={cn("font-black uppercase tracking-[0.22em] text-primary/75", isLandscapeMobile ? "text-[10px]" : "text-xs")}>Personalization</div>
              <h2 className={cn("font-black tracking-tight", isLandscapeMobile ? "text-xl" : "text-3xl")}>Tune the driving experience</h2>
              <p className={cn("text-muted-foreground", isLandscapeMobile ? "text-[11px]" : "text-sm")}>Visual styling, map feel, voice behavior, and daily driving preferences.</p>
            </div>
          <section className={cn("dashboard-card", isLandscapeMobile ? "space-y-3" : "space-y-8")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Zap className={cn("text-primary", isLandscapeMobile ? "w-5 h-5" : "w-12 h-12")} />
                <div>
                  <h2 className={cn("font-bold", isLandscapeMobile ? "text-base" : "text-3xl")}>Auto Adaptive UI</h2>
                  <p className={cn("text-muted-foreground", isLandscapeMobile ? "text-xs" : "text-lg")}>Switch day/night theme automatically based on time</p>
                </div>
              </div>
              <Switch
                checked={autoTheme}
                onCheckedChange={(val) => updateSettings({ autoTheme: val })}
                className={cn(isLandscapeMobile ? "scale-95 mr-0.5" : "scale-150 mr-4")}
              />
            </div>
          </section>
          <section className={cn("dashboard-card", isLandscapeMobile ? "space-y-3" : "space-y-8")}>
            <div className="flex items-center gap-4">
              <Layers className={cn("text-primary", isLandscapeMobile ? "w-5 h-5" : "w-12 h-12")} />
              <h2 className={cn("font-bold", isLandscapeMobile ? "text-base" : "text-3xl")}>Navigation Perspective</h2>
            </div>
            <RadioGroup
              value={mapPerspective}
              onValueChange={(val) => updateSettings({ mapPerspective: val as any })}
              className={cn("grid grid-cols-2", isLandscapeMobile ? "gap-2" : "gap-6")}
            >
              {[
                { id: 'driving', label: 'Driving', icon: Navigation, desc: '3D Pitched view' },
                { id: 'top-down', label: 'Top-Down', icon: Globe, desc: 'North-up overview' },
              ].map((p) => (
                <Label
                  key={p.id}
                  htmlFor={p.id}
                  className={cn(
                    "flex flex-col items-center justify-center border-4 transition-all cursor-pointer",
                    isLandscapeMobile ? "h-20 rounded-xl gap-0.5" : "h-48 rounded-[2.5rem] gap-3",
                    mapPerspective === p.id ? 'border-primary bg-primary/10 shadow-glow' : 'border-white/5 bg-white/5'
                  )}
                >
                  <RadioGroupItem value={p.id} id={p.id} className="sr-only" />
                  <p.icon className={cn(isLandscapeMobile ? "w-5 h-5" : "w-14 h-14", mapPerspective === p.id ? "text-primary" : "text-muted-foreground")} />
                  <div className="text-center">
                    <span className={cn("font-black uppercase tracking-widest block", isLandscapeMobile ? "text-xs" : "text-xl")}>{p.label}</span>
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter opacity-60">{p.desc}</span>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </section>
          <section className={cn("dashboard-card", isLandscapeMobile ? "space-y-3" : "space-y-8")}>
            <div className="flex items-center gap-4">
              <Sparkles className={cn("text-primary", isLandscapeMobile ? "w-5 h-5" : "w-12 h-12")} />
              <h2 className={cn("font-bold", isLandscapeMobile ? "text-base" : "text-3xl")}>Map Visual Style</h2>
            </div>
            <RadioGroup
              value={mapTheme}
              onValueChange={(val) => updateSettings({ mapTheme: val as any })}
              className={cn("grid grid-cols-2 lg:grid-cols-4", isLandscapeMobile ? "gap-2" : "gap-6")}
            >
              {[
                { id: 'light', label: 'Day', icon: Sun },
                { id: 'dark', label: 'Night', icon: Moon },
                { id: 'vibrant', label: 'Vibrant', icon: Sparkles },
                { id: 'highway', label: 'Highway', icon: Navigation },
              ].map((t) => (
                <Label
                  key={t.id}
                  htmlFor={t.id}
                  className={cn(
                    "flex flex-col items-center justify-center border-4 transition-all cursor-pointer",
                    isLandscapeMobile ? "h-[4.5rem] rounded-xl gap-1" : "h-40 rounded-[2.5rem] gap-4",
                    mapTheme === t.id ? 'border-primary bg-primary/10 shadow-glow' : 'border-white/5 bg-white/5'
                  )}
                >
                  <RadioGroupItem value={t.id} id={t.id} className="sr-only" />
                  <t.icon className={cn(isLandscapeMobile ? "w-4 h-4" : "w-12 h-12", mapTheme === t.id ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("font-black uppercase tracking-widest", isLandscapeMobile ? "text-xs" : "text-xl")}>{t.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </section>
          <section className={cn("dashboard-card", isLandscapeMobile ? "space-y-3" : "space-y-8")}>
            <div className="flex items-center gap-4">
              <Ruler className={cn("text-primary", isLandscapeMobile ? "w-5 h-5" : "w-12 h-12")} />
              <h2 className={cn("font-bold", isLandscapeMobile ? "text-base" : "text-3xl")}>Units & Standards</h2>
            </div>
            <RadioGroup
              value={units}
              onValueChange={(val) => updateSettings({ units: val as 'mph' | 'kph' })}
              className={cn("grid grid-cols-2", isLandscapeMobile ? "gap-2" : "gap-6")}
            >
              <Label
                htmlFor="mph"
                className={cn(
                  "flex flex-col items-center justify-center border-4 transition-all cursor-pointer",
                  isLandscapeMobile ? "h-16 rounded-xl" : "h-28 rounded-3xl",
                  units === 'mph' ? 'border-primary bg-primary/5 shadow-glow' : 'border-white/5 bg-white/5'
                )}
              >
                <RadioGroupItem value="mph" id="mph" className="sr-only" />
                <span className={cn("font-black uppercase tracking-widest", isLandscapeMobile ? "text-xs" : "text-2xl")}>Imperial (MPH)</span>
              </Label>
              <Label
                htmlFor="kph"
                className={cn(
                  "flex flex-col items-center justify-center border-4 transition-all cursor-pointer",
                  isLandscapeMobile ? "h-16 rounded-xl" : "h-28 rounded-3xl",
                  units === 'kph' ? 'border-primary bg-primary/5 shadow-glow' : 'border-white/5 bg-white/5'
                )}
              >
                <RadioGroupItem value="kph" id="kph" className="sr-only" />
                <span className={cn("font-black uppercase tracking-widest", isLandscapeMobile ? "text-xs" : "text-2xl")}>Metric (KPH)</span>
              </Label>
            </RadioGroup>
          </section>
          <section className={cn("dashboard-card", isLandscapeMobile ? "space-y-3" : "space-y-8")}>
            <div className="flex items-center gap-4">
              <Bot className={cn("text-primary", isLandscapeMobile ? "w-5 h-5" : "w-12 h-12")} />
              <div>
                <h2 className={cn("font-bold", isLandscapeMobile ? "text-base" : "text-3xl")}>Local AI Assistant</h2>
                <p className={cn("text-muted-foreground", isLandscapeMobile ? "text-xs" : "text-lg")}>Powered by your local Ollama runtime with voice wake-word navigation</p>
              </div>
            </div>

            <div className={cn("grid grid-cols-1 md:grid-cols-2", isLandscapeMobile ? "gap-2" : "gap-4")}>
              <div className={cn("bg-white/5 border border-white/10", isLandscapeMobile ? "p-3 rounded-xl space-y-1" : "p-6 rounded-[2rem] space-y-2")}>
                <Label htmlFor="ai-name" className={cn("font-bold", isLandscapeMobile ? "text-xs" : "text-base")}>AI Name (Wake Word)</Label>
                <Input
                  id="ai-name"
                  value={aiNameDraft}
                  maxLength={32}
                  onChange={(event) => setAiNameDraft(event.target.value)}
                  onBlur={commitAiSettings}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.currentTarget.blur();
                    }
                  }}
                  className={cn("bg-black/40 border-white/20", isLandscapeMobile ? "h-9 text-sm" : "h-11 text-lg")}
                />
                <p className={cn("text-muted-foreground", isLandscapeMobile ? "text-[10px]" : "text-xs")}>Say "{(aiNameDraft || aiName || 'nova').trim()}" followed by commands like "open apps"</p>
              </div>

              <div
                id="settings-mic-toggle-card"
                className={cn(
                  "flex items-center justify-between bg-white/5 border border-white/10 transition-shadow",
                  isLandscapeMobile ? "p-3 rounded-xl" : "p-6 rounded-[2rem]",
                  highlightMicToggle && 'ring-2 ring-primary/70 shadow-glow'
                )}
              >
                <div className="flex items-center gap-3">
                  <Mic className={cn("text-primary", isLandscapeMobile ? "w-4 h-4" : "w-6 h-6")} />
                  <div>
                    <p className={cn("font-bold", isLandscapeMobile ? "text-sm" : "text-xl")}>Voice Control</p>
                    <p className={cn("text-muted-foreground", isLandscapeMobile ? "text-[11px]" : "text-sm")}>Wake-word command navigation</p>
                  </div>
                </div>
                <Switch
                  id="settings-mic-toggle-switch"
                  checked={aiVoiceControlEnabled}
                  onCheckedChange={(value) => {
                    void updateSettings({ aiVoiceControlEnabled: value });
                  }}
                  className={cn(isLandscapeMobile ? "scale-95" : "scale-125")}
                />
              </div>
            </div>

            <div className={cn("grid grid-cols-1 md:grid-cols-2", isLandscapeMobile ? "gap-2" : "gap-4")}>
              <div className={cn("flex items-center justify-between bg-white/5 border border-white/10", isLandscapeMobile ? "p-3 rounded-xl" : "p-6 rounded-[2rem]")}>
                <div className="flex items-center gap-3">
                  <Volume2 className={cn("text-primary", isLandscapeMobile ? "w-4 h-4" : "w-6 h-6")} />
                  <div>
                    <p className={cn("font-bold", isLandscapeMobile ? "text-sm" : "text-xl")}>AI Voice Output</p>
                    <p className={cn("text-muted-foreground", isLandscapeMobile ? "text-[11px]" : "text-sm")}>Enable text-to-speech for assistant replies</p>
                  </div>
                </div>
                <Switch
                  checked={aiVoiceEnabled}
                  onCheckedChange={(value) => {
                    void updateSettings({ aiVoiceEnabled: value });
                    if (!value) stopAiVoice();
                  }}
                  className={cn(isLandscapeMobile ? "scale-95" : "scale-125")}
                />
              </div>

              <div className={cn("flex items-center justify-between bg-white/5 border border-white/10", isLandscapeMobile ? "p-3 rounded-xl" : "p-6 rounded-[2rem]")}>
                <div className="flex items-center gap-3">
                  <Bot className={cn("text-primary", isLandscapeMobile ? "w-4 h-4" : "w-6 h-6")} />
                  <div>
                    <p className={cn("font-bold", isLandscapeMobile ? "text-sm" : "text-xl")}>Auto-Speak Replies</p>
                    <p className={cn("text-muted-foreground", isLandscapeMobile ? "text-[11px]" : "text-sm")}>Read each AI response automatically</p>
                  </div>
                </div>
                <Switch
                  checked={aiVoiceAutoSpeak}
                  onCheckedChange={(value) => {
                    void updateSettings({ aiVoiceAutoSpeak: value });
                  }}
                  className={cn(isLandscapeMobile ? "scale-95" : "scale-125")}
                />
              </div>
            </div>

            <div className={cn("grid grid-cols-1 md:grid-cols-2", isLandscapeMobile ? "gap-2" : "gap-4")}>
              <div className={cn("bg-white/5 border border-white/10", isLandscapeMobile ? "p-3 rounded-xl space-y-1" : "p-6 rounded-[2rem] space-y-2")}>
                <Label htmlFor="ai-voice-profile" className={cn("font-bold", isLandscapeMobile ? "text-xs" : "text-base")}>Voice Profile</Label>
                {isVoiceOutputSupported ? (
                  <>
                    <select
                      id="ai-voice-profile"
                      value={selectedVoiceIndex >= 0 ? String(selectedVoiceIndex) : ''}
                      onChange={handleVoiceSelection}
                      className={cn("w-full rounded-md border border-white/20 bg-black/40 px-3", isLandscapeMobile ? "h-9 text-sm" : "h-11 text-base")}
                    >
                      <option value="">System default</option>
                      {availableVoices.map((voice, index) => (
                        <option key={`${voice.name}-${voice.lang}-${index}`} value={String(index)}>
                          {voice.name} ({voice.lang}){voice.provider === 'android-native' ? ' • Android' : ' • Browser'}
                        </option>
                      ))}
                    </select>
                    {isVoiceCatalogLoading ? (
                      <div className={cn("rounded-md border border-white/10 bg-white/5 text-white/70", isLandscapeMobile ? "p-2 text-[10px]" : "p-3 text-xs")}>
                        Loading installed voice profiles from the device...
                      </div>
                    ) : availableVoices.length === 0 ? (
                      <div className={cn("rounded-md border border-white/10 bg-white/5 text-white/70", isLandscapeMobile ? "p-2 text-[10px]" : "p-3 text-xs")}>
                        No named voice profiles were exposed by this device. VelocityOS will still use the system default voice output when available.
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className={cn("rounded-md border border-amber-400/40 bg-amber-500/10 text-amber-200", isLandscapeMobile ? "p-2 text-[10px]" : "p-3 text-xs")}>Voice output is unavailable on this device right now.</div>
                )}
                <p className={cn("text-muted-foreground", isLandscapeMobile ? "text-[10px]" : "text-xs")}>Choose any installed system voice profile</p>
              </div>

              <div className={cn("bg-white/5 border border-white/10", isLandscapeMobile ? "p-3 rounded-xl space-y-1" : "p-6 rounded-[2rem] space-y-2")}>
                <Label htmlFor="ai-voice-lang" className={cn("font-bold", isLandscapeMobile ? "text-xs" : "text-base")}>Language Fallback</Label>
                <Input
                  id="ai-voice-lang"
                  value={aiVoiceLangDraft}
                  onChange={(event) => setAiVoiceLangDraft(event.target.value)}
                  onBlur={commitAiVoiceLang}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.currentTarget.blur();
                    }
                  }}
                  className={cn("bg-black/40 border-white/20", isLandscapeMobile ? "h-9 text-sm" : "h-11 text-lg")}
                />
                <p className={cn("text-muted-foreground", isLandscapeMobile ? "text-[10px]" : "text-xs")}>Used when the selected voice is unavailable (example: en-US)</p>
              </div>
            </div>

            <div className={cn("grid grid-cols-1 md:grid-cols-3", isLandscapeMobile ? "gap-2" : "gap-4")}>
              <div className={cn("bg-white/5 border border-white/10", isLandscapeMobile ? "p-3 rounded-xl space-y-1" : "p-5 rounded-[1.5rem] space-y-2")}>
                <div className="flex items-center justify-between">
                  <Label htmlFor="ai-voice-rate" className={cn("font-bold", isLandscapeMobile ? "text-xs" : "text-sm")}>Rate</Label>
                  <span className={cn("font-black tabular-nums", isLandscapeMobile ? "text-[10px]" : "text-xs")}>{aiVoiceRate.toFixed(2)}x</span>
                </div>
                <input
                  id="ai-voice-rate"
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.05}
                  value={aiVoiceRate}
                  onChange={(event) => {
                    void updateSettings({ aiVoiceRate: Number(event.target.value) });
                  }}
                  className="w-full"
                />
              </div>

              <div className={cn("bg-white/5 border border-white/10", isLandscapeMobile ? "p-3 rounded-xl space-y-1" : "p-5 rounded-[1.5rem] space-y-2")}>
                <div className="flex items-center justify-between">
                  <Label htmlFor="ai-voice-pitch" className={cn("font-bold", isLandscapeMobile ? "text-xs" : "text-sm")}>Pitch</Label>
                  <span className={cn("font-black tabular-nums", isLandscapeMobile ? "text-[10px]" : "text-xs")}>{aiVoicePitch.toFixed(2)}</span>
                </div>
                <input
                  id="ai-voice-pitch"
                  type="range"
                  min={0}
                  max={2}
                  step={0.05}
                  value={aiVoicePitch}
                  onChange={(event) => {
                    void updateSettings({ aiVoicePitch: Number(event.target.value) });
                  }}
                  className="w-full"
                />
              </div>

              <div className={cn("bg-white/5 border border-white/10", isLandscapeMobile ? "p-3 rounded-xl space-y-1" : "p-5 rounded-[1.5rem] space-y-2")}>
                <div className="flex items-center justify-between">
                  <Label htmlFor="ai-voice-volume" className={cn("font-bold", isLandscapeMobile ? "text-xs" : "text-sm")}>Volume</Label>
                  <span className={cn("font-black tabular-nums", isLandscapeMobile ? "text-[10px]" : "text-xs")}>{aiVoiceVolume.toFixed(2)}</span>
                </div>
                <input
                  id="ai-voice-volume"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={aiVoiceVolume}
                  onChange={(event) => {
                    void updateSettings({ aiVoiceVolume: Number(event.target.value) });
                  }}
                  className="w-full"
                />
              </div>
            </div>

            <div className={cn("bg-white/5 border border-white/10", isLandscapeMobile ? "p-3 rounded-xl space-y-2" : "p-6 rounded-[2rem] space-y-3")}>
              <Label htmlFor="ai-voice-preview" className={cn("font-bold", isLandscapeMobile ? "text-xs" : "text-base")}>Voice Preview Text</Label>
              <Input
                id="ai-voice-preview"
                value={voicePreviewText}
                onChange={(event) => setVoicePreviewText(event.target.value)}
                className={cn("bg-black/40 border-white/20", isLandscapeMobile ? "h-9 text-sm" : "h-11 text-lg")}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => { void previewAiVoice(); }}
                  className={cn("font-black", isLandscapeMobile ? "h-9 text-xs rounded-lg" : "h-11 text-sm rounded-xl")}
                >
                  <Play className="w-4 h-4" />
                  Preview Voice
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={stopAiVoice}
                  className={cn("font-black border-white/20 bg-white/5", isLandscapeMobile ? "h-9 text-xs rounded-lg" : "h-11 text-sm rounded-xl")}
                >
                  <Square className="w-4 h-4" />
                  Stop
                </Button>
              </div>
            </div>

            <div className={cn("grid grid-cols-1 md:grid-cols-2", isLandscapeMobile ? "gap-2" : "gap-4")}>
              <div className={cn("bg-white/5 border border-white/10", isLandscapeMobile ? "p-3 rounded-xl space-y-1" : "p-6 rounded-[2rem] space-y-2")}>
                <Label htmlFor="ollama-base-url" className={cn("font-bold", isLandscapeMobile ? "text-xs" : "text-base")}>Ollama Base URL</Label>
                <Input
                  id="ollama-base-url"
                  value={ollamaBaseUrlDraft}
                  onChange={(event) => setOllamaBaseUrlDraft(event.target.value)}
                  onBlur={commitAiSettings}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.currentTarget.blur();
                    }
                  }}
                  className={cn("bg-black/40 border-white/20", isLandscapeMobile ? "h-9 text-sm" : "h-11 text-lg")}
                />
                {isLoopbackOllamaBaseUrl(ollamaBaseUrlDraft) ? (
                  <div className={cn("rounded-md border border-amber-400/35 bg-amber-500/10 text-amber-100", isLandscapeMobile ? "p-2 text-[10px]" : "p-3 text-xs")}>
                    On a phone, 127.0.0.1 points at the phone itself. Use the LAN IP of the computer running Ollama instead.
                  </div>
                ) : (
                  <p className={cn("text-muted-foreground", isLandscapeMobile ? "text-[10px]" : "text-xs")}>Example: http://192.168.1.25:11434</p>
                )}
              </div>

              <div className={cn("bg-white/5 border border-white/10", isLandscapeMobile ? "p-3 rounded-xl space-y-1" : "p-6 rounded-[2rem] space-y-2")}>
                <Label htmlFor="ollama-model" className={cn("font-bold", isLandscapeMobile ? "text-xs" : "text-base")}>Ollama Model</Label>
                <Input
                  id="ollama-model"
                  value={ollamaModelDraft}
                  onChange={(event) => setOllamaModelDraft(event.target.value)}
                  onBlur={commitAiSettings}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.currentTarget.blur();
                    }
                  }}
                  className={cn("bg-black/40 border-white/20", isLandscapeMobile ? "h-9 text-sm" : "h-11 text-lg")}
                />
                <p className={cn("text-muted-foreground", isLandscapeMobile ? "text-[10px]" : "text-xs")}>Example: llama3.2</p>
              </div>
            </div>

            <div className={cn("flex items-center justify-between bg-white/5 border border-white/10", isLandscapeMobile ? "p-3 rounded-xl" : "p-5 rounded-[1.5rem]")}>
              <div className="flex items-center gap-2">
                <Server className={cn(isLandscapeMobile ? "w-4 h-4" : "w-5 h-5")} />
                <span className={cn("font-bold uppercase tracking-wide", isLandscapeMobile ? "text-[10px]" : "text-xs")}>Local Storage Mode</span>
              </div>
              <span className={cn("font-black uppercase", isLandscapeMobile ? "text-[10px]" : "text-xs")}>AI chat history saved on-device</span>
            </div>
          </section>
          </div>
          <div id="settings-health" className={cn(isLandscapeMobile ? "space-y-3" : "space-y-8")}>
            <div className="space-y-1">
              <div className={cn("font-black uppercase tracking-[0.22em] text-primary/75", isLandscapeMobile ? "text-[10px]" : "text-xs")}>System Health</div>
              <h2 className={cn("font-black tracking-tight", isLandscapeMobile ? "text-xl" : "text-3xl")}>Keep the car app operational</h2>
              <p className={cn("text-muted-foreground", isLandscapeMobile ? "text-[11px]" : "text-sm")}>Native monitor readiness, hardware state, installation, and recovery actions.</p>
            </div>
            <SystemStatusHub
              variant="hub"
              gpsStatus={gpsStatus}
              network={network}
              micEnabled={aiVoiceControlEnabled}
              isSharingLive={isSharingLive}
              trackingId={trackingId}
              nativeMonitorConfig={monitorConfig}
              isLandscapeMobile={isLandscapeMobile}
            />
          <section className={cn("dashboard-card", isLandscapeMobile ? "space-y-3" : "space-y-8")}>
            <div className="flex items-center gap-4">
              <Gauge className={cn("text-primary", isLandscapeMobile ? "w-5 h-5" : "w-12 h-12")} />
              <div>
                <h2 className={cn("font-bold", isLandscapeMobile ? "text-base" : "text-3xl")}>Speed Auto-Open Monitor</h2>
                <p className={cn("text-muted-foreground", isLandscapeMobile ? "text-xs" : "text-lg")}>Configure the native speed trigger used to reopen the dashboard while driving</p>
              </div>
            </div>

            {!isNativeMonitorAvailable && (
              <div className={cn("border border-amber-400/40 bg-amber-500/10 text-amber-200", isLandscapeMobile ? "rounded-xl p-2 text-[11px]" : "rounded-3xl p-5 text-sm")}>
                Android native monitor controls are unavailable on this platform. Draft values are stored locally for preview.
              </div>
            )}

            {isMonitorLoading ? (
              <div className={cn("bg-white/5 border border-white/10 text-muted-foreground", isLandscapeMobile ? "p-3 rounded-xl text-xs" : "p-6 rounded-[2rem]")}>Loading native monitor configuration...</div>
            ) : monitorConfig ? (
              <>
                <div className={cn("grid grid-cols-1 md:grid-cols-2", isLandscapeMobile ? "gap-2" : "gap-4")}>
                  <div className={cn("flex items-center justify-between bg-white/5 border border-white/10", isLandscapeMobile ? "p-3 rounded-xl" : "p-6 rounded-[2rem]")}>
                    <div>
                      <p className={cn("font-bold", isLandscapeMobile ? "text-sm" : "text-xl")}>Monitor Enabled</p>
                      <p className={cn("text-muted-foreground", isLandscapeMobile ? "text-[11px]" : "text-sm")}>Run native speed checks in the background</p>
                    </div>
                    <Switch
                      checked={monitorConfig.enabled}
                      onCheckedChange={(value) => void applyMonitorPatch({ enabled: value })}
                      className={cn(isLandscapeMobile ? "scale-95" : "scale-125")}
                    />
                  </div>
                  <div className={cn("flex items-center justify-between bg-white/5 border border-white/10", isLandscapeMobile ? "p-3 rounded-xl" : "p-6 rounded-[2rem]")}>
                    <div>
                      <p className={cn("font-bold", isLandscapeMobile ? "text-sm" : "text-xl")}>Strict Auto-Open</p>
                      <p className={cn("text-muted-foreground", isLandscapeMobile ? "text-[11px]" : "text-sm")}>Requires default launcher or device-owner privileges</p>
                    </div>
                    <Switch
                      checked={monitorConfig.strictAutoOpen}
                      onCheckedChange={(value) => void applyMonitorPatch({ strictAutoOpen: value })}
                      className={cn(isLandscapeMobile ? "scale-95" : "scale-125")}
                    />
                  </div>
                </div>

                <div className={cn("grid grid-cols-1 md:grid-cols-2", isLandscapeMobile ? "gap-2" : "gap-4")}>
                  <div className={cn("bg-white/5 border border-white/10", isLandscapeMobile ? "p-3 rounded-xl space-y-1" : "p-6 rounded-[2rem] space-y-2")}>
                    <Label htmlFor="speed-threshold-kph" className={cn("font-bold", isLandscapeMobile ? "text-xs" : "text-base")}>Speed Threshold (km/h)</Label>
                    <Input
                      id="speed-threshold-kph"
                      type="number"
                      min={NATIVE_MONITOR_LIMITS.threshold.min}
                      max={NATIVE_MONITOR_LIMITS.threshold.max}
                      step={1}
                      value={Math.round(monitorConfig.thresholdKph)}
                      onChange={(event) => {
                        const next = Number.parseFloat(event.target.value);
                        if (Number.isFinite(next)) {
                          void applyMonitorPatch({
                            thresholdKph: Math.max(
                              NATIVE_MONITOR_LIMITS.threshold.min,
                              Math.min(NATIVE_MONITOR_LIMITS.threshold.max, next)
                            ),
                          });
                        }
                      }}
                      className={cn("bg-black/40 border-white/20", isLandscapeMobile ? "h-9 text-sm" : "h-11 text-lg")}
                    />
                    <p className={cn("text-muted-foreground", isLandscapeMobile ? "text-[10px]" : "text-xs")}>Range: {NATIVE_MONITOR_LIMITS.threshold.min}-{NATIVE_MONITOR_LIMITS.threshold.max} km/h</p>
                  </div>
                  <div className={cn("bg-white/5 border border-white/10", isLandscapeMobile ? "p-3 rounded-xl space-y-1" : "p-6 rounded-[2rem] space-y-2")}>
                    <Label htmlFor="alert-cooldown-seconds" className={cn("font-bold", isLandscapeMobile ? "text-xs" : "text-base")}>Cooldown (seconds)</Label>
                    <Input
                      id="alert-cooldown-seconds"
                      type="number"
                      min={NATIVE_MONITOR_LIMITS.cooldown.min}
                      max={NATIVE_MONITOR_LIMITS.cooldown.max}
                      step={1}
                      value={monitorConfig.cooldownSeconds}
                      onChange={(event) => {
                        const next = Number.parseInt(event.target.value, 10);
                        if (Number.isFinite(next)) {
                          void applyMonitorPatch({
                            cooldownSeconds: Math.max(
                              NATIVE_MONITOR_LIMITS.cooldown.min,
                              Math.min(NATIVE_MONITOR_LIMITS.cooldown.max, next)
                            ),
                          });
                        }
                      }}
                      className={cn("bg-black/40 border-white/20", isLandscapeMobile ? "h-9 text-sm" : "h-11 text-lg")}
                    />
                    <p className={cn("text-muted-foreground", isLandscapeMobile ? "text-[10px]" : "text-xs")}>Range: {NATIVE_MONITOR_LIMITS.cooldown.min}-{NATIVE_MONITOR_LIMITS.cooldown.max} seconds</p>
                  </div>
                </div>

                <div className={cn("grid grid-cols-1 md:grid-cols-3", isLandscapeMobile ? "gap-2" : "gap-4")}>
                  <div className={cn("flex items-center justify-between border", isLandscapeMobile ? "p-3 rounded-xl" : "p-5 rounded-[1.5rem]", strictPrivilegeReady ? "border-green-500/40 bg-green-500/10" : "border-amber-500/40 bg-amber-500/10")}>
                    <div className="flex items-center gap-2">
                      {strictPrivilegeReady ? <ShieldCheck className={cn(isLandscapeMobile ? "w-4 h-4" : "w-5 h-5")} /> : <ShieldAlert className={cn(isLandscapeMobile ? "w-4 h-4" : "w-5 h-5")} />}
                      <span className={cn("font-bold uppercase tracking-wide", isLandscapeMobile ? "text-[10px]" : "text-xs")}>Strict Readiness</span>
                    </div>
                    <span className={cn("font-black uppercase", isLandscapeMobile ? "text-[10px]" : "text-xs")}>{strictPrivilegeReady ? 'Ready' : 'Missing Role'}</span>
                  </div>
                  <div className={cn("flex items-center justify-between bg-white/5 border border-white/10", isLandscapeMobile ? "p-3 rounded-xl" : "p-5 rounded-[1.5rem]")}>
                    <span className={cn("font-bold uppercase tracking-wide", isLandscapeMobile ? "text-[10px]" : "text-xs")}>Device Owner</span>
                    <span className={cn("font-black", isLandscapeMobile ? "text-[10px]" : "text-xs")}>{monitorConfig.isDeviceOwner ? 'Yes' : 'No'}</span>
                  </div>
                  <div className={cn("flex items-center justify-between bg-white/5 border border-white/10", isLandscapeMobile ? "p-3 rounded-xl" : "p-5 rounded-[1.5rem]")}>
                    <span className={cn("font-bold uppercase tracking-wide", isLandscapeMobile ? "text-[10px]" : "text-xs")}>Default Launcher</span>
                    <span className={cn("font-black", isLandscapeMobile ? "text-[10px]" : "text-xs")}>{monitorConfig.isDefaultLauncher ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                <div className={cn("grid grid-cols-1 md:grid-cols-3", isLandscapeMobile ? "gap-2" : "gap-4")}>
                  <Button
                    variant="outline"
                    onClick={handleRequestMonitorPermissions}
                    disabled={isMonitorActionBusy || isMonitorSaving}
                    className={cn("font-black border-white/20 bg-white/5", isLandscapeMobile ? "h-10 rounded-lg text-xs" : "h-14 rounded-2xl text-base")}
                  >
                    Request Permissions
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleOpenHomeSettings}
                    disabled={!isNativeMonitorAvailable || isMonitorSaving}
                    className={cn("font-black border-white/20 bg-white/5", isLandscapeMobile ? "h-10 rounded-lg text-xs" : "h-14 rounded-2xl text-base")}
                  >
                    Open Home App Settings
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleOpenAppSettings}
                    disabled={!isNativeMonitorAvailable || isMonitorSaving}
                    className={cn("font-black border-white/20 bg-white/5", isLandscapeMobile ? "h-10 rounded-lg text-xs" : "h-14 rounded-2xl text-base")}
                  >
                    Open App Settings
                  </Button>
                </div>

                <div className={cn("flex items-center justify-between border border-white/10 bg-white/5", isLandscapeMobile ? "p-2 rounded-lg" : "p-4 rounded-2xl")}>
                  <span className={cn("font-bold uppercase tracking-wide", isLandscapeMobile ? "text-[10px]" : "text-xs")}>Monitor Autosave</span>
                  <span className={cn("font-black uppercase", isLandscapeMobile ? "text-[10px]" : "text-xs")}>
                    {isMonitorSaving
                      ? 'Saving'
                      : monitorSaveState === 'error'
                        ? 'Retry Needed'
                        : monitorSaveState === 'saved'
                          ? 'Saved'
                          : 'Idle'}
                  </span>
                </div>
              </>
            ) : (
              <div className={cn("bg-destructive/15 border border-destructive/40 text-destructive", isLandscapeMobile ? "p-3 rounded-xl text-xs" : "p-6 rounded-[2rem] text-sm")}>Native monitor configuration is unavailable right now.</div>
            )}
          </section>
          <section className={cn("dashboard-card", isLandscapeMobile ? "space-y-3" : "space-y-8")}>
            <div className="flex items-center gap-4">
              <Info className={cn("text-primary", isLandscapeMobile ? "w-5 h-5" : "w-12 h-12")} />
              <h2 className={cn("font-bold", isLandscapeMobile ? "text-base" : "text-3xl")}>Hardware & Status</h2>
            </div>
            <div className={cn("grid grid-cols-1 md:grid-cols-2", isLandscapeMobile ? "gap-2" : "gap-6")}>
              <div className={cn("flex items-center justify-between gap-3 bg-white/5 border border-white/10", isLandscapeMobile ? "p-3 rounded-xl" : "p-6 rounded-[2rem]")}>
                <div>
                  <span className={cn("font-bold", isLandscapeMobile ? "text-sm" : "text-xl")}>Parked learning mode</span>
                  <p className={cn("text-muted-foreground", isLandscapeMobile ? "text-[11px] mt-1" : "text-sm mt-2")}>
                    {parkedDemoStatus === 'completed'
                      ? 'Replay the onboarding flow any time you want a safe walkthrough of navigation, voice, themes, and media.'
                      : parkedDemoStatus === 'dismissed'
                        ? 'The guided demo is ready to resume the next time you want a parked walkthrough.'
                        : 'Finish the parked demo before driving to learn the core cockpit controls.'}
                  </p>
                </div>
                <Button
                  onClick={openParkedDemo}
                  className={cn("font-black shrink-0", isLandscapeMobile ? "h-10 rounded-lg px-3 text-xs" : "h-12 rounded-2xl px-5 text-sm")}
                >
                  {parkedDemoStatus === 'completed' ? 'Replay Demo' : parkedDemoStatus === 'dismissed' ? 'Resume Demo' : 'Start Demo'}
                </Button>
              </div>
              <div className={cn("flex items-center justify-between bg-white/5 border border-white/10", isLandscapeMobile ? "p-3 rounded-xl" : "p-6 rounded-[2rem]")}>
                <div>
                  <span className={cn("font-bold", isLandscapeMobile ? "text-sm" : "text-xl")}>Stay Awake API</span>
                  <p className={cn("text-muted-foreground", isLandscapeMobile ? "text-[11px] mt-1" : "text-sm mt-2")}>
                    {isParked ? 'Ready to keep the dashboard active during setup and demos.' : 'Screen wake support stays available while the car is moving.'}
                  </p>
                </div>
                {'wakeLock' in navigator ? (
                  <div className={cn("flex items-center text-green-500 font-black uppercase", isLandscapeMobile ? "gap-2 text-xs" : "gap-3")}><CheckCircle className={cn(isLandscapeMobile ? "w-4 h-4" : "w-6 h-6")} /> Ready</div>
                ) : (
                  <div className={cn("flex items-center text-muted-foreground font-black uppercase", isLandscapeMobile ? "gap-2 text-xs" : "gap-3")}><XCircle className={cn(isLandscapeMobile ? "w-4 h-4" : "w-6 h-6")} /> Blocked</div>
                )}
              </div>
            </div>
            {isInstallable && (
              <Button onClick={install} className={cn("w-full font-black bg-primary shadow-glow-lg", isLandscapeMobile ? "h-10 rounded-lg text-xs gap-1.5" : "h-24 rounded-[2rem] text-3xl gap-4")}>
                <Download className={cn(isLandscapeMobile ? "w-4 h-4" : "w-8 h-8")} />
                Install VelocityOS Native
              </Button>
            )}
          </section>
          <section className={cn("dashboard-card flex items-center justify-between border-destructive/40 bg-destructive/10", isLandscapeMobile ? "p-2.5" : "p-10")}>
            <div className={cn("flex items-center", isLandscapeMobile ? "gap-3" : "gap-8")}>
              <div className={cn("bg-destructive/20", isLandscapeMobile ? "p-2 rounded-lg" : "p-6 rounded-[2rem]")}>
                <LogOut className={cn("text-destructive", isLandscapeMobile ? "w-5 h-5" : "w-12 h-12")} />
              </div>
              <div>
                <h2 className={cn("font-bold text-destructive", isLandscapeMobile ? "text-sm" : "text-3xl")}>Factory Reset</h2>
                <p className={cn("text-muted-foreground font-medium", isLandscapeMobile ? "text-xs" : "text-xl")}>Clear all saved locations, history, and system settings</p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="lg" className={cn("font-black", isLandscapeMobile ? "rounded-lg h-10 px-3 text-xs" : "rounded-3xl h-20 px-12 text-2xl")} disabled={isLoading}>
                  {isLoading ? "Purging..." : "Reset System"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-zinc-950 border-white/20 text-white rounded-[3rem] p-12 max-w-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-4xl font-black mb-4">Confirm System Reset?</AlertDialogTitle>
                  <AlertDialogDescription className="text-xl text-muted-foreground leading-relaxed">
                    This will permanently erase your preferences, saved destinations, and navigation history. This operation is irreversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-8 gap-4">
                  <AlertDialogCancel className="bg-zinc-900 border-white/10 rounded-2xl h-16 text-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset} className="bg-destructive text-white hover:bg-destructive/90 rounded-2xl h-16 text-xl font-black">
                    Erase All Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>
          </div>
        </div>
        <footer className={cn("text-center text-muted-foreground flex flex-col items-center justify-center opacity-40", isLandscapeMobile ? "gap-2 pb-2" : "gap-4 pb-12")}>
          <div className="flex items-center gap-3">
             <Info className={cn(isLandscapeMobile ? "w-4 h-4" : "w-6 h-6")} />
             <span className={cn("uppercase font-black tracking-[0.4em]", isLandscapeMobile ? "text-[10px]" : "text-lg")}>VelocityOS Engine v1.2.0 Production</span>
          </div>
          <p className={cn("font-medium", isLandscapeMobile ? "text-[10px]" : "text-sm")}>© 2025 Booster Systems Inc. | Safety First Protocol Active</p>
        </footer>
      </div>
    </CarLayout>
  );
}