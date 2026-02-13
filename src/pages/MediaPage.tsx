import React from 'react';
import ReactPlayer from 'react-player';
import { CarLayout } from '@/components/layout/CarLayout';
import { useMediaStore, getCurrentTrack } from '@/store/use-media-store';
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';
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
  const setDuration = useMediaStore((s) => s.setDuration);
  const track = getCurrentTrack({ currentTrackIndex } as any);
  const handleProgress = (state: { played: number }) => {
    if (isPlaying) setProgress(state.played * 100);
  };
  return (
    <CarLayout>
      <div className="h-full flex flex-col md:flex-row gap-12 items-center">
        {/* ReactPlayer hidden core */}
        <div className="hidden">
          <ReactPlayer
            url={track.url}
            playing={isPlaying}
            volume={volume}
            onProgress={handleProgress}
            onDuration={(d) => setDuration(d)}
            width="0"
            height="0"
          />
        </div>
        {/* Album Art Section */}
        <div className="w-full md:w-1/2 aspect-square max-w-[500px] relative group">
          <AnimatePresence mode="wait">
            <motion.img
              key={track.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              src={track.cover}
              alt={track.title}
              className="w-full h-full object-cover rounded-5xl shadow-2xl border border-white/10"
            />
          </AnimatePresence>
          {isPlaying && (
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -inset-4 bg-primary/20 blur-3xl -z-10"
            />
          )}
        </div>
        {/* Controls Section */}
        <div className="flex-1 w-full space-y-12">
          <div className="space-y-2">
            <motion.h1 
              key={track.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-6xl font-black tracking-tighter"
            >
              {track.title}
            </motion.h1>
            <motion.p 
              key={track.artist}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-3xl text-muted-foreground font-medium"
            >
              {track.artist}
            </motion.p>
          </div>
          <div className="space-y-6">
            <Slider
              value={[progress]}
              max={100}
              step={0.1}
              className="h-4"
              onValueChange={(vals) => setProgress(vals[0])}
            />
            <div className="flex justify-between text-xl font-mono text-muted-foreground">
              <span>{Math.floor((progress / 100) * duration / 60)}:{String(Math.floor(((progress / 100) * duration) % 60)).padStart(2, '0')}</span>
              <span>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-12">
            <button onClick={prevTrack} className="touch-target text-muted-foreground hover:text-foreground active:scale-90 transition-all">
              <SkipBack className="w-16 h-16 fill-current" />
            </button>
            <button 
              onClick={togglePlay} 
              className="w-32 h-32 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-glow-lg hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause className="w-16 h-16 fill-current" /> : <Play className="w-16 h-16 fill-current ml-2" />}
            </button>
            <button onClick={nextTrack} className="touch-target text-muted-foreground hover:text-foreground active:scale-90 transition-all">
              <SkipForward className="w-16 h-16 fill-current" />
            </button>
          </div>
          <div className="flex items-center gap-6 px-12">
            <Volume2 className="w-8 h-8 text-muted-foreground" />
            <Slider
              value={[volume * 100]}
              max={100}
              onValueChange={(vals) => useMediaStore.getState().setVolume(vals[0] / 100)}
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </CarLayout>
  );
}