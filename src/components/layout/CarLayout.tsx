import React, { useCallback, useEffect, useState, useRef } from 'react';
import ReactPlayer from 'react-player';
import { Home, Map, Music, Grid, Settings, Wifi, MapPin, Store, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { requestWakeLock } from '@/lib/drive-utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { useOSStore } from '@/store/use-os-store';
import { useMediaStore, getTrack } from '@/store/use-media-store';
import { MapView } from '@/components/drive/MapView';
import { BatteryFlow } from '@/components/layout/BatteryFlow';
import { useIsLandscapeMobile } from '@/hooks/use-landscape-mobile';
import { useBatteryStatus } from '@/hooks/use-battery-status';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { applyMarketTheme, getThemeById } from '@/lib/theme-market';
import { useWakeWordNavigation } from '@/hooks/use-wake-word-navigation';
import { askOllama } from '@/lib/ollama-assistant';
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
    aria-label={label}
    title={label}
    onClick={onClick}
    className={cn(
      "touch-target transition-colors duration-100 flex items-center justify-center relative",
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
export function CarLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMapOpen = useOSStore(s => s.isMapOpen);
  const openMap = useOSStore(s => s.openMap);
  const closeMap = useOSStore(s => s.closeMap);
  const setCurrentPos = useOSStore(s => s.setCurrentPos);
  const currentPos = useOSStore(s => s.currentPos);
  const currentSpeed = useOSStore(s => s.currentSpeed);
  const gpsStatus = useOSStore(s => s.gpsStatus);
  const isSharingLive = useOSStore(s => s.isSharingLive);
  const trackingId = useOSStore(s => s.trackingId);
  const autoTheme = useOSStore(s => s.settings.autoTheme);
  const activeThemeId = useOSStore(s => s.activeThemeId);
  const aiName = useOSStore(s => s.settings.aiName);
  const aiVoiceControlEnabled = useOSStore(s => s.settings.aiVoiceControlEnabled);
  const ollamaBaseUrl = useOSStore(s => s.settings.ollamaBaseUrl);
  const ollamaModel = useOSStore(s => s.settings.ollamaModel);
  const updateSettings = useOSStore(s => s.updateSettings);
  const activeDestination = useOSStore(s => s.activeDestination);
  const isPlaying = useMediaStore(s => s.isPlaying);
  const isPlayerReady = useMediaStore(s => s.isPlayerReady);
  const setPlayerReady = useMediaStore(s => s.setPlayerReady);
  const currentTrackIndex = useMediaStore(s => s.currentTrackIndex);
  const volume = useMediaStore(s => s.volume);
  const setProgress = useMediaStore(s => s.setProgress);
  const setDuration = useMediaStore(s => s.setDuration);
  const isLandscapeMobile = useIsLandscapeMobile();
  const battery = useBatteryStatus();
  const network = useNetworkStatus({ offlineGraceMs: 3000 });
  const track = getTrack(currentTrackIndex);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showMicStatusPopup, setShowMicStatusPopup] = useState(false);
  const trackIntervalRef = useRef<any>(null);
  const lastThemeUpdateRef = useRef<number>(-1);

  const wifiClassName = !network.isOnline
    ? 'text-destructive'
    : network.effectiveType === 'slow-2g' || network.effectiveType === '2g'
      ? 'text-amber-400'
      : 'text-green-500';

  const navigateTo = useCallback((path: string) => {
    closeMap();
    navigate(path);
  }, [closeMap, navigate]);

  const openMapOverlay = useCallback(() => {
    openMap();
  }, [openMap]);

  const handleAiVoiceFallback = useCallback(async (command: string) => {
    try {
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
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (autoTheme) {
      const hour = currentTime.getHours();
      if (lastThemeUpdateRef.current !== hour) {
        lastThemeUpdateRef.current = hour;
        const isNight = hour >= 18 || hour < 6;
        const targetTheme = isNight ? 'dark' : 'light';
        updateSettings({ theme: targetTheme, mapTheme: isNight ? 'highway' : 'light' });
      }
    }
  }, [currentTime, autoTheme, updateSettings]);
  useEffect(() => {
    applyMarketTheme(getThemeById(activeThemeId));
  }, [activeThemeId]);
  useEffect(() => {
    if (isSharingLive && trackingId && currentPos && gpsStatus === 'granted') {
      if (!trackIntervalRef.current) {
        trackIntervalRef.current = setInterval(async () => {
          try {
            await fetch(`/api/tracking/${trackingId}`, {
              method: 'POST',
              body: JSON.stringify({ lat: currentPos[0], lon: currentPos[1], speed: currentSpeed || 0, heading: useOSStore.getState().currentHeading || 0 })
            });
          } catch (e) { console.error('Tracking failed', e); }
        }, 10000);
      }
    } else if (trackIntervalRef.current) {
      clearInterval(trackIntervalRef.current);
      trackIntervalRef.current = null;
    }
    return () => { if (trackIntervalRef.current) clearInterval(trackIntervalRef.current); };
  }, [isSharingLive, trackingId, currentPos, currentSpeed, gpsStatus]);
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setCurrentPos([pos.coords.latitude, pos.coords.longitude], pos.coords.speed, pos.coords.heading),
      (err) => { if (err.code === 1) setCurrentPos(null, 0, null, true); },
      { enableHighAccuracy: true }
    );
    let wakeLock: any = null;
    requestWakeLock().then(lock => wakeLock = lock);
    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (wakeLock) wakeLock.release().catch(() => {});
    };
  }, [setCurrentPos]);
  return (
    <div className={cn(
      "flex h-[100dvh] w-screen bg-black text-foreground overflow-hidden font-sans antialiased",
      isLandscapeMobile ? "flex-row" : "flex-col md:flex-row"
    )}>
      <div className="hidden">
        <ReactPlayer
          url={track?.url || ''}
          playing={isPlaying && isPlayerReady}
          volume={volume}
          onReady={() => setPlayerReady(true)}
          onProgress={(s: any) => setProgress(s.played * 100)}
          onDuration={(d: number) => setDuration(d)}
          width="0"
          height="0"
          {...({} as any)}
        />
      </div>
      <nav className={cn(
        "z-[110] bg-zinc-950/90 backdrop-blur-2xl shrink-0 border-white/10",
        isLandscapeMobile
          ? "order-1 h-full w-16 border-r flex flex-col items-center px-1 py-2 gap-2"
          : "order-2 md:order-1 h-24 md:h-auto w-full md:w-28 border-t md:border-t-0 md:border-r flex md:flex-col items-center px-2 md:px-0 md:py-8 gap-2 md:gap-4"
      )}>
        <div className={cn(
          "w-full flex flex-col items-center",
          isLandscapeMobile ? "mb-1 gap-1" : "mb-4 gap-2"
        )}>
          <div className={cn("flex items-center", isLandscapeMobile ? "gap-1" : "gap-2")}>
            <Wifi
              className={cn(
                isLandscapeMobile ? "w-4 h-4" : "w-6 h-6",
                wifiClassName
              )}
            />
            <BatteryFlow level={battery.level} charging={battery.charging} compact={isLandscapeMobile} orientation="horizontal" />
          </div>
          <div className={cn("text-center font-black tabular-nums leading-none", isLandscapeMobile ? "text-[11px]" : "text-2xl")}>
            {format(currentTime, 'HH:mm')}
          </div>
        </div>
        <div className={cn(
          "flex w-full",
          isLandscapeMobile
            ? "flex-col items-center justify-start gap-2"
            : "items-center justify-between md:justify-start md:flex-col md:gap-4 md:flex-1"
        )}>
          <NavButton mobileSidebar={isLandscapeMobile} label="Home" icon={Home} isActive={location.pathname === '/' && !isMapOpen} onClick={() => { closeMap(); navigate('/'); }} />
          <NavButton mobileSidebar={isLandscapeMobile} label="Navigation" icon={MapPin} isActive={location.pathname === '/navigation' && !isMapOpen} onClick={() => { closeMap(); navigate('/navigation'); }} />
          <NavButton mobileSidebar={isLandscapeMobile} label="Map" icon={Map} isActive={isMapOpen} badge={!!activeDestination} onClick={() => isMapOpen ? closeMap() : openMap()} />
          <NavButton mobileSidebar={isLandscapeMobile} label="Media" icon={Music} isActive={location.pathname === '/media' && !isMapOpen} onClick={() => { closeMap(); navigate('/media'); }} />
          <NavButton mobileSidebar={isLandscapeMobile} label="Apps" icon={Grid} isActive={location.pathname === '/apps' && !isMapOpen} onClick={() => { closeMap(); navigate('/apps'); }} />
          <NavButton mobileSidebar={isLandscapeMobile} label="Theme Store" icon={Store} isActive={location.pathname === '/theme-store' && !isMapOpen} onClick={() => { closeMap(); navigate('/theme-store'); }} />
          <div className="md:hidden">
            <NavButton mobileSidebar={isLandscapeMobile} label="Settings" icon={Settings} isActive={location.pathname === '/settings' && !isMapOpen} onClick={() => { closeMap(); navigate('/settings'); }} />
          </div>
        </div>
        <div className="hidden mt-auto space-y-4 md:flex md:flex-col md:items-center">
          <NavButton mobileSidebar={isLandscapeMobile} label="Settings" icon={Settings} isActive={location.pathname === '/settings' && !isMapOpen} onClick={() => { closeMap(); navigate('/settings'); }} />
        </div>
      </nav>
      <main className={cn(
        "flex-1 min-h-0 overflow-y-auto relative bg-gradient-to-br from-zinc-950 to-black",
        isLandscapeMobile ? "order-2" : "order-1 md:order-2"
      )}>
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
          "max-w-7xl mx-auto h-auto min-h-full",
          isLandscapeMobile ? "px-2 py-2" : "px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-10 lg:py-12"
        )}>
          {!isMapOpen && <div className="h-auto min-h-full md:h-full">{children}</div>}
        </div>
        <div className={cn(
          "fixed inset-0 z-[100] transition-all duration-150 transform",
          isLandscapeMobile ? "left-16" : "md:left-28",
          !isMapOpen ? "pointer-events-none translate-y-full opacity-0" : "translate-y-0 opacity-100"
        )}>
          <MapView />
        </div>
      </main>
    </div>
  );
}