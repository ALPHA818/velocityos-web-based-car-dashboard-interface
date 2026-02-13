import React, { useEffect } from 'react';
import { CarLayout } from '@/components/layout/CarLayout';
import { Speedometer } from '@/components/drive/Speedometer';
import { DigitalClock } from '@/components/drive/DigitalClock';
import { WeatherWidget } from '@/components/drive/WeatherWidget';
import { MiniPlayer } from '@/components/drive/MiniPlayer';
import { Toaster } from '@/components/ui/sonner';
import { motion } from 'framer-motion';
import { useOSStore } from '@/store/use-os-store';
import { ArrowRight, MapPinOff } from 'lucide-react';
export function HomePage() {
  const fetchSettings = useOSStore((s) => s.fetchSettings);
  const fetchLocations = useOSStore((s) => s.fetchLocations);
  const locations = useOSStore((s) => s.locations);
  const openMap = useOSStore((s) => s.openMap);
  const gpsStatus = useOSStore((s) => s.gpsStatus);
  useEffect(() => {
    fetchSettings();
    fetchLocations();
  }, [fetchSettings, fetchLocations]);
  const homeLocation = locations.find(l => l.category === 'home');
  const handleGoHome = () => {
    if (homeLocation) {
      openMap(homeLocation);
    }
  };
  return (
    <CarLayout>
      <div className="h-full grid grid-cols-12 grid-rows-6 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-8 row-span-4 dashboard-card flex items-center justify-center relative overflow-hidden"
        >
          {gpsStatus === 'denied' && (
            <div className="absolute top-6 left-6 z-10 px-4 py-2 bg-destructive/20 border border-destructive/30 rounded-full flex items-center gap-2">
              <MapPinOff className="w-4 h-4 text-destructive" />
              <span className="text-xs font-black text-destructive uppercase tracking-widest">No GPS Signal</span>
            </div>
          )}
          <div className="absolute top-0 left-0 p-4 opacity-5 pointer-events-none">
            <span className="text-9xl font-black">DRIVE</span>
          </div>
          <Speedometer />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-4 row-span-3 dashboard-card"
        >
          <DigitalClock />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-4 row-span-3"
        >
          <MiniPlayer />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="col-span-4 row-span-2 dashboard-card"
        >
          <WeatherWidget />
        </motion.div>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          disabled={!homeLocation}
          onClick={handleGoHome}
          className="col-span-4 row-span-2 dashboard-card flex flex-col justify-center p-8 overflow-hidden relative group text-left disabled:opacity-50"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowRight className="w-20 h-20 -rotate-45" />
          </div>
          <h3 className="text-xl font-bold text-muted-foreground uppercase tracking-wider">Ready to go?</h3>
          <p className="text-4xl font-black mt-1 text-primary">
            {homeLocation ? `Head ${homeLocation.label}` : 'Set Home'}
          </p>
          <div className="mt-4 flex gap-2">
            <div className="h-3 w-16 bg-primary rounded-full shadow-glow" />
            <div className="h-3 w-4 bg-zinc-700 rounded-full" />
            <div className="h-3 w-4 bg-zinc-700 rounded-full" />
          </div>
        </motion.button>
      </div>
      <Toaster theme="dark" richColors position="top-center" />
    </CarLayout>
  );
}