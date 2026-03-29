import React, { useEffect } from 'react';
import { CarLayout } from '@/components/layout/CarLayout';
import { Speedometer } from '@/components/drive/Speedometer';
import { WeatherWidget } from '@/components/drive/WeatherWidget';
import { MiniPlayer } from '@/components/drive/MiniPlayer';
import { DistanceBubble } from '@/components/drive/DistanceBubble';
import { Toaster } from '@/components/ui/sonner';
import { motion } from 'framer-motion';
import { useOSStore } from '@/store/use-os-store';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsLandscapeMobile } from '@/hooks/use-landscape-mobile';
export function HomePage() {
  const navigate = useNavigate();
  const fetchSettings = useOSStore((s) => s.fetchSettings);
  const fetchLocations = useOSStore((s) => s.fetchLocations);
  const hasLocations = useOSStore((s) => s.locations.length > 0);
  const isLandscapeMobile = useIsLandscapeMobile();

  useEffect(() => {
    fetchSettings();
    if (!hasLocations) {
      fetchLocations();
    }
  }, [fetchSettings, fetchLocations, hasLocations]);

  return (
    <CarLayout>
      <div className={cn(
        "h-auto md:h-full grid md:grid-cols-12 md:grid-rows-6",
        isLandscapeMobile
          ? "grid-cols-2 auto-rows-[minmax(96px,auto)] gap-1.5"
          : "grid-cols-1 auto-rows-[minmax(140px,auto)] gap-3 sm:gap-4 md:gap-6"
      )}>
        {/* Speedometer */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "col-span-1 md:col-span-6 md:row-span-2 min-h-[120px] sm:min-h-[140px] md:min-h-0 dashboard-card flex items-center justify-center relative overflow-hidden",
            isLandscapeMobile && "col-span-1 row-span-1 min-h-[72px]"
          )}
        >
          <Speedometer />
        </motion.div>
        {/* Media (smaller, filled out) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          className={cn(
            "col-span-1 md:col-span-6 md:row-span-2 min-h-[120px] sm:min-h-[140px] md:min-h-0 dashboard-card",
            isLandscapeMobile && "row-span-1 min-h-[72px]"
          )}
        >
          <MiniPlayer />
        </motion.div>
        {/* Total KM Driven (DistanceBubble) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          className={cn(
            "col-span-1 md:col-span-6 md:row-span-2 min-h-[120px] sm:min-h-[140px] md:min-h-0 dashboard-card cursor-pointer",
            isLandscapeMobile && "row-span-1 min-h-[72px]"
          )}
          onClick={() => navigate('/trips')}
        >
          <DistanceBubble />
        </motion.div>
        {/* Navigation Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          className={cn(
            "col-span-1 md:col-span-6 md:row-span-2 min-h-[120px] sm:min-h-[140px] md:min-h-0 dashboard-card cursor-pointer",
            isLandscapeMobile && "row-span-1 min-h-[72px]"
          )}
          onClick={() => navigate('/navigation')}
        >
          <div className="flex flex-col items-center justify-center h-full w-full">
            <span className="text-lg font-bold text-primary mb-1">Navigation</span>
            <span className="text-xs text-muted-foreground">Open navigation tab</span>
          </div>
        </motion.div>
        {/* Temperature/Weather */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          className={cn(
            "col-span-1 md:col-span-6 md:row-span-2 min-h-[120px] sm:min-h-[140px] md:min-h-0 dashboard-card",
            isLandscapeMobile && "row-span-1 min-h-[72px]"
          )}
        >
          <WeatherWidget />
        </motion.div>
      </div>
      <Toaster theme="dark" richColors position="top-center" />
    </CarLayout>
  );
}