import React from 'react';
import { CarLayout } from '@/components/layout/CarLayout';
import { useMediaStore, getTrack } from '@/store/use-media-store';
import { useOSStore } from '@/store/use-os-store';
import { Play, Pause, SkipForward, SkipBack, Volume2, Map as MapIcon } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useIsLandscapeMobile } from '@/hooks/use-landscape-mobile';
export function MediaPage() {
  const isPlaying = useMediaStore((s) => s.isPlaying);
  const currentTrackIndex = useMediaStore((s) => s.currentTrackIndex);
  const volume = useMediaStore((s) => s.volume);
  const progress = useMediaStore((s) => s.progress);
  const duration = useMediaStore((s) => s.duration);
  const togglePlay = useMediaStore((s) => s.togglePlay);
  const nextTrack = useMediaStore((s) => s.nextTrack);
  const prevTrack = useMediaStore((s) => s.prevTrack);
  const setProgress = useMediaStore((s) => s.setProgress);
  const setVolume = useMediaStore((s) => s.setVolume);
  const openMap = useOSStore((s) => s.openMap);
  const isLandscapeMobile = useIsLandscapeMobile();
  const track = getTrack(currentTrackIndex);
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };
  return (
    <CarLayout>
      <div className={cn(
        "h-full flex md:flex-row items-center",
        isLandscapeMobile ? "flex-row gap-2.5 items-stretch" : "flex-col gap-16"
      )}>
        <div className={cn(
          "aspect-square relative group",
          isLandscapeMobile ? "w-[34%] max-w-[176px] self-center" : "w-full md:w-1/2 max-w-[550px]"
        )}>
          <AnimatePresence mode="wait">
            <motion.img
              key={track.id}
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 1.1, rotate: 5 }}
              src={track.cover}
              alt={track.title}
              className={cn(
                "w-full h-full object-cover shadow-2xl border border-white/10",
                isLandscapeMobile ? "rounded-2xl" : "rounded-[4rem]"
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
        <div className={cn("flex-1 w-full", isLandscapeMobile ? "space-y-2.5" : "space-y-12")}>
          <div className="flex justify-between items-start">
            <div className={cn(isLandscapeMobile ? "space-y-1" : "space-y-3")}>
              <motion.h1
                key={track.title}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={cn(
                  "font-black tracking-tighter",
                  isLandscapeMobile ? "text-2xl" : "text-7xl"
                )}
              >
                {track.title}
              </motion.h1>
              <motion.p
                key={track.artist}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className={cn(
                  "text-muted-foreground font-semibold",
                  isLandscapeMobile ? "text-sm" : "text-4xl"
                )}
              >
                {track.artist}
              </motion.p>
            </div>
            <button
              onClick={() => openMap()}
              className={cn(
                "touch-target bg-white/5 text-muted-foreground hover:text-primary hover:bg-white/10 transition-all",
                isLandscapeMobile ? "p-1.5 rounded-lg" : "p-6 rounded-3xl"
              )}
            >
              <MapIcon className={cn(isLandscapeMobile ? "w-4 h-4" : "w-12 h-12")} />
            </button>
          </div>
          <div className={cn(isLandscapeMobile ? "space-y-3" : "space-y-8")}>
            <Slider
              value={[progress]}
              max={100}
              step={0.1}
              className={cn(isLandscapeMobile ? "h-2" : "h-6")}
              onValueChange={(vals) => setProgress(vals[0])}
            />
            <div className={cn("flex justify-between font-mono text-muted-foreground/60", isLandscapeMobile ? "text-xs" : "text-2xl")}>
              <span>{formatTime((progress / 100) * duration)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          <div className={cn("flex items-center justify-center", isLandscapeMobile ? "gap-4" : "gap-16")}>
            <button onClick={prevTrack} className="touch-target text-muted-foreground hover:text-foreground active:scale-90 transition-all">
              <SkipBack className={cn("fill-current", isLandscapeMobile ? "w-6 h-6" : "w-20 h-20")} />
            </button>
            <button
              onClick={togglePlay}
              className={cn(
                "rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-glow-lg hover:scale-105 active:scale-95 transition-all",
                isLandscapeMobile ? "w-14 h-14" : "w-40 h-40"
              )}
            >
              {isPlaying ? (
                <Pause className={cn("fill-current", isLandscapeMobile ? "w-7 h-7" : "w-20 h-20")} />
              ) : (
                <Play className={cn("fill-current", isLandscapeMobile ? "w-7 h-7 ml-1" : "w-20 h-20 ml-3")} />
              )}
            </button>
            <button onClick={nextTrack} className="touch-target text-muted-foreground hover:text-foreground active:scale-90 transition-all">
              <SkipForward className={cn("fill-current", isLandscapeMobile ? "w-6 h-6" : "w-20 h-20")} />
            </button>
          </div>
          <div className={cn("flex items-center", isLandscapeMobile ? "gap-3 px-0.5" : "gap-10 px-8")}>
            <Volume2 className={cn("text-muted-foreground", isLandscapeMobile ? "w-4 h-4" : "w-10 h-10")} />
            <Slider
              value={[volume * 100]}
              max={100}
              onValueChange={(vals) => setVolume(vals[0] / 100)}
              className={cn("flex-1", isLandscapeMobile ? "h-1.5" : "h-4")}
            />
          </div>
        </div>
      </div>
    </CarLayout>
  );
}