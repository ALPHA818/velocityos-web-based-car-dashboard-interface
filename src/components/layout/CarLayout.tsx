import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Home, Map, Music, Grid, Settings, Wifi, MapPin, Store, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { requestWakeLock } from '@/lib/drive-utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useOSStore } from '@/store/use-os-store';
import { useMediaStore, getTrack, isLibraryMediaSource } from '@/store/use-media-store';
import { BatteryFlow } from '@/components/layout/BatteryFlow';
import { DashboardBackdrop } from '@/components/layout/DashboardCosmetics';
import { useIsLandscapeMobile } from '@/hooks/use-landscape-mobile';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBatteryStatus } from '@/hooks/use-battery-status';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useWeatherSnapshot } from '@/hooks/use-weather-snapshot';
import { applyMarketTheme, getThemeById } from '@/lib/theme-market';
import { getAmbientEffectById, getScenePackById, getWidgetSkinById } from '@/lib/cosmetic-market';
import { getNavigationAlert } from '@/lib/navigation-status';
import { getNativeMonitorConfig, type NativeMonitorConfig } from '@/lib/native-monitor';
import { useWakeWordNavigation } from '@/hooks/use-wake-word-navigation';
import { ParkedModeOnboarding } from '@/components/system/ParkedModeOnboarding';
import { SystemStatusHub } from '@/components/system/SystemStatusHub';
import { useLiveTrackingState, useNavigationMapShellState, useParkedDemoState } from '@/store/os-domain-hooks';
interface NavButtonProps {
  icon: React.ElementType;
  isActive?: boolean;
  onClick?: () => void;
  badge?: boolean;
  label?: string;
  mobileSidebar?: boolean;
}
const NavButton = ({ icon: Icon, isActive, onClick, badge, label, mobileSidebar }: NavButtonProps) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className={cn(
      "touch-target flex items-center justify-center relative select-none",
      mobileSidebar
        ? "w-10 h-10 rounded-lg !min-h-10 !min-w-10"
        : "w-12 h-12 rounded-xl md:w-20 md:h-20 md:rounded-3xl",
      isActive
        ? "bg-primary text-primary-foreground shadow-glow"
        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
    )}
  >
    <Icon className={mobileSidebar ? "w-4 h-4" : "w-5 h-5 md:w-10 md:h-10"} />
    {isActive && !mobileSidebar && <span className="absolute -left-1 hidden md:block w-1.5 h-10 bg-primary-foreground rounded-r-full shadow-glow" />}
    {isActive && mobileSidebar && <span className="absolute -left-1 w-1 h-5 bg-primary-foreground rounded-r-full shadow-glow" />}
    {isActive && !mobileSidebar && <span className="absolute -bottom-1 md:hidden h-1.5 w-6 bg-primary-foreground rounded-t-full shadow-glow" />}
    {badge && !isActive && <span className={mobileSidebar ? "absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse shadow-glow" : "absolute top-2 right-2 md:top-4 md:right-4 w-2.5 h-2.5 md:w-3 md:h-3 bg-primary rounded-full animate-pulse shadow-glow"} />}
  </button>
);

const loadMapView = () => import('@/components/drive/MapView').then((module) => ({ default: module.MapView }));
const loadLibraryMediaPlayer = () => import('@/components/layout/LibraryMediaPlayer').then((module) => ({ default: module.LibraryMediaPlayer }));

const LazyLibraryMediaPlayer = lazy(loadLibraryMediaPlayer);

const GEOLOCATION_UPDATE_INTERVAL_MS = 600;
const GEOLOCATION_MIN_POSITION_DELTA = 0.00003;
const GEOLOCATION_MIN_HEADING_DELTA = 8;
const NAVIGATION_ALERT_REFRESH_MS = 5000;

const SIDEBAR_CLOCK_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatClockTime(date = new Date()) {
  return SIDEBAR_CLOCK_FORMATTER.format(date);
}

function getMillisecondsUntilNextMinute() {
  const now = new Date();
  const millisecondsUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
  return millisecondsUntilNextMinute > 0 ? millisecondsUntilNextMinute : 60000;
}

