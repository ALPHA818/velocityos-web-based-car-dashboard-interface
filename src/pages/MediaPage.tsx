import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CarLayout } from '@/components/layout/CarLayout';
import {
  MEDIA_SOURCE_OPTIONS,
  getMediaDisplay,
  isLibraryMediaSource,
  useMediaStore,
  type MediaSourceId,
} from '@/store/use-media-store';
import { useOSStore } from '@/store/use-os-store';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Map as MapIcon,
  Radio,
  Headphones,
  Music2,
  ExternalLink,
  Link2,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useIsLandscapeMobile } from '@/hooks/use-landscape-mobile';
import { getAmbientEffectById, getScenePackById, getWidgetSkinById } from '@/lib/cosmetic-market';
import { SystemStatePanel } from '@/components/system/SystemStatePanel';
import {
  APP_INTEGRATION_TITLES,
  canOpenIntegrationInsideApp,
  isIntegratedMusicSourceId,
  launchConnectedApp,
  loadAppIntegrationState,
  openConnectedAppInsideApp,
  saveAppIntegrationState,
  type AppIntegrationState,
  type InsideAppPresentation,
  type IntegratedMusicSourceId,
} from '@/lib/app-integrations';

const SOURCE_ICONS: Record<MediaSourceId, React.ElementType> = {
  library: Radio,
  spotify: Headphones,
  youtubeMusic: Music2,
};

