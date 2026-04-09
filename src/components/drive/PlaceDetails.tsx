import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, CheckCircle, Globe, Home, MapPin, Share2, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigationSearchState } from '@/store/os-domain-hooks';

type SaveCategory = 'home' | 'work' | 'favorite';

export function PlaceDetails() {
  const { selectedDiscoveredPlace: place, selectDiscoveredPlace: selectPlace, saveSelectedPlace, locations } = useNavigationSearchState();
  const isSavedByCategory = React.useMemo(() => ({
    favorite: locations.some((location) => location.category === 'favorite' && location.lat.toFixed(5) === place?.lat.toFixed(5) && location.lon.toFixed(5) === place?.lon.toFixed(5)),
    home: locations.some((location) => location.category === 'home' && location.lat.toFixed(5) === place?.lat.toFixed(5) && location.lon.toFixed(5) === place?.lon.toFixed(5)),
    work: locations.some((location) => location.category === 'work' && location.lat.toFixed(5) === place?.lat.toFixed(5) && location.lon.toFixed(5) === place?.lon.toFixed(5)),
  }), [locations, place?.lat, place?.lon]);

  const handleSave = async (category: SaveCategory) => {
    if (!place) return;
    try {
      await saveSelectedPlace(category);
      toast.success(category === 'favorite' ? 'Location saved to favorites' : `Location saved as ${category}`);
    } catch (e) {
      toast.error('Failed to save location');
    }
  };
  const handleShare = () => {
    if (!place) return;
    const shareText = `Check out this place: ${place.label} - https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`;
    navigator.clipboard.writeText(shareText);
    toast.success('Location link copied');
  };
  return (
    <AnimatePresence>
      {place && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute bottom-10 left-32 right-32 z-[115] bg-zinc-950/95 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-10 shadow-glow-lg flex items-center gap-12"
        >
          <div className="w-32 h-32 bg-primary/20 rounded-[2.5rem] flex items-center justify-center text-primary flex-shrink-0">
            <Globe className="w-16 h-16 animate-float" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-2">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-black uppercase tracking-widest rounded-full">New Place Found</span>
              <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-3 h-3" /> {place.lat.toFixed(4)}, {place.lon.toFixed(4)}
              </span>
            </div>
            <h2 className="text-5xl font-black tracking-tighter truncate text-neon">{place.label}</h2>
            <p className="text-xl text-muted-foreground truncate font-medium mt-1">{place.address}</p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={handleShare}
              className="h-20 w-20 rounded-3xl bg-white/5 hover:bg-white/10"
            >
              <Share2 className="w-10 h-10" />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              disabled={isSavedByCategory.home}
              onClick={() => void handleSave('home')}
              className={cn(
                "h-20 w-20 rounded-3xl transition-all",
                isSavedByCategory.home ? "bg-green-500/20 text-green-500 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.3)]" : "bg-white/5 hover:bg-white/10"
              )}
            >
              {isSavedByCategory.home ? <CheckCircle className="w-10 h-10" /> : <Home className="w-10 h-10" />}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              disabled={isSavedByCategory.work}
              onClick={() => void handleSave('work')}
              className={cn(
                "h-20 w-20 rounded-3xl transition-all",
                isSavedByCategory.work ? "bg-green-500/20 text-green-500 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.3)]" : "bg-white/5 hover:bg-white/10"
              )}
            >
              {isSavedByCategory.work ? <CheckCircle className="w-10 h-10" /> : <Briefcase className="w-10 h-10" />}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              disabled={isSavedByCategory.favorite}
              onClick={() => void handleSave('favorite')}
              className={cn(
                "h-20 w-20 rounded-3xl transition-all",
                isSavedByCategory.favorite ? "bg-green-500/20 text-green-500 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.3)]" : "bg-white/5 hover:bg-white/10"
              )}
            >
              {isSavedByCategory.favorite ? <CheckCircle className="w-10 h-10" /> : <Star className="w-10 h-10" />}
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={() => selectPlace(null)}
              className="h-20 px-8 rounded-3xl bg-white/5 text-muted-foreground hover:text-white"
            >
              <X className="w-10 h-10" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}