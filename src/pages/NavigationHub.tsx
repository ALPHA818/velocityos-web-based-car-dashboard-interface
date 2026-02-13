import React, { useEffect } from 'react';
import { CarLayout } from '@/components/layout/CarLayout';
import { useOSStore } from '@/store/use-os-store';
import { MapPin, Home, Briefcase, Star, Plus, Compass } from 'lucide-react';
import { getWazeLink, getGoogleMapsLink } from '@/lib/drive-utils';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
const CATEGORY_ICONS = {
  home: Home,
  work: Briefcase,
  favorite: Star,
  recent: Compass,
};
export function NavigationHub() {
  const locations = useOSStore((s) => s.locations);
  const fetchLocations = useOSStore((s) => s.fetchLocations);
  const mapProvider = useOSStore((s) => s.settings.mapProvider);
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);
  const handleNavigate = (lat: number, lon: number) => {
    const link = mapProvider === 'waze' ? getWazeLink(lat, lon) : getGoogleMapsLink(lat, lon);
    window.location.href = link;
  };
  return (
    <CarLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Navigation</h1>
            <p className="text-muted-foreground mt-1">Select a destination to start your journey</p>
          </div>
          <Button size="lg" className="rounded-2xl h-16 px-8 gap-2">
            <Plus className="w-6 h-6" />
            Add Place
          </Button>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.length > 0 ? (
            locations.map((loc, idx) => {
              const Icon = CATEGORY_ICONS[loc.category] || MapPin;
              return (
                <motion.button
                  key={loc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleNavigate(loc.lat, loc.lon)}
                  className="dashboard-card flex flex-col items-start text-left gap-4 hover:border-primary/50 group"
                >
                  <div className="p-4 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{loc.label}</h3>
                    <p className="text-muted-foreground line-clamp-1">{loc.address}</p>
                  </div>
                </motion.button>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center dashboard-card border-dashed">
              <MapPin className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-xl text-muted-foreground font-medium">No saved locations yet</p>
            </div>
          )}
        </div>
      </div>
    </CarLayout>
  );
}