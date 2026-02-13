import React, { useEffect } from 'react';
import { CarLayout } from '@/components/layout/CarLayout';
import { Speedometer } from '@/components/drive/Speedometer';
import { DigitalClock } from '@/components/drive/DigitalClock';
import { WeatherWidget } from '@/components/drive/WeatherWidget';
import { AppGrid } from '@/components/drive/AppGrid';
import { Toaster } from '@/components/ui/sonner';
import { motion } from 'framer-motion';
import { useOSStore } from '@/store/use-os-store';
import { getWazeLink, getGoogleMapsLink } from '@/lib/drive-utils';
export function HomePage() {
  const fetchSettings = useOSStore((s) => s.fetchSettings);
  const fetchLocations = useOSStore((s) => s.fetchLocations);
  const locations = useOSStore((s) => s.locations);
  const settings = useOSStore((s) => s.settings);
  useEffect(() => {
    fetchSettings();
    fetchLocations();
  }, [fetchSettings, fetchLocations]);
  const homeLocation = locations.find(l => l.category === 'home');
  const mapProvider = settings.mapProvider;
  const handleGoHome = () => {
    if (!homeLocation) return;
    const link = mapProvider === 'waze' 
      ? getWazeLink(homeLocation.lat, homeLocation.lon) 
      : getGoogleMapsLink(homeLocation.lat, homeLocation.lon);
    window.location.href = link;
  };
  return (
    <CarLayout>
      <div className="h-full grid grid-cols-12 grid-rows-6 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-7 row-span-4 dashboard-card flex items-center justify-center"
        >
          <Speedometer />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-5 row-span-3 dashboard-card"
        >
          <DigitalClock />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-5 row-span-3"
        >
          <AppGrid />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="col-span-3 row-span-2 dashboard-card"
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
            <span className="text-6xl font-black">NAV</span>
          </div>
          <h3 className="text-xl font-bold text-muted-foreground uppercase tracking-wider">Ready to go?</h3>
          <p className="text-3xl font-bold mt-1 text-primary">
            {homeLocation ? `Head ${homeLocation.label}` : 'Set Home'}
          </p>
          <div className="mt-4 flex gap-2">
            <div className="h-2 w-12 bg-primary rounded-full" />
            <div className="h-2 w-4 bg-zinc-700 rounded-full" />
          </div>
        </motion.button>
      </div>
      <Toaster theme="dark" richColors position="top-center" />
    </CarLayout>
  );
}