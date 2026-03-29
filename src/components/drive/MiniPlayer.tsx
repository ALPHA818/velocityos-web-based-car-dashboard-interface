import React from 'react';
import { useMediaStore, getCurrentTrack } from '@/store/use-media-store';
import { Play, Pause, SkipForward } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsLandscapeMobile } from '@/hooks/use-landscape-mobile';
export function MiniPlayer() {
  const navigate = useNavigate();
  const isPlaying = useMediaStore((s) => s.isPlaying);
  const currentTrackIndex = useMediaStore((s) => s.currentTrackIndex);
  const progress = useMediaStore((s) => s.progress);
  const togglePlay = useMediaStore((s) => s.togglePlay);
  const nextTrack = useMediaStore((s) => s.nextTrack);
  const track = getCurrentTrack({ currentTrackIndex } as any);
  const isLandscapeMobile = useIsLandscapeMobile();
  return (
    <div 
      className={cn(
        "dashboard-card h-full flex items-center justify-between gap-3 sm:gap-4 md:gap-6 group cursor-pointer overflow-hidden relative",
        isLandscapeMobile && "gap-2 px-2 py-1.5"
      )}
      onClick={() => navigate('/media')}
    >
      <div className={cn("flex items-center gap-3 sm:gap-4 md:gap-6 min-w-0", isLandscapeMobile && "gap-2")}>
        <div className="relative">
          <img 
            src={track.cover} 
            className={cn(
              "w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl object-cover shadow-lg border border-white/10",
              isLandscapeMobile && "w-10 h-10 rounded-lg"
            )}
            alt="Album art"
          />
          {isPlaying && (
            <div className={cn(
              "absolute -bottom-1 -right-1 flex gap-1 items-end h-6 md:h-8 p-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10",
              isLandscapeMobile && "h-4 p-0.5"
            )}>
              {[0.4, 0.7, 0.3, 0.9].map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: ['20%', '100%', '20%'] }}
                  transition={{ repeat: Infinity, duration: 0.5 + i * 0.1, ease: "easeInOut" }}
                  className={cn("w-0.5 md:w-1 bg-primary rounded-full", isLandscapeMobile && "w-0.5")}
                  style={{ height: `${h * 100}%` }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className={cn(
            "text-base sm:text-xl md:text-2xl font-bold truncate max-w-[120px] sm:max-w-[150px] md:max-w-[180px]",
            isLandscapeMobile && "text-xs max-w-[84px]"
          )}>{track.title}</span>
          <span className={cn(
            "text-sm sm:text-base md:text-lg text-muted-foreground truncate max-w-[120px] sm:max-w-[150px] md:max-w-[180px]",
            isLandscapeMobile && "text-[10px] max-w-[84px]"
          )}>{track.artist}</span>
        </div>
      </div>
      <div className={cn("flex items-center shrink-0", isLandscapeMobile ? "gap-1" : "gap-2") }>
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className={cn(
            "w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all",
            isLandscapeMobile && "w-10 h-10 rounded-lg"
          )}
        >
          {isPlaying ? (
            <Pause className={cn("w-6 h-6 sm:w-7 sm:h-7 md:w-10 md:h-10 fill-current", isLandscapeMobile && "w-4 h-4")} />
          ) : (
            <Play className={cn("w-6 h-6 sm:w-7 sm:h-7 md:w-10 md:h-10 fill-current ml-0.5 md:ml-1", isLandscapeMobile && "w-4 h-4 ml-0.5")} />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            nextTrack();
          }}
          className={cn(
            "w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all",
            isLandscapeMobile && "w-8 h-8 rounded-md"
          )}
          aria-label="Next track"
        >
          <SkipForward className={cn("w-4 h-4 md:w-5 md:h-5", isLandscapeMobile && "w-3.5 h-3.5")} />
        </button>
      </div>
      <div className={cn(
        "absolute top-0 right-0 p-2 md:p-3 opacity-5 pointer-events-none uppercase font-black text-2xl md:text-4xl",
        isLandscapeMobile && "text-lg p-1.5"
      )}>
        Media
      </div>
      <div className={cn(
        "absolute left-0 right-0 bottom-0 px-3 md:px-4 pb-2",
        isLandscapeMobile && "px-2 pb-1"
      )}>
        <div className={cn("h-1.5 rounded-full bg-white/10 overflow-hidden", isLandscapeMobile && "h-1")}>
          <div
            className="h-full bg-primary transition-[width] duration-200"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      </div>
    </div>
  );
}