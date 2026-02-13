import React from 'react';
import { useMediaStore, getCurrentTrack } from '@/store/use-media-store';
import { Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
export function MiniPlayer() {
  const navigate = useNavigate();
  const isPlaying = useMediaStore((s) => s.isPlaying);
  const currentTrackIndex = useMediaStore((s) => s.currentTrackIndex);
  const togglePlay = useMediaStore((s) => s.togglePlay);
  const track = getCurrentTrack({ currentTrackIndex } as any);
  return (
    <div 
      className="dashboard-card h-full flex items-center justify-between group cursor-pointer overflow-hidden relative"
      onClick={() => navigate('/media')}
    >
      <div className="flex items-center gap-6">
        <div className="relative">
          <img 
            src={track.cover} 
            className="w-20 h-20 rounded-2xl object-cover shadow-lg border border-white/10" 
            alt="Album art"
          />
          {isPlaying && (
            <div className="absolute -bottom-1 -right-1 flex gap-1 items-end h-8 p-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
              {[0.4, 0.7, 0.3, 0.9].map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: ['20%', '100%', '20%'] }}
                  transition={{ repeat: Infinity, duration: 0.5 + i * 0.1, ease: "easeInOut" }}
                  className="w-1 bg-primary rounded-full"
                  style={{ height: `${h * 100}%` }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold truncate max-w-[180px]">{track.title}</span>
          <span className="text-lg text-muted-foreground truncate max-w-[180px]">{track.artist}</span>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
        className="w-20 h-20 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
      >
        {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
      </button>
      <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none uppercase font-black text-4xl">
        Media
      </div>
    </div>
  );
}