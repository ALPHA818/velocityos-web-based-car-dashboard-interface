import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { Home, Map, Music, Grid, Settings, Wifi, Battery } from 'lucide-react';
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
}
const NavButton = ({ icon: Icon, isActive, onClick }: NavButtonProps) => (
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
    {isActive && (
      <span className="absolute -left-1 w-1.5 h-10 bg-primary-foreground rounded-r-full shadow-glow" />
    )}
  </button>
);
export function CarLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMapOpen = useOSStore((s) => s.isMapOpen);
  const openMap = useOSStore((s) => s.openMap);
  const closeMap = useOSStore((s) => s.closeMap);
  const setCurrentPos = useOSStore((s) => s.setCurrentPos);
  const isPlaying = useMediaStore((s) => s.isPlaying);
  const currentTrackIndex = useMediaStore((s) => s.currentTrackIndex);
  const volume = useMediaStore((s) => s.volume);
  const setProgress = useMediaStore((s) => s.setProgress);
  const setDuration = useMediaStore((s) => s.setDuration);
  const track = getTrack(currentTrackIndex);
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let currentWakeLock: any = null;
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        currentWakeLock = await requestWakeLock();
      } else if (currentWakeLock) {
        try {
          await currentWakeLock.release();
          currentWakeLock = null;
        } catch (e) {
          console.warn('WakeLock release failed', e);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    handleVisibilityChange();
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setCurrentPos([pos.coords.latitude, pos.coords.longitude], pos.coords.speed),
      (err) => console.error(`GPS Error: ${err.message}`),
      { enableHighAccuracy: true }
    );
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (currentWakeLock) currentWakeLock.release().catch(() => {});
      navigator.geolocation.clearWatch(watchId);
    };
  }, [setCurrentPos]);
  return (
    <div className="flex h-screen w-screen bg-black text-foreground overflow-hidden font-sans antialiased">
      {/* Hidden Global Audio Engine */}
      <div className="hidden">
        <ReactPlayer
          url={track.url}
          playing={isPlaying}
          volume={volume}
          onProgress={(s) => setProgress(s.played * 100)}
          onDuration={(d) => setDuration(d)}
          width="0"
          height="0"
        />
      </div>
      <nav className="w-28 border-r border-white/10 flex flex-col items-center py-8 gap-6 z-[110] bg-zinc-950/80 backdrop-blur-2xl">
        <div className="mb-4 flex flex-col items-center gap-1">
          <span className="text-xl font-black text-primary tracking-tighter">VOS</span>
          <div className="flex gap-1 items-center">
            <Wifi className="w-3 h-3 text-green-500" />
            <Battery className="w-3 h-3 text-white/50" />
          </div>
        </div>
        <NavButton
          icon={Home}
          isActive={location.pathname === '/' && !isMapOpen}
          onClick={() => { closeMap(); navigate('/'); }}
        />
        <NavButton
          icon={Map}
          isActive={isMapOpen}
          onClick={() => isMapOpen ? closeMap() : openMap()}
        />
        <NavButton
          icon={Music}
          isActive={location.pathname === '/media' && !isMapOpen}
          onClick={() => { closeMap(); navigate('/media'); }}
        />
        <NavButton
          icon={Grid}
          isActive={location.pathname === '/apps' && !isMapOpen}
          onClick={() => { closeMap(); navigate('/apps'); }}
        />
        <div className="mt-auto space-y-6 flex flex-col items-center">
          <div className="text-center">
            <div className="text-lg font-bold tabular-nums">{format(currentTime, 'HH:mm')}</div>
          </div>
          <NavButton
            icon={Settings}
            isActive={location.pathname === '/settings' && !isMapOpen}
            onClick={() => { closeMap(); navigate('/settings'); }}
          />
        </div>
      </nav>
      <main className="flex-1 overflow-y-auto relative p-10 bg-gradient-to-br from-zinc-950 to-black">
        <AnimatePresence mode="wait">
          {!isMapOpen && (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isMapOpen && (
            <motion.div
              key="map"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 left-28 z-[100]"
            >
              <MapView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}