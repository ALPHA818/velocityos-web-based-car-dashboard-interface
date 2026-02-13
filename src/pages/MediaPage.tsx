import React from 'react';
import { CarLayout } from '@/components/layout/CarLayout';
import { useMediaStore, getTrack } from '@/store/use-media-store';
import { useOSStore } from '@/store/use-os-store';
import { Play, Pause, SkipForward, SkipBack, Volume2, Map as MapIcon } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
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
  const track = getTrack(currentTrackIndex);
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };
  return (
    <CarLayout>
      <div className="h-full flex flex-col md:flex-row gap-16 items-center">
        <div className="w-full md:w-1/2 aspect-square max-w-[550px] relative group">
          <AnimatePresence mode="wait">
            <motion.img
              key={track.id}
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 1.1, rotate: 5 }}
              src={track.cover}
              alt={track.title}
              className="w-full h-full object-cover rounded-[4rem] shadow-2xl border border-white/10"
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
        <div className="flex-1 w-full space-y-12">
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <motion.h1
                key={track.title}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-7xl font-black tracking-tighter"
              >
                {track.title}
              </motion.h1>
              <motion.p
                key={track.artist}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-4xl text-muted-foreground font-semibold"
              >
                {track.artist}
              </motion.p>
            </div>
            <button
              onClick={() => openMap()}
              className="touch-target p-6 rounded-3xl bg-white/5 text-muted-foreground hover:text-primary hover:bg-white/10 transition-all"
            >
              <MapIcon className="w-12 h-12" />
            </button>
          </div>
          <div className="space-y-8">
            <Slider
              value={[progress]}
              max={100}
              step={0.1}
              className="h-6"
              onValueChange={(vals) => setProgress(vals[0])}
            />
            <div className="flex justify-between text-2xl font-mono text-muted-foreground/60">
              <span>{formatTime((progress / 100) * duration)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-16">
            <button onClick={prevTrack} className="touch-target text-muted-foreground hover:text-foreground active:scale-90 transition-all">
              <SkipBack className="w-20 h-20 fill-current" />
            </button>
            <button
              onClick={togglePlay}
              className="w-40 h-40 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-glow-lg hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? (
                <Pause className="w-20 h-20 fill-current" />
              ) : (
                <Play className="w-20 h-20 fill-current ml-3" />
              )}
            </button>
            <button onClick={nextTrack} className="touch-target text-muted-foreground hover:text-foreground active:scale-90 transition-all">
              <SkipForward className="w-20 h-20 fill-current" />
            </button>
          </div>
          <div className="flex items-center gap-10 px-8">
            <Volume2 className="w-10 h-10 text-muted-foreground" />
            <Slider
              value={[volume * 100]}
              max={100}
              onValueChange={(vals) => setVolume(vals[0] / 100)}
              className="flex-1 h-4"
            />
          </div>
        </div>
      </div>
    </CarLayout>
  );
}