export function MediaPage() {
  const navigate = useNavigate();
  const activeSource = useMediaStore((s) => s.activeSource);
  const isPlaying = useMediaStore((s) => s.isPlaying);
  const currentTrackIndex = useMediaStore((s) => s.currentTrackIndex);
  const volume = useMediaStore((s) => s.volume);
  const progress = useMediaStore((s) => s.progress);
  const duration = useMediaStore((s) => s.duration);
  const setActiveSource = useMediaStore((s) => s.setActiveSource);
  const togglePlay = useMediaStore((s) => s.togglePlay);
  const nextTrack = useMediaStore((s) => s.nextTrack);
  const prevTrack = useMediaStore((s) => s.prevTrack);
  const setProgress = useMediaStore((s) => s.setProgress);
  const setVolume = useMediaStore((s) => s.setVolume);
  const openMap = useOSStore((s) => s.openMap);
  const activeScenePackId = useOSStore((s) => s.activeScenePackId);
  const activeAmbientEffectId = useOSStore((s) => s.activeAmbientEffectId);
  const activeWidgetSkinId = useOSStore((s) => s.activeWidgetSkinId);
  const isLandscapeMobile = useIsLandscapeMobile();
  const isLibrarySource = isLibraryMediaSource(activeSource);
  const media = getMediaDisplay(activeSource, currentTrackIndex);
  const activeScene = getScenePackById(activeScenePackId) ?? getScenePackById('scene-garage-grid');
  const activeAmbientEffect = getAmbientEffectById(activeAmbientEffectId) ?? getAmbientEffectById('effect-clear-air');
  const activeWidgetSkin = getWidgetSkinById(activeWidgetSkinId) ?? getWidgetSkinById('widget-core-digital');
  const [integrations, setIntegrations] = React.useState<Record<IntegratedMusicSourceId, AppIntegrationState>>(() => {
    const loaded = loadAppIntegrationState();
    return {
      spotify: loaded.spotify,
      youtubeMusic: loaded.youtubeMusic,
    };
  });

  React.useEffect(() => {
    const refreshIntegrations = () => {
      const loaded = loadAppIntegrationState();
      setIntegrations({
        spotify: loaded.spotify,
        youtubeMusic: loaded.youtubeMusic,
      });
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshIntegrations();
      }
    };

    refreshIntegrations();
    window.addEventListener('storage', refreshIntegrations);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', refreshIntegrations);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const activeIntegrationId = isIntegratedMusicSourceId(activeSource) ? activeSource : null;
  const activeIntegration = activeIntegrationId ? integrations[activeIntegrationId] : null;
  const activeWebUrl = activeIntegration?.webUrl.trim() ?? '';
  const activeIntegrationTitle = activeIntegrationId ? APP_INTEGRATION_TITLES[activeIntegrationId] : media.title;

  const widgetTone = activeWidgetSkin?.style === 'retro'
    ? {
        card: 'border-amber-300/20 bg-amber-950/18 text-amber-100',
        softCard: 'border-amber-200/18 bg-amber-100/8 text-amber-100',
        title: 'font-mono text-amber-100 tracking-[0.04em]',
        subtitle: 'font-mono text-amber-200/70',
        chip: 'border-amber-200/25 bg-amber-100/10 text-amber-200',
        button: 'border-amber-200/22 bg-amber-100/10 text-amber-100 hover:bg-amber-100/15',
        primary: 'border-amber-300/35 bg-amber-500/15 text-amber-100 hover:bg-amber-500/20',
      }
    : activeWidgetSkin?.style === 'motorsport'
      ? {
          card: 'border-rose-300/18 bg-zinc-950/42 text-rose-50',
          softCard: 'border-rose-200/18 bg-rose-500/10 text-rose-50',
          title: 'text-rose-50 tracking-tight',
          subtitle: 'text-rose-100/65',
          chip: 'border-rose-300/22 bg-rose-500/10 text-rose-200',
          button: 'border-rose-200/18 bg-rose-500/10 text-rose-100 hover:bg-rose-500/15',
          primary: 'border-rose-300/35 bg-rose-500/15 text-rose-100 hover:bg-rose-500/20',
        }
      : activeWidgetSkin?.style === 'luxury'
        ? {
            card: 'border-white/15 bg-stone-950/46 text-amber-50',
            softCard: 'border-amber-100/15 bg-white/10 text-amber-50',
            title: 'font-serif text-amber-50',
            subtitle: 'font-serif text-amber-100/65',
            chip: 'border-amber-100/18 bg-white/10 text-amber-100',
            button: 'border-amber-100/15 bg-white/10 text-amber-50 hover:bg-white/15',
            primary: 'border-amber-100/22 bg-amber-100/12 text-amber-50 hover:bg-amber-100/18',
          }
        : activeWidgetSkin?.style === 'cyber'
          ? {
              card: 'border-emerald-400/18 bg-emerald-950/20 text-emerald-50',
              softCard: 'border-emerald-300/18 bg-emerald-500/10 text-emerald-50',
              title: 'font-mono text-emerald-100 tracking-[0.05em]',
              subtitle: 'font-mono text-cyan-200/72',
              chip: 'border-emerald-300/24 bg-emerald-500/10 text-emerald-200',
              button: 'border-emerald-300/18 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15',
              primary: 'border-cyan-300/24 bg-cyan-500/12 text-cyan-100 hover:bg-cyan-500/18',
            }
          : activeWidgetSkin?.style === 'expedition'
            ? {
                card: 'border-lime-300/18 bg-lime-950/18 text-lime-50',
                softCard: 'border-lime-200/18 bg-lime-500/10 text-lime-50',
                title: 'font-mono text-lime-50 tracking-[0.04em]',
                subtitle: 'font-mono text-lime-100/72',
                chip: 'border-lime-200/24 bg-lime-500/10 text-lime-200',
                button: 'border-lime-200/18 bg-lime-500/10 text-lime-100 hover:bg-lime-500/15',
                primary: 'border-teal-300/24 bg-teal-500/12 text-teal-100 hover:bg-teal-500/18',
              }
            : {
                card: 'border-white/10 bg-black/28 text-foreground',
                softCard: 'border-white/10 bg-white/5 text-foreground',
                title: 'text-foreground',
                subtitle: 'text-muted-foreground',
                chip: 'border-white/10 bg-white/5 text-muted-foreground',
                button: 'border-white/10 bg-white/5 text-foreground hover:bg-white/10',
                primary: 'border-primary/35 bg-primary/15 text-primary hover:bg-primary/20',
              };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const launchSelectedSource = () => {
    if (!activeIntegrationId || !activeIntegration) return;
    launchConnectedApp(activeIntegration);
  };

  const openSelectedSourceInsideApp = (presentation: InsideAppPresentation = 'preview') => {
    if (!activeIntegrationId || !activeIntegration) return;
    void openConnectedAppInsideApp(activeIntegration, {
      title: activeIntegrationTitle,
      presentation,
    });
  };

  const openSelectedSourceWeb = () => {
    if (!activeIntegrationId) return;
    if (!activeWebUrl) return;
    window.location.assign(activeWebUrl);
  };

  const patchActiveIntegration = (patch: Partial<AppIntegrationState>) => {
    if (!activeIntegrationId) return;

    setIntegrations((prev) => {
      const nextForSource = {
        ...prev[activeIntegrationId],
        ...patch,
      };

      const next = {
        ...prev,
        [activeIntegrationId]: nextForSource,
      };

      const persisted = loadAppIntegrationState();
      saveAppIntegrationState({
        ...persisted,
        [activeIntegrationId]: {
          ...persisted[activeIntegrationId],
          ...nextForSource,
        },
      });

      return next;
    });
  };

  return (
    <CarLayout>
      <div className={cn('relative h-full overflow-hidden', isLandscapeMobile ? 'space-y-3' : 'space-y-8')}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-70 blur-3xl" style={{ background: `radial-gradient(circle at 18% 20%, ${activeScene?.accent ?? activeWidgetSkin?.accent ?? 'rgba(59,130,246,0.18)'} 0, transparent 44%)` }} />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className={cn('font-black tracking-tighter', isLandscapeMobile ? 'text-3xl' : 'text-6xl')}>Media</h1>
            <p className={cn('text-muted-foreground font-medium mt-2', isLandscapeMobile ? 'text-sm' : 'text-2xl')}>
              Pick the source that drives the media tab and the dashboard mini-player.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]', widgetTone.chip)}>{activeWidgetSkin?.label}</span>
              <span className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]', widgetTone.chip)}>{activeScene?.name}</span>
              <span className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]', widgetTone.chip)}>{activeAmbientEffect?.label}</span>
            </div>
          </div>
          <button
            onClick={() => openMap()}
            className={cn(
              'touch-target shrink-0 border transition-all',
              widgetTone.button,
              isLandscapeMobile ? 'p-1.5 rounded-lg' : 'p-6 rounded-3xl'
            )}
            aria-label="Open map"
            title="Open map"
          >
            <MapIcon className={cn(isLandscapeMobile ? 'w-4 h-4' : 'w-12 h-12')} />
          </button>
        </div>

        <div className={cn('grid', isLandscapeMobile ? 'grid-cols-3 gap-2' : 'grid-cols-1 md:grid-cols-3 gap-4')}>
          {MEDIA_SOURCE_OPTIONS.map((source) => {
            const Icon = SOURCE_ICONS[source.id];
            const isActive = activeSource === source.id;
            const integration = isIntegratedMusicSourceId(source.id) ? integrations[source.id] : null;

            return (
              <button
                key={source.id}
                type="button"
                onClick={() => setActiveSource(source.id)}
                className={cn(
                  'dashboard-card text-left transition-all border backdrop-blur-xl',
                  widgetTone.card,
                  isLandscapeMobile ? 'rounded-2xl p-3 space-y-2' : 'space-y-3'
                )}
                style={isActive
                  ? {
                      borderColor: activeWidgetSkin?.accent,
                      boxShadow: `0 18px 44px -30px ${activeScene?.glow ?? activeWidgetSkin?.accent ?? 'rgba(59,130,246,0.28)'}`,
                    }
                  : undefined}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className={cn(
                    'rounded-2xl border',
                    widgetTone.softCard,
                    isLandscapeMobile ? 'p-2' : 'p-3'
                  )}>
                    <Icon className={cn(isLandscapeMobile ? 'w-4 h-4' : 'w-6 h-6')} />
                  </div>
                  {integration?.connected && (
                    <span className={cn(
                      'rounded-full border border-emerald-400/40 bg-emerald-500/15 font-black uppercase tracking-wide text-emerald-200',
                      isLandscapeMobile ? 'px-2 py-1 text-[9px]' : 'px-3 py-1 text-[10px]'
                    )}>
                      Connected
                    </span>
                  )}
                </div>
                <div>
                  <div className={cn('font-black tracking-tight', widgetTone.title, isLandscapeMobile ? 'text-sm' : 'text-xl')}>
                    {source.label}
                  </div>
                  <div className={cn(widgetTone.subtitle, isLandscapeMobile ? 'text-[11px]' : 'text-sm')}>
                    {source.detail}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {isLibrarySource ? (
          <div className={cn(
            'h-full flex md:flex-row items-center',
            isLandscapeMobile ? 'flex-row gap-2.5 items-stretch' : 'flex-col gap-16'
          )}>
            <div className={cn(
              'aspect-square relative group rounded-[2rem] border p-3 backdrop-blur-xl',
              widgetTone.card,
              isLandscapeMobile ? 'w-[34%] max-w-[176px] self-center' : 'w-full md:w-1/2 max-w-[550px]'
            )} style={{ boxShadow: `0 22px 58px -34px ${activeScene?.glow ?? 'rgba(59,130,246,0.24)'}` }}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={`${activeSource}:${media.title}`}
                  initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 1.1, rotate: 5 }}
                  src={media.cover}
                  alt={media.title}
                  className={cn(
                    'w-full h-full object-cover shadow-2xl border border-white/10',
                    isLandscapeMobile ? 'rounded-2xl' : 'rounded-[4rem]'
                  )}
                />
              </AnimatePresence>
              {isPlaying && (
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="absolute -inset-8 bg-primary/25 blur-[100px] -z-10"
                />
              )}
            </div>

            <div className={cn('flex-1 w-full rounded-[2rem] border p-4 backdrop-blur-xl', widgetTone.card, isLandscapeMobile ? 'space-y-2.5' : 'space-y-10')}>
              <div className="flex justify-between items-start gap-3">
                <div className={cn(isLandscapeMobile ? 'space-y-1' : 'space-y-3')}>
                  <div className="flex flex-wrap gap-2">
                    <span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em]', widgetTone.chip)}>{activeWidgetSkin?.label}</span>
                    <span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em]', widgetTone.chip)}>{activeAmbientEffect?.label}</span>
                  </div>
                  <motion.h2
                    key={`${activeSource}:${media.title}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={cn(
                      'font-black tracking-tighter',
                      widgetTone.title,
                      isLandscapeMobile ? 'text-2xl' : 'text-7xl'
                    )}
                  >
                    {media.title}
                  </motion.h2>
                  <motion.p
                    key={`${activeSource}:${media.artist}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className={cn(
                      'font-semibold',
                      widgetTone.subtitle,
                      isLandscapeMobile ? 'text-sm' : 'text-4xl'
                    )}
                  >
                    {media.artist}
                  </motion.p>
                </div>
                <div className={cn(
                  'rounded-full border uppercase tracking-wide font-black',
                  widgetTone.chip,
                  isLandscapeMobile ? 'px-2.5 py-1 text-[9px]' : 'px-4 py-2 text-xs'
                )}>
                  Built-in Source
                </div>
              </div>

              <div className={cn(isLandscapeMobile ? 'space-y-3' : 'space-y-8')}>
                <Slider
                  value={[progress]}
                  max={100}
                  step={0.1}
                  className={cn(isLandscapeMobile ? 'h-2' : 'h-6')}
                  onValueChange={(vals) => setProgress(vals[0])}
                />
                <div className={cn('flex justify-between font-mono text-muted-foreground/60', isLandscapeMobile ? 'text-xs' : 'text-2xl')}>
                  <span>{formatTime((progress / 100) * duration)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className={cn('flex items-center justify-center', isLandscapeMobile ? 'gap-4' : 'gap-16')}>
                <button onClick={prevTrack} className="touch-target text-muted-foreground hover:text-foreground active:scale-90 transition-all">
                  <SkipBack className={cn('fill-current', isLandscapeMobile ? 'w-6 h-6' : 'w-20 h-20')} />
                </button>
                <button
                  onClick={togglePlay}
                  className={cn(
                    'rounded-full border flex items-center justify-center hover:scale-105 active:scale-95 transition-all',
                    widgetTone.primary,
                    isLandscapeMobile ? 'w-14 h-14' : 'w-40 h-40'
                  )}
                >
                  {isPlaying ? (
                    <Pause className={cn('fill-current', isLandscapeMobile ? 'w-7 h-7' : 'w-20 h-20')} />
                  ) : (
                    <Play className={cn('fill-current', isLandscapeMobile ? 'w-7 h-7 ml-1' : 'w-20 h-20 ml-3')} />
                  )}
                </button>
                <button onClick={nextTrack} className="touch-target text-muted-foreground hover:text-foreground active:scale-90 transition-all">
                  <SkipForward className={cn('fill-current', isLandscapeMobile ? 'w-6 h-6' : 'w-20 h-20')} />
                </button>
              </div>

              <div className={cn('flex items-center', isLandscapeMobile ? 'gap-3 px-0.5' : 'gap-10 px-8')}>
                <Volume2 className={cn('text-muted-foreground', isLandscapeMobile ? 'w-4 h-4' : 'w-10 h-10')} />
                <Slider
                  value={[volume * 100]}
                  max={100}
                  onValueChange={(vals) => setVolume(vals[0] / 100)}
                  className={cn('flex-1', isLandscapeMobile ? 'h-1.5' : 'h-4')}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className={cn(
            'grid items-start',
            isLandscapeMobile ? 'grid-cols-[280px_minmax(0,1fr)] gap-3' : 'grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-6'
          )}>
            <div className={cn(
              'dashboard-card space-y-3 border backdrop-blur-xl',
              widgetTone.card,
              isLandscapeMobile ? 'p-3 rounded-2xl' : 'p-5'
            )}>
              <div className={cn(
                'rounded-2xl border overflow-hidden',
                widgetTone.softCard,
                isLandscapeMobile ? 'p-3' : 'p-4'
              )}>
                <img
                  src={media.cover}
                  alt={media.title}
                  className={cn(
                    'rounded-[1.75rem] border border-white/10 object-cover mx-auto',
                    isLandscapeMobile ? 'w-28 h-28 rounded-2xl' : 'w-40 h-40'
                  )}
                />
                <div className="mt-4 text-center">
                  <div className={cn('uppercase tracking-wide font-black', widgetTone.subtitle, isLandscapeMobile ? 'text-[10px]' : 'text-xs')}>
                    Selected Source
                  </div>
                  <div className={cn('font-black mt-1', widgetTone.title, isLandscapeMobile ? 'text-2xl' : 'text-4xl')}>
                    {activeIntegrationTitle}
                  </div>
                  <div className={cn('mt-2', widgetTone.subtitle, isLandscapeMobile ? 'text-[11px]' : 'text-sm')}>
                    Open this source in a preview window, then switch it to full screen whenever you want.
                  </div>
                </div>
              </div>

              <div className={cn(
                'rounded-full border uppercase tracking-wide font-black mx-auto w-fit',
                activeIntegration?.connected
                  ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                  : 'border-white/15 bg-white/5 text-muted-foreground',
                isLandscapeMobile ? 'px-2.5 py-1 text-[9px]' : 'px-3 py-1.5 text-[10px]'
              )}>
                {activeIntegration?.connected ? 'Connected' : 'Needs setup'}
              </div>

              <div className="grid gap-2">
                <button
                  onClick={() => openSelectedSourceInsideApp('preview')}
                  disabled={!activeIntegration || !canOpenIntegrationInsideApp(activeIntegration)}
                  className={cn(
                    'rounded-2xl border font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                    widgetTone.button,
                    isLandscapeMobile ? 'px-3 py-2 text-[11px]' : 'px-4 py-3 text-sm'
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Preview Inside App
                  </span>
                </button>
                <button
                  onClick={() => openSelectedSourceInsideApp('fullscreen')}
                  disabled={!activeIntegration || !canOpenIntegrationInsideApp(activeIntegration)}
                  className={cn(
                    'rounded-2xl border font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                    widgetTone.button,
                    isLandscapeMobile ? 'px-3 py-2 text-[11px]' : 'px-4 py-3 text-sm'
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Open Full Screen
                  </span>
                </button>
                <button
                  onClick={launchSelectedSource}
                  disabled={!activeIntegration || (!activeIntegration.launchUrl.trim() && !activeIntegration.webUrl.trim())}
                  className={cn(
                    'rounded-2xl border font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                    widgetTone.primary,
                    isLandscapeMobile ? 'px-3 py-2 text-[11px]' : 'px-4 py-3 text-sm'
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Open App
                  </span>
                </button>
                <button
                  onClick={openSelectedSourceWeb}
                  disabled={!activeWebUrl}
                  className={cn(
                    'rounded-2xl border font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                    widgetTone.button,
                    isLandscapeMobile ? 'px-3 py-2 text-[11px]' : 'px-4 py-3 text-sm'
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Open Web
                  </span>
                </button>
                <button
                  onClick={() => patchActiveIntegration({ embedInPanel: !activeIntegration?.embedInPanel })}
                  disabled={!activeIntegration}
                  className={cn(
                    'rounded-2xl border font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                    widgetTone.button,
                    isLandscapeMobile ? 'px-3 py-2 text-[11px]' : 'px-4 py-3 text-sm'
                  )}
                >
                  {activeIntegration?.embedInPanel ? 'Hide Preview Panel' : 'Show Preview Panel'}
                </button>
                <button
                  onClick={() => navigate('/apps')}
                  className={cn(
                    'rounded-2xl border font-black transition-all',
                    widgetTone.button,
                    isLandscapeMobile ? 'px-3 py-2 text-[11px]' : 'px-4 py-3 text-sm'
                  )}
                >
                  Configure in Apps
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {!activeIntegration?.connected && (
                <SystemStatePanel
                  kind="info"
                  compact
                  eyebrow="Source setup"
                  title="This source needs setup"
                  message="Connect it in Apps if you want custom deep links, preview preferences, or fullscreen start behavior."
                  primaryAction={{ label: 'Open Apps', onClick: () => navigate('/apps') }}
                  className={cn(widgetTone.softCard, widgetTone.subtitle)}
                />
              )}

              {activeIntegration?.embedInPanel && activeWebUrl ? (
                <div className={cn('dashboard-card space-y-4 border backdrop-blur-xl', widgetTone.card)}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className={cn('uppercase tracking-wide font-black', widgetTone.subtitle, isLandscapeMobile ? 'text-[10px]' : 'text-xs')}>
                        Inside Velocity
                      </div>
                      <div className={cn('font-bold', widgetTone.title, isLandscapeMobile ? 'text-sm mt-1' : 'text-lg mt-1')}>
                        {activeIntegrationTitle} opens over the dashboard
                      </div>
                    </div>
                    <div className={cn(
                      'rounded-full border font-black uppercase tracking-wide',
                      widgetTone.chip,
                      isLandscapeMobile ? 'px-2 py-1 text-[9px]' : 'px-3 py-1.5 text-[10px]'
                    )}>
                      Preview Window
                    </div>
                  </div>
                  <div className={cn('grid', isLandscapeMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-3')}>
                    <button
                      onClick={() => openSelectedSourceInsideApp('preview')}
                      className={cn(
                        'w-full rounded-2xl border font-black transition-all',
                        widgetTone.button,
                        isLandscapeMobile ? 'px-3 py-3 text-sm' : 'px-4 py-4 text-base'
                      )}
                    >
                      <span className="inline-flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        Preview {activeIntegrationTitle}
                      </span>
                    </button>
                    <button
                      onClick={() => openSelectedSourceInsideApp('fullscreen')}
                      className={cn(
                        'w-full rounded-2xl border font-black transition-all',
                        widgetTone.button,
                        isLandscapeMobile ? 'px-3 py-3 text-sm' : 'px-4 py-4 text-base'
                      )}
                    >
                      <span className="inline-flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        Start Full Screen
                      </span>
                    </button>
                  </div>
                  <div className={cn(
                    'rounded-[2rem] border',
                    widgetTone.softCard,
                    isLandscapeMobile ? 'p-4 space-y-3' : 'p-6 space-y-4'
                  )}>
                    <div className={cn('rounded-[1.5rem] border', widgetTone.softCard, isLandscapeMobile ? 'p-4' : 'p-5')}>
                      <div className={cn('font-black tracking-tight', widgetTone.title, isLandscapeMobile ? 'text-lg' : 'text-2xl')}>
                        Open {activeIntegrationTitle} inside Velocity
                      </div>
                      <div className={cn('mt-2', widgetTone.subtitle, isLandscapeMobile ? 'text-[11px]' : 'text-sm')}>
                        Music providers often block iframe playback. Velocity opens the selected source in a native preview window over the dashboard instead, so sign-in, browsing, and playback keep working while still giving you a fullscreen toggle on the preview toolbar.
                      </div>
                    </div>
                    <div className={cn('grid', isLandscapeMobile ? 'grid-cols-1 gap-2' : 'grid-cols-3 gap-3')}>
                      <div className={cn('rounded-2xl border p-3', widgetTone.softCard)}>
                        <div className={cn('text-[10px] uppercase tracking-wide font-black', widgetTone.subtitle)}>1. Preview</div>
                        <div className="mt-2 text-sm">Open the service in a floating preview window without leaving the dashboard.</div>
                      </div>
                      <div className={cn('rounded-2xl border p-3', widgetTone.softCard)}>
                        <div className={cn('text-[10px] uppercase tracking-wide font-black', widgetTone.subtitle)}>2. Expand</div>
                        <div className="mt-2 text-sm">Use the toolbar to switch between windowed and fullscreen whenever you want.</div>
                      </div>
                      <div className={cn('rounded-2xl border p-3', widgetTone.softCard)}>
                        <div className={cn('text-[10px] uppercase tracking-wide font-black', widgetTone.subtitle)}>3. Return</div>
                        <div className="mt-2 text-sm">Close the preview to drop straight back into Velocity exactly where you left off.</div>
                      </div>
                    </div>
                  </div>
                  <div className={cn('text-xs', widgetTone.subtitle)}>
                    Use Open App if you want the native player instead. Use Open Web if you want the raw site in the current browser context.
                  </div>
                </div>
              ) : (
                <SystemStatePanel
                  kind={activeWebUrl ? 'info' : 'empty'}
                  compact
                  eyebrow="Preview panel"
                  title={activeWebUrl ? 'Preview panel is hidden' : 'Preview URL is missing'}
                  message={activeWebUrl
                    ? 'Enable Show Preview Panel to keep preview and fullscreen controls ready for this music source.'
                    : 'Add a web URL in Apps before trying to preview this source inside Velocity.'}
                  primaryAction={activeWebUrl
                    ? {
                        label: activeIntegration?.embedInPanel ? 'Preview Ready' : 'Show Preview Panel',
                        onClick: () => patchActiveIntegration({ embedInPanel: true }),
                      }
                    : { label: 'Open Apps', onClick: () => navigate('/apps') }}
                  className={cn(widgetTone.softCard, widgetTone.subtitle)}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </CarLayout>
  );
}