function getHeadingDelta(previous: number | null | undefined, next: number | null | undefined) {
  if (previous == null || next == null) {
    return Number.POSITIVE_INFINITY;
  }

  const rawDelta = Math.abs(previous - next);
  return Math.min(rawDelta, 360 - rawDelta);
}

const SidebarClock = React.memo(function SidebarClock({ className, compact }: { className?: string; compact: boolean }) {
  const [timeLabel, setTimeLabel] = useState(() => formatClockTime());

  useEffect(() => {
    let intervalId: number | undefined;
    const updateClock = () => setTimeLabel(formatClockTime());
    updateClock();

    const timeoutId = window.setTimeout(() => {
      updateClock();
      intervalId = window.setInterval(updateClock, 60000);
    }, getMillisecondsUntilNextMinute());

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  return (
    <div className={cn('text-center font-black tabular-nums leading-none', compact ? 'text-[11px]' : 'text-2xl', className)}>
      {timeLabel}
    </div>
  );
});

type NavigationAlertInput = Omit<Parameters<typeof getNavigationAlert>[0], 'now'>;

interface NavigationBannerProps extends NavigationAlertInput {
  isMapOpen: boolean;
  isLandscapeMobile: boolean;
  activeScene: ReturnType<typeof getScenePackById>;
  activeAmbientEffect: ReturnType<typeof getAmbientEffectById>;
  onAction: (actionHint: 'settings' | 'navigation' | undefined) => void;
}

const NavigationBanner = React.memo(function NavigationBanner({
  isMapOpen,
  isLandscapeMobile,
  activeScene,
  activeAmbientEffect,
  onAction,
  gpsStatus,
  routeState,
  routeFailureKind,
  routeFailureMessage,
  lastGpsFixAt,
  activeDestination,
  activeRoute,
}: NavigationBannerProps) {
  const [navigationNow, setNavigationNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNavigationNow(Date.now()), NAVIGATION_ALERT_REFRESH_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  const navigationAlert = useMemo(() => getNavigationAlert({
    gpsStatus,
    routeState,
    routeFailureKind,
    routeFailureMessage,
    lastGpsFixAt,
    activeDestination,
    activeRoute,
    now: navigationNow,
  }), [gpsStatus, routeState, routeFailureKind, routeFailureMessage, lastGpsFixAt, activeDestination, activeRoute, navigationNow]);

  if (isMapOpen || !navigationAlert || (navigationAlert.tone === 'success' && !activeDestination)) {
    return null;
  }

  const navigationBannerClassName = navigationAlert.tone === 'destructive'
    ? 'border-rose-400/40 bg-rose-500/15 text-rose-50'
    : navigationAlert.tone === 'warning'
      ? 'border-amber-400/40 bg-amber-500/15 text-amber-50'
      : navigationAlert.tone === 'success'
        ? 'border-emerald-400/35 bg-emerald-500/12 text-emerald-50'
        : 'border-cyan-400/35 bg-cyan-500/12 text-cyan-50';

  return (
    <div className={cn('pointer-events-auto absolute z-30', isLandscapeMobile ? 'left-2 right-2 top-2' : 'left-4 right-4 top-4')}>
      <div className={cn('relative overflow-hidden rounded-[1.5rem] border backdrop-blur-2xl', navigationBannerClassName)}>
        <div className="absolute inset-0 opacity-70" style={{ background: activeScene?.surface }} />
        <div className="absolute -right-8 top-0 h-24 w-24 rounded-full blur-3xl" style={{ background: activeAmbientEffect?.accent }} />
        <div className={cn('relative z-10 flex gap-3', isLandscapeMobile ? 'flex-col p-3' : 'items-center justify-between p-4')}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
                {navigationAlert.compactLabel}
              </span>
              {activeDestination && (
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">{activeDestination.label}</span>
              )}
            </div>
            <div className={cn('mt-2 font-black tracking-tight', isLandscapeMobile ? 'text-sm' : 'text-lg')}>
              {navigationAlert.title}
            </div>
            <div className={cn('mt-1 text-white/75', isLandscapeMobile ? 'text-[11px]' : 'text-sm')}>
              {navigationAlert.detail}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAction(navigationAlert.actionHint)}
            className={cn(
              'shrink-0 rounded-full border border-white/20 bg-black/25 font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-black/35',
              isLandscapeMobile ? 'px-3 py-2 text-[10px]' : 'px-4 py-3 text-[11px]'
            )}
          >
            {navigationAlert.actionHint === 'settings' ? 'Open Settings' : 'Open Navigation'}
          </button>
        </div>
      </div>
    </div>
  );
});

export function CarLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMapOpen, openMap, closeMap } = useNavigationMapShellState();
  const {
    gpsStatus,
    activeDestination,
    activeRoute,
    routeState,
    routeFailureKind,
    routeFailureMessage,
    lastGpsFixAt,
    setCurrentPos,
    setGpsStatus,
    selectedDiscoveredPlace,
    autoTheme,
    activeThemeId,
    activeScenePackId,
    activeAmbientEffectId,
    activeWidgetSkinId,
    aiName,
    aiVoiceControlEnabled,
    ollamaBaseUrl,
    ollamaModel,
    updateSettings,
    isParked,
    hasCurrentPos,
  } = useOSStore(useShallow((state) => ({
    gpsStatus: state.gpsStatus,
    activeDestination: state.activeDestination,
    activeRoute: state.activeRoute,
    routeState: state.routeState,
    routeFailureKind: state.routeFailureKind,
    routeFailureMessage: state.routeFailureMessage,
    lastGpsFixAt: state.lastGpsFixAt,
    setCurrentPos: state.setCurrentPos,
    setGpsStatus: state.setGpsStatus,
    selectedDiscoveredPlace: state.selectedDiscoveredPlace,
    autoTheme: state.settings.autoTheme,
    activeThemeId: state.activeThemeId,
    activeScenePackId: state.activeScenePackId,
    activeAmbientEffectId: state.activeAmbientEffectId,
    activeWidgetSkinId: state.activeWidgetSkinId,
    aiName: state.settings.aiName,
    aiVoiceControlEnabled: state.settings.aiVoiceControlEnabled,
    ollamaBaseUrl: state.settings.ollamaBaseUrl,
    ollamaModel: state.settings.ollamaModel,
    updateSettings: state.updateSettings,
    isParked: !state.currentSpeed || state.currentSpeed < 0.8,
    hasCurrentPos: state.currentPos !== null,
  })));
  const { isSharingLive, trackingId } = useLiveTrackingState();
  const { isParkedDemoOpen, dismissParkedDemo, completeParkedDemo } = useParkedDemoState();
  const {
    isPlaying,
    isPlayerReady,
    setPlayerReady,
    activeSource,
    currentTrackIndex,
    volume,
    setProgress,
    setDuration,
  } = useMediaStore(useShallow((state) => ({
    isPlaying: state.isPlaying,
    isPlayerReady: state.isPlayerReady,
    setPlayerReady: state.setPlayerReady,
    activeSource: state.activeSource,
    currentTrackIndex: state.currentTrackIndex,
    volume: state.volume,
    setProgress: state.setProgress,
    setDuration: state.setDuration,
  })));
  const isLandscapeMobile = useIsLandscapeMobile();
  const isMobile = useIsMobile();
  const battery = useBatteryStatus();
  const network = useNetworkStatus({ offlineGraceMs: 3000 });
  const { weather } = useWeatherSnapshot();
  const isBottomSidebar = !isLandscapeMobile && isMobile;
  const isCompactSidebarMeta = isLandscapeMobile || isBottomSidebar;
  const isLibrarySource = isLibraryMediaSource(activeSource);
  const track = isLibrarySource ? getTrack(currentTrackIndex) : null;
  const [showMicStatusPopup, setShowMicStatusPopup] = useState(false);
  const [nativeMonitorConfig, setNativeMonitorConfigState] = useState<NativeMonitorConfig | null>(null);
  const trackIntervalRef = useRef<number | null>(null);
  const trackingSnapshotRef = useRef<{
    trackingId: string | null;
    currentPos: [number, number] | null;
    currentSpeed: number | null;
    currentHeading: number | null;
  }>({
    trackingId,
    currentPos: null,
    currentSpeed: null,
    currentHeading: null,
  });
  const lastThemeUpdateRef = useRef<number>(-1);
  const lastGeolocationCommitRef = useRef<{
    timestamp: number;
    latitude: number;
    longitude: number;
    heading: number | null;
  } | null>(null);

  const wifiClassName = !network.isOnline
    ? 'text-destructive'
    : network.effectiveType === 'slow-2g' || network.effectiveType === '2g'
      ? 'text-amber-400'
      : 'text-green-500';

  const activeScene = useMemo(
    () => getScenePackById(activeScenePackId) ?? getScenePackById('scene-garage-grid'),
    [activeScenePackId]
  );
  const activeAmbientEffect = useMemo(
    () => getAmbientEffectById(activeAmbientEffectId) ?? getAmbientEffectById('effect-clear-air'),
    [activeAmbientEffectId]
  );
  const activeWidgetSkin = useMemo(
    () => getWidgetSkinById(activeWidgetSkinId) ?? getWidgetSkinById('widget-core-digital'),
    [activeWidgetSkinId]
  );
  const shouldShowIdlePanel = !isMapOpen && (battery.charging || isParked) && ['/', '/media', '/settings', '/trips'].includes(location.pathname);
  const shouldShowParkedDemo = isParkedDemoOpen && isParked && !isMapOpen;

  const idleStateTitle = battery.charging
    ? 'Charging Scene'
    : isPlaying
      ? 'Cabin Idle'
      : 'Parked Mode';

  const weatherLabel = weather?.code === 0
    ? 'Clear'
    : typeof weather?.code === 'number' && weather.code < 4
      ? 'Cloud Cover'
      : typeof weather?.code === 'number' && weather.code < 70
        ? 'Rain Front'
        : typeof weather?.code === 'number'
          ? 'Storm Watch'
          : 'Standby';

  const clockClassName = activeWidgetSkin?.style === 'retro'
    ? 'font-mono text-amber-300 tracking-[0.18em]'
    : activeWidgetSkin?.style === 'motorsport'
      ? 'text-rose-200 tracking-tight'
      : activeWidgetSkin?.style === 'luxury'
        ? 'font-serif text-amber-100'
        : activeWidgetSkin?.style === 'cyber'
          ? 'font-mono text-emerald-300 tracking-[0.18em]'
          : activeWidgetSkin?.style === 'expedition'
            ? 'font-mono text-lime-200 tracking-[0.16em]'
            : 'text-foreground';

  const navigateTo = useCallback((path: string) => {
    closeMap();
    navigate(path);
  }, [closeMap, navigate]);

  const openMapOverlay = useCallback(() => {
    openMap();
  }, [openMap]);

  const handleAiVoiceFallback = useCallback(async (command: string) => {
    try {
      const { askOllama } = await import('@/lib/ollama-assistant');
      const reply = await askOllama({
        baseUrl: ollamaBaseUrl,
        model: ollamaModel,
        prompt: [
          'Classify this in-car navigation command into one action key.',
          'Allowed keys: HOME, APPS, NAVIGATION, MAP_OPEN, MAP_CLOSE, MEDIA, SETTINGS, THEME_STORE, TRIPS, NONE.',
          `Command: ${command}`,
          'Return only one key.',
        ].join('\n'),
        history: [],
      });

      const action = reply.trim().toUpperCase();

      if (action.includes('HOME')) {
        navigateTo('/');
        return;
      }
      if (action.includes('APPS')) {
        navigateTo('/apps');
        return;
      }
      if (action.includes('NAVIGATION')) {
        navigateTo('/navigation');
        return;
      }
      if (action.includes('MAP_OPEN')) {
        openMapOverlay();
        return;
      }
      if (action.includes('MAP_CLOSE')) {
        closeMap();
        return;
      }
      if (action.includes('MEDIA')) {
        navigateTo('/media');
        return;
      }
      if (action.includes('SETTINGS')) {
        navigateTo('/settings');
        return;
      }
      if (action.includes('THEME_STORE')) {
        navigateTo('/theme-store');
        return;
      }
      if (action.includes('TRIPS')) {
        navigateTo('/trips');
      }
    } catch {
      // If Ollama is unavailable, fallback classification is silently skipped.
    }
  }, [closeMap, navigateTo, ollamaBaseUrl, ollamaModel, openMapOverlay]);

  const handleUnhandledVoiceCommand = useCallback((command: string) => {
    void handleAiVoiceFallback(command);
  }, [handleAiVoiceFallback]);

  useWakeWordNavigation({
    enabled: aiVoiceControlEnabled,
    wakeWord: aiName,
    isMapOpen,
    navigateTo,
    openMap: openMapOverlay,
    closeMap,
    onUnhandledCommand: handleUnhandledVoiceCommand,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const popupSessionKey = 'velocityos_mic_status_popup_seen';
    if (window.sessionStorage.getItem(popupSessionKey)) return;
    window.sessionStorage.setItem(popupSessionKey, '1');
    setShowMicStatusPopup(true);
  }, []);

  useEffect(() => {
    if (!autoTheme) {
      lastThemeUpdateRef.current = -1;
      return;
    }

    const syncThemeToCurrentHour = () => {
      const hour = new Date().getHours();
      if (lastThemeUpdateRef.current !== hour) {
        lastThemeUpdateRef.current = hour;
        const isNight = hour >= 18 || hour < 6;
        const targetTheme = isNight ? 'dark' : 'light';
        updateSettings({ theme: targetTheme, mapTheme: isNight ? 'highway' : 'light' });
      }
    };

    syncThemeToCurrentHour();
    const intervalId = window.setInterval(syncThemeToCurrentHour, 60000);
    return () => window.clearInterval(intervalId);
  }, [autoTheme, updateSettings]);

  useEffect(() => {
    applyMarketTheme(getThemeById(activeThemeId));
  }, [activeThemeId]);

  useEffect(() => {
    if (typeof window === 'undefined' || isMobile) return;

    const warmShellModules = () => {
      void Promise.allSettled([
        loadMapView(),
        loadLibraryMediaPlayer(),
      ]);
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(() => warmShellModules(), { timeout: 1200 });
      return () => {
        if ('cancelIdleCallback' in window) {
          window.cancelIdleCallback(idleId);
        }
      };
    }

    const timeoutId = window.setTimeout(warmShellModules, 600);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isMobile]);

  useEffect(() => {
    let active = true;

    void getNativeMonitorConfig()
      .then((config) => {
        if (active) {
          setNativeMonitorConfigState(config);
        }
      })
      .catch(() => {
        if (active) {
          setNativeMonitorConfigState(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const syncTrackingSnapshot = () => {
      const state = useOSStore.getState();
      trackingSnapshotRef.current = {
        trackingId: state.trackingId,
        currentPos: state.currentPos,
        currentSpeed: state.currentSpeed,
        currentHeading: state.currentHeading,
      };
    };

    syncTrackingSnapshot();

    return useOSStore.subscribe(() => {
      syncTrackingSnapshot();
    });
  }, []);

  const handleNavigationBannerAction = useCallback((actionHint: 'settings' | 'navigation' | undefined) => {
    closeMap();
    navigate(actionHint === 'settings' ? '/settings' : '/navigation');
  }, [closeMap, navigate]);

  useEffect(() => {
    const clearTrackingInterval = () => {
      if (trackIntervalRef.current === null) return;
      window.clearInterval(trackIntervalRef.current);
      trackIntervalRef.current = null;
    };

    if (!isSharingLive || !trackingId || gpsStatus !== 'granted' || !hasCurrentPos) {
      clearTrackingInterval();
      return clearTrackingInterval;
    }

    const postTrackingUpdate = async () => {
      const snapshot = trackingSnapshotRef.current;
      if (!snapshot.trackingId || !snapshot.currentPos) {
        return;
      }

      try {
        await fetch(`/api/tracking/${snapshot.trackingId}`, {
          method: 'POST',
          body: JSON.stringify({
            lat: snapshot.currentPos[0],
            lon: snapshot.currentPos[1],
            speed: snapshot.currentSpeed || 0,
            heading: snapshot.currentHeading || 0,
          }),
        });
      } catch (error) {
        console.error('Tracking failed', error);
      }
    };

    void postTrackingUpdate();

    trackIntervalRef.current = window.setInterval(() => {
      void postTrackingUpdate();
    }, 10000);

    return clearTrackingInterval;
  }, [isSharingLive, trackingId, gpsStatus, hasCurrentPos]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGpsStatus('unsupported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        const heading = typeof pos.coords.heading === 'number' && !Number.isNaN(pos.coords.heading)
          ? pos.coords.heading
          : null;
        const now = Date.now();
        const lastCommit = lastGeolocationCommitRef.current;
        const movedEnough = !lastCommit
          || Math.abs(latitude - lastCommit.latitude) >= GEOLOCATION_MIN_POSITION_DELTA
          || Math.abs(longitude - lastCommit.longitude) >= GEOLOCATION_MIN_POSITION_DELTA;
        const turnedEnough = getHeadingDelta(lastCommit?.heading, heading) >= GEOLOCATION_MIN_HEADING_DELTA;
        const intervalElapsed = !lastCommit || now - lastCommit.timestamp >= GEOLOCATION_UPDATE_INTERVAL_MS;

        if (!movedEnough && !turnedEnough && !intervalElapsed) {
          return;
        }

        lastGeolocationCommitRef.current = { timestamp: now, latitude, longitude, heading };
        setCurrentPos([latitude, longitude], pos.coords.speed, heading);
      },
      (err) => { if (err.code === 1) setCurrentPos(null, 0, null, true); },
      { enableHighAccuracy: true }
    );
    let wakeLock: any = null;
    requestWakeLock().then(lock => wakeLock = lock);
    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (wakeLock) wakeLock.release().catch(() => {});
    };
  }, [setCurrentPos, setGpsStatus]);
  return (
    <div className={cn(
      "flex h-[100dvh] w-screen bg-black text-foreground overflow-hidden font-sans antialiased",
      isLandscapeMobile ? "flex-row" : "flex-col md:flex-row"
    )}>
      {isLibrarySource && track && (
        <Suspense fallback={null}>
          <LazyLibraryMediaPlayer
            url={track.url}
            playing={isPlaying && isPlayerReady}
            volume={volume}
            onReady={() => setPlayerReady(true)}
            onProgress={(state: { played: number }) => setProgress(state.played * 100)}
            onDuration={(d: number) => setDuration(d)}
          />
        </Suspense>
      )}
      <nav className={cn(
        "z-[110] min-h-0 bg-zinc-950/90 backdrop-blur-2xl shrink-0 border-white/10",
        isLandscapeMobile
          ? "order-1 h-full w-16 border-r flex flex-col items-center px-1 py-2 gap-2"
          : "order-2 md:order-1 h-24 md:h-auto w-full md:w-28 border-t md:border-t-0 md:border-r flex md:flex-col items-center px-2 md:px-0 md:py-8 gap-2 md:gap-4"
      )}>
        <div className={cn(
          "flex flex-col items-center",
          isBottomSidebar
            ? "shrink-0 gap-1 pr-1"
            : isLandscapeMobile
              ? "mb-1 w-full gap-1"
              : "mb-4 w-full gap-2"
        )}>
          <div className={cn("flex items-center", isCompactSidebarMeta ? "gap-1" : "gap-2")}>
            <Wifi
              className={cn(
                isCompactSidebarMeta ? "w-4 h-4" : "w-6 h-6",
                wifiClassName
              )}
            />
            <BatteryFlow level={battery.level} charging={battery.charging} compact={isCompactSidebarMeta} orientation="horizontal" />
          </div>
          <SidebarClock compact={isCompactSidebarMeta} className={clockClassName} />
        </div>
        <div
          data-sidebar-scroll-region="tabs"
          data-scroll-axis={isBottomSidebar ? 'x' : 'y'}
          className={cn(
            "sidebar-scrollbar flex w-full min-h-0",
            isBottomSidebar
              ? "min-w-0 flex-1 items-center justify-start gap-2 overflow-x-auto overflow-y-hidden pb-2"
              : isLandscapeMobile
                ? "flex-1 flex-col items-center justify-start gap-2 overflow-y-auto overflow-x-hidden pr-1"
                : "items-center justify-between md:flex-1 md:flex-col md:justify-start md:gap-4 md:overflow-y-auto md:overflow-x-hidden md:pr-1"
          )}
        >
          <NavButton mobileSidebar={isLandscapeMobile} label="Home" icon={Home} isActive={location.pathname === '/' && !isMapOpen} onClick={() => { closeMap(); navigate('/'); }} />
          <NavButton mobileSidebar={isLandscapeMobile} label="Navigation" icon={MapPin} isActive={location.pathname === '/navigation' && !isMapOpen} onClick={() => { closeMap(); navigate('/navigation'); }} />
          <NavButton mobileSidebar={isLandscapeMobile} label="Map" icon={Map} isActive={isMapOpen} badge={!!activeDestination} onClick={() => isMapOpen ? closeMap() : openMapOverlay()} />
          <NavButton mobileSidebar={isLandscapeMobile} label="Media" icon={Music} isActive={location.pathname === '/media' && !isMapOpen} onClick={() => { closeMap(); navigate('/media'); }} />
          <NavButton mobileSidebar={isLandscapeMobile} label="Apps" icon={Grid} isActive={location.pathname === '/apps' && !isMapOpen} onClick={() => { closeMap(); navigate('/apps'); }} />
          <NavButton mobileSidebar={isLandscapeMobile} label="Store" icon={Store} isActive={location.pathname === '/theme-store' && !isMapOpen} onClick={() => { closeMap(); navigate('/theme-store'); }} />
          <div className="shrink-0 md:hidden">
            <NavButton mobileSidebar={isLandscapeMobile} label="Settings" icon={Settings} isActive={location.pathname === '/settings' && !isMapOpen} onClick={() => { closeMap(); navigate('/settings'); }} />
          </div>
        </div>
        <div className="hidden mt-auto space-y-4 md:flex md:flex-col md:items-center">
          <NavButton mobileSidebar={isLandscapeMobile} label="Settings" icon={Settings} isActive={location.pathname === '/settings' && !isMapOpen} onClick={() => { closeMap(); navigate('/settings'); }} />
        </div>
      </nav>
      <main className={cn(
        "flex-1 min-h-0 relative overflow-y-auto bg-black",
        isLandscapeMobile ? "order-2" : "order-1 md:order-2"
      )}>
        <DashboardBackdrop
          className="z-0"
          scene={activeScene}
          effect={activeAmbientEffect}
          weatherCode={weather?.code}
          charging={battery.charging}
          parked={!isMapOpen && isParked}
          showIdleLabel={!isMapOpen}
        />
        <NavigationBanner
          isMapOpen={isMapOpen}
          isLandscapeMobile={isLandscapeMobile}
          gpsStatus={gpsStatus}
          routeState={routeState}
          routeFailureKind={routeFailureKind}
          routeFailureMessage={routeFailureMessage}
          lastGpsFixAt={lastGpsFixAt}
          activeDestination={activeDestination}
          activeRoute={activeRoute}
          activeScene={activeScene}
          activeAmbientEffect={activeAmbientEffect}
          onAction={handleNavigationBannerAction}
        />
        {shouldShowIdlePanel && (
          <div className={cn('pointer-events-none absolute z-20', isLandscapeMobile ? 'bottom-2 right-2 max-w-[11.5rem]' : 'bottom-4 right-4 max-w-[20rem]')}>
            <div
              className={cn(
                'relative overflow-hidden rounded-[1.6rem] border backdrop-blur-2xl',
                activeWidgetSkin?.style === 'retro'
                  ? 'border-amber-300/20 bg-amber-950/20 text-amber-100'
                  : activeWidgetSkin?.style === 'motorsport'
                    ? 'border-rose-300/18 bg-zinc-950/45 text-rose-50'
                    : activeWidgetSkin?.style === 'luxury'
                      ? 'border-white/15 bg-stone-950/45 text-amber-50'
                      : activeWidgetSkin?.style === 'cyber'
                        ? 'border-emerald-400/18 bg-emerald-950/22 text-emerald-50'
                        : activeWidgetSkin?.style === 'expedition'
                          ? 'border-lime-300/18 bg-lime-950/20 text-lime-50'
                          : 'border-white/12 bg-black/35 text-foreground'
              )}
              style={{ boxShadow: `0 28px 72px -42px ${activeScene?.glow ?? 'rgba(59,130,246,0.24)'}` }}
            >
              <div className="absolute inset-0 opacity-80" style={{ background: activeScene?.surface }} />
              <div className="absolute -right-6 top-0 h-24 w-24 rounded-full blur-3xl" style={{ background: activeAmbientEffect?.accent }} />
              <div className={cn('relative z-10 space-y-3', isLandscapeMobile ? 'p-2.5' : 'p-4')}>
                <div className="flex items-center justify-between gap-3">
                  <span
                    className="rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em]"
                    style={{ borderColor: activeScene?.accent, color: activeScene?.accent, background: 'rgba(8,12,18,0.36)' }}
                  >
                    {idleStateTitle}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">{weather ? `${weather.temp}°` : weatherLabel}</span>
                </div>
                <div>
                  <div className={cn('font-black tracking-tight', isLandscapeMobile ? 'text-sm' : 'text-xl')}>{activeScene?.name}</div>
                  <div className="mt-1 text-[11px] text-white/70">{battery.charging ? 'Charge visuals stay active while parked.' : 'Scene and effect profile remain visible while idle.'}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  <div className="rounded-xl border px-2 py-2" style={{ borderColor: `${activeAmbientEffect?.accent ?? 'rgba(255,255,255,0.12)'}55`, background: 'rgba(8,12,18,0.28)' }}>
                    <div>Effect</div>
                    <div className="mt-1 font-black text-white">{activeAmbientEffect?.label}</div>
                  </div>
                  <div className="rounded-xl border px-2 py-2" style={{ borderColor: `${activeScene?.accent ?? 'rgba(255,255,255,0.12)'}55`, background: 'rgba(8,12,18,0.28)' }}>
                    <div>Weather</div>
                    <div className="mt-1 font-black text-white">{weatherLabel}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {showMicStatusPopup && (
          <div
            className={cn(
              'fixed z-[150] rounded-lg border shadow-lg backdrop-blur-md',
              'right-2 top-2 md:right-4 md:top-4',
              'w-[205px] md:w-[240px] p-2.5 md:p-3',
              aiVoiceControlEnabled
                ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100'
                : 'border-rose-400/40 bg-rose-500/15 text-rose-100'
            )}
          >
            <button
              onClick={() => {
                setShowMicStatusPopup(false);
                closeMap();
                navigate('/settings?focus=mic-toggle');
              }}
              className="w-full pr-6 text-left"
              title="Open settings"
            >
              <div className={cn('font-black uppercase tracking-wide', isLandscapeMobile ? 'text-[10px]' : 'text-xs')}>
                Microphone Status
              </div>
              <div className={cn('font-semibold mt-0.5', isLandscapeMobile ? 'text-[11px]' : 'text-sm')}>
                {aiVoiceControlEnabled ? 'Mic is ON for voice control' : 'Mic is OFF for voice control'}
              </div>
              <div className={cn('opacity-80 mt-1', isLandscapeMobile ? 'text-[9px]' : 'text-[11px]')}>
                Tap to open settings
              </div>
            </button>
            <button
              onClick={() => setShowMicStatusPopup(false)}
              className="absolute right-2 top-2 rounded border border-white/30 p-1 text-white/90 hover:bg-white/10"
              aria-label="Dismiss microphone status popup"
              title="Dismiss"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <div className={cn(
          "relative z-10 mx-auto w-full",
          'h-auto min-h-full max-w-7xl',
          isLandscapeMobile ? "px-2 py-2" : "px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-10 lg:py-12"
        )}>
          <div className={cn(isLandscapeMobile ? 'mb-2' : 'mb-4')}>
            <SystemStatusHub
              variant="strip"
              gpsStatus={gpsStatus}
              network={network}
              micEnabled={aiVoiceControlEnabled}
              isSharingLive={isSharingLive}
              trackingId={trackingId}
              nativeMonitorConfig={nativeMonitorConfig}
              isLandscapeMobile={isLandscapeMobile}
            />
          </div>
          <div className="h-auto min-h-full md:h-full">{children}</div>
        </div>
      </main>
      <ParkedModeOnboarding
        open={shouldShowParkedDemo}
        onDismiss={dismissParkedDemo}
        onComplete={completeParkedDemo}
        onNavigate={(path) => {
          closeMap();
          navigate(path);
        }}
      />
    </div>
  );
}
