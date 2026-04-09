import React from 'react';
import { useMediaStore, getMediaDisplay, isLibraryMediaSource } from '@/store/use-media-store';
import { Play, Pause, SkipForward, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsLandscapeMobile } from '@/hooks/use-landscape-mobile';
import { useOSStore } from '@/store/use-os-store';
import { getWidgetSkinById } from '@/lib/cosmetic-market';
export function MiniPlayer() {
  const navigate = useNavigate();
  const activeSource = useMediaStore((s) => s.activeSource);
  const isPlaying = useMediaStore((s) => s.isPlaying);
  const currentTrackIndex = useMediaStore((s) => s.currentTrackIndex);
  const progress = useMediaStore((s) => s.progress);
  const togglePlay = useMediaStore((s) => s.togglePlay);
  const nextTrack = useMediaStore((s) => s.nextTrack);
  const activeWidgetSkinId = useOSStore((s) => s.activeWidgetSkinId);
  const media = getMediaDisplay(activeSource, currentTrackIndex);
  const isLibrarySource = isLibraryMediaSource(activeSource);
  const isLandscapeMobile = useIsLandscapeMobile();
  const activeWidgetSkin = getWidgetSkinById(activeWidgetSkinId) ?? getWidgetSkinById('widget-core-digital');

  const widgetTone = activeWidgetSkin?.style === 'retro'
    ? {
        frame: 'border-amber-300/20 bg-amber-950/18 text-amber-100',
        title: 'font-mono text-amber-100 tracking-[0.03em]',
        subtitle: 'font-mono text-amber-200/70',
        control: 'border-amber-200/20 bg-amber-100/10 text-amber-100 hover:bg-amber-100/15',
        chip: 'border-amber-200/25 bg-amber-100/10 text-amber-200',
        progress: 'bg-gradient-to-r from-amber-200 via-orange-400 to-amber-200',
        meter: 'bg-amber-300',
      }
    : activeWidgetSkin?.style === 'motorsport'
      ? {
          frame: 'border-rose-300/18 bg-zinc-950/40 text-rose-50',
          title: 'text-rose-50 tracking-tight',
          subtitle: 'text-rose-100/65',
          control: 'border-rose-200/18 bg-rose-500/10 text-rose-100 hover:bg-rose-500/15',
          chip: 'border-rose-300/22 bg-rose-500/10 text-rose-200',
          progress: 'bg-gradient-to-r from-rose-300 via-red-500 to-rose-100',
          meter: 'bg-rose-300',
        }
      : activeWidgetSkin?.style === 'luxury'
        ? {
            frame: 'border-white/15 bg-stone-950/45 text-amber-50',
            title: 'font-serif text-amber-50',
            subtitle: 'font-serif text-amber-100/65',
            control: 'border-amber-100/15 bg-white/10 text-amber-50 hover:bg-white/15',
            chip: 'border-amber-100/18 bg-white/10 text-amber-100',
            progress: 'bg-gradient-to-r from-stone-200 via-amber-100 to-amber-200',
            meter: 'bg-amber-100',
          }
        : activeWidgetSkin?.style === 'cyber'
          ? {
              frame: 'border-emerald-400/18 bg-emerald-950/18 text-emerald-50',
              title: 'font-mono text-emerald-100 tracking-[0.05em]',
              subtitle: 'font-mono text-cyan-200/70',
              control: 'border-emerald-300/18 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15',
              chip: 'border-emerald-300/22 bg-emerald-500/10 text-emerald-200',
              progress: 'bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300',
              meter: 'bg-emerald-300',
            }
          : activeWidgetSkin?.style === 'expedition'
            ? {
                frame: 'border-lime-300/18 bg-lime-950/18 text-lime-50',
                title: 'font-mono text-lime-50 tracking-[0.03em]',
                subtitle: 'font-mono text-lime-100/70',
                control: 'border-lime-200/18 bg-lime-500/10 text-lime-50 hover:bg-lime-500/15',
                chip: 'border-lime-200/22 bg-lime-500/10 text-lime-200',
                progress: 'bg-gradient-to-r from-lime-300 via-emerald-300 to-teal-300',
                meter: 'bg-lime-300',
              }
            : {
                frame: 'border-white/10 bg-black/25 text-foreground',
                title: 'text-foreground',
                subtitle: 'text-muted-foreground',
                control: 'border-white/10 bg-white/5 text-foreground hover:bg-white/10',
                chip: 'border-white/10 bg-white/5 text-muted-foreground',
                progress: 'bg-gradient-to-r from-sky-300 via-blue-500 to-cyan-300',
                meter: 'bg-primary',
              };

  return (
    <div 
      className={cn(
        'dashboard-card relative h-full cursor-pointer overflow-hidden border backdrop-blur-xl flex items-center justify-between gap-3 sm:gap-4 md:gap-6 group',
        widgetTone.frame,
        isLandscapeMobile && "gap-2 px-2 py-1.5"
      )}
      style={{ boxShadow: `0 22px 60px -42px ${activeWidgetSkin?.accent ?? 'rgba(59,130,246,0.32)'}` }}
      onClick={() => navigate('/media')}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: `radial-gradient(circle at 20% 18%, ${activeWidgetSkin?.accent ?? 'rgba(59,130,246,0.16)'} 0, transparent 40%)` }} />
      <div className={cn("flex items-center gap-3 sm:gap-4 md:gap-6 min-w-0", isLandscapeMobile && "gap-2")}>
        <div className="relative">
          <img 
            src={media.cover}
            className={cn(
              'w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl object-cover shadow-lg border',
              widgetTone.control,
              isLandscapeMobile && "w-10 h-10 rounded-lg"
            )}
            alt="Album art"
          />
          {isLibrarySource && isPlaying && (
            <div className={cn(
              "absolute -bottom-1 -right-1 flex gap-1 items-end h-6 md:h-8 p-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10",
              isLandscapeMobile && "h-4 p-0.5"
            )}>
              {[0.4, 0.7, 0.3, 0.9].map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: ['20%', '100%', '20%'] }}
                  transition={{ repeat: Infinity, duration: 0.5 + i * 0.1, ease: "easeInOut" }}
                  className={cn('w-0.5 md:w-1 rounded-full', widgetTone.meter, isLandscapeMobile && "w-0.5")}
                  style={{ height: `${h * 100}%` }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className={cn(
            'text-base sm:text-xl md:text-2xl font-bold truncate max-w-[120px] sm:max-w-[150px] md:max-w-[180px]',
            widgetTone.title,
            isLandscapeMobile && "text-xs max-w-[84px]"
          )}>{media.title}</span>
          <span className={cn(
            'text-sm sm:text-base md:text-lg truncate max-w-[120px] sm:max-w-[150px] md:max-w-[180px]',
            widgetTone.subtitle,
            isLandscapeMobile && "text-[10px] max-w-[84px]"
          )}>{media.artist}</span>
        </div>
      </div>
      {isLibrarySource ? (
        <div className={cn("flex items-center shrink-0", isLandscapeMobile ? "gap-1" : "gap-2") }>
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className={cn(
              'w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl border flex items-center justify-center transition-all',
              widgetTone.control,
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
              'w-10 h-10 md:w-12 md:h-12 rounded-xl border flex items-center justify-center transition-all',
              widgetTone.control,
              isLandscapeMobile && "w-8 h-8 rounded-md"
            )}
            aria-label="Next track"
          >
            <SkipForward className={cn("w-4 h-4 md:w-5 md:h-5", isLandscapeMobile && "w-3.5 h-3.5")} />
          </button>
        </div>
      ) : (
        <div className={cn("flex items-center shrink-0", isLandscapeMobile ? "gap-1" : "gap-2")}>
          <div
            className={cn(
              'rounded-full border font-black uppercase tracking-wide',
              widgetTone.chip,
              isLandscapeMobile ? "px-2 py-1 text-[9px]" : "px-3 py-1.5 text-[10px]"
            )}
          >
            Source
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate('/media');
            }}
            className={cn(
              'w-10 h-10 md:w-12 md:h-12 rounded-xl border flex items-center justify-center transition-all',
              widgetTone.control,
              isLandscapeMobile && "w-8 h-8 rounded-md"
            )}
            aria-label="Manage media source"
          >
            <ArrowUpRight className={cn("w-4 h-4 md:w-5 md:h-5", isLandscapeMobile && "w-3.5 h-3.5")} />
          </button>
        </div>
      )}
      <div className={cn(
        "absolute top-0 right-0 p-2 md:p-3 opacity-5 pointer-events-none uppercase font-black text-2xl md:text-4xl",
        isLandscapeMobile && "text-lg p-1.5"
      )}>
        Media
      </div>
      {isLibrarySource ? (
        <div className={cn(
          "absolute left-0 right-0 bottom-0 px-3 md:px-4 pb-2",
          isLandscapeMobile && "px-2 pb-1"
        )}>
          <div className={cn("h-1.5 rounded-full bg-white/10 overflow-hidden", isLandscapeMobile && "h-1")}>
            <div
              className={cn('h-full transition-[width] duration-200', widgetTone.progress)}
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
        </div>
      ) : (
        <div className={cn(
          "absolute left-0 right-0 bottom-0 px-3 md:px-4 pb-2 text-muted-foreground/70 font-medium",
          isLandscapeMobile && "px-2 pb-1 text-[9px]"
        )}>
          Tap to manage this source in Media
        </div>
      )}
    </div>
  );
}
