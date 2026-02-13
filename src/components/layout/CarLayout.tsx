import React, { useEffect, useState, useRef } from 'react';
import ReactPlayer from 'react-player';
import { Home, Map, Music, Grid, Settings, Wifi, Battery, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { requestWakeLock } from '@/lib/drive-utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { useOSStore } from '@/store/use-os-store';
import { useMediaStore, getTrack } from '@/store/use-media-store';
import { MapView } from '@/components/drive/MapView';
import { motion, AnimatePresence } from 'framer-motion';
interface NavButtonProps {
  icon: React.ElementType;
  isActive?: boolean;
  onClick?: () => void;
  badge?: boolean;
}
const NavButton = ({ icon: Icon, isActive, onClick, badge }: NavButtonProps) => (
  <button
    onClick={onClick}
    className={cn(
      "touch-target w-20 h-20 rounded-3xl transition-all duration-300 flex items-center justify-center relative",
      isActive
        ? "bg-primary text-primary-foreground shadow-glow scale-105"
        : "text-muted-foreground hover:bg-white/5 hover:text-foreground active:scale-95"
    )}
  >
    <Icon className="w-10 h-10" />
    {isActive && <span className="absolute -left-1 w-1.5 h-10 bg-primary-foreground rounded-r-full shadow-glow" />}
    {badge && !isActive && <span className="absolute top-4 right-4 w-3 h-3 bg-primary rounded-full animate-pulse shadow-glow" />}
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
  const updateSettings = useOSStore(s => s.updateSettings);
  const activeDestination = useOSStore(s => s.activeDestination);
  const isPlaying = useMediaStore(s => s.isPlaying);
  const isPlayerReady = useMediaStore(s => s.isPlayerReady);
  const setPlayerReady = useMediaStore(s => s.setPlayerReady);
  const currentTrackIndex = useMediaStore(s => s.currentTrackIndex);
  const volume = useMediaStore(s => s.volume);
  const setProgress = useMediaStore(s => s.setProgress);
  const setDuration = useMediaStore(s => s.setDuration);
  const track = getTrack(currentTrackIndex);
  const [currentTime, setCurrentTime] = useState(new Date());
  const trackIntervalRef = useRef<any>(null);
  const lastThemeUpdateRef = useRef<number>(-1);
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
    <div className="flex h-screen w-screen bg-black text-foreground overflow-hidden font-sans antialiased">
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
      <nav className="w-28 border-r border-white/10 flex flex-col items-center py-8 gap-4 z-[110] bg-zinc-950/80 backdrop-blur-2xl">
        <div className="mb-4 flex flex-col items-center gap-1">
          <span className="text-xl font-black text-primary tracking-tighter">VOS</span>
          <div className="flex gap-1 items-center">
            <Wifi className={cn("w-3 h-3", gpsStatus === 'granted' ? "text-green-500" : "text-destructive")} />
            <Battery className="w-3 h-3 text-white/50" />
          </div>
        </div>
        <NavButton icon={Home} isActive={location.pathname === '/' && !isMapOpen} onClick={() => { closeMap(); navigate('/'); }} />
        <NavButton icon={MapPin} isActive={location.pathname === '/navigation' && !isMapOpen} onClick={() => { closeMap(); navigate('/navigation'); }} />
        <NavButton icon={Map} isActive={isMapOpen} badge={!!activeDestination} onClick={() => isMapOpen ? closeMap() : openMap()} />
        <NavButton icon={Music} isActive={location.pathname === '/media' && !isMapOpen} onClick={() => { closeMap(); navigate('/media'); }} />
        <NavButton icon={Grid} isActive={location.pathname === '/apps' && !isMapOpen} onClick={() => { closeMap(); navigate('/apps'); }} />
        <div className="mt-auto space-y-4 flex flex-col items-center">
          <div className="text-center py-2">
            <div className="text-2xl font-black tabular-nums">{format(currentTime, 'HH:mm')}</div>
          </div>
          <NavButton icon={Settings} isActive={location.pathname === '/settings' && !isMapOpen} onClick={() => { closeMap(); navigate('/settings'); }} />
        </div>
      </nav>
      <main className="flex-1 overflow-y-auto relative bg-gradient-to-br from-zinc-950 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12 h-full">
          <AnimatePresence mode="wait">
            {!isMapOpen && (
              <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className={cn("fixed inset-0 left-28 z-[100] transition-all duration-500 transform", !isMapOpen ? "pointer-events-none translate-y-full opacity-0" : "translate-y-0 opacity-100")}>
          <MapView />
        </div>
      </main>
    </div>
  );
}