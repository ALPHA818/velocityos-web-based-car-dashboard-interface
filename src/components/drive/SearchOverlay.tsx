import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin, Loader2, Navigation, Compass, Clock, Trash2, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigationSearchState } from '@/store/os-domain-hooks';
import { toast } from 'sonner';
export function SearchOverlay() {
  const { isSearchOverlayOpen: isOpen, setSearchOverlay, isSearching, searchResults, searchHistory, performSearch, selectDiscoveredPlace, fetchSearchHistory, clearSearchHistory, saveLocationBookmark } = useNavigationSearchState();
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (isOpen) {
      fetchSearchHistory();
    }
  }, [isOpen, fetchSearchHistory]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 3) performSearch(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleQuickSave = async (result: typeof searchResults[number]) => {
    try {
      const saved = await saveLocationBookmark({
        label: result.label,
        address: result.address,
        lat: result.lat,
        lon: result.lon,
      }, 'favorite');
      toast.success(`${saved.label} saved`);
    } catch {
      toast.error('Failed to save bookmark');
    }
  };

  if (!isOpen) return null;
  const showHistory = query.length < 3 && searchHistory.length > 0;
  return (
    <div className="fixed inset-0 z-[2000] bg-zinc-950/95 backdrop-blur-xl p-6 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-5xl flex flex-col h-full space-y-10">
        <header className="flex items-center gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search destinations, POIs..."
              className="h-24 pl-20 pr-8 text-4xl font-bold bg-white/5 border-white/10 rounded-[2rem] focus-visible:ring-primary shadow-glow transition-all"
            />
          </div>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setSearchOverlay(false)}
            className="h-24 w-24 rounded-[2rem] hover:bg-white/5 text-muted-foreground hover:text-white"
          >
            <X className="w-12 h-12" />
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {isSearching ? (
              <motion.div
                key="searching"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center opacity-50"
              >
                <Loader2 className="w-20 h-20 animate-spin text-primary mb-4" />
                <p className="text-2xl font-black uppercase tracking-widest">Scanning World Data</p>
              </motion.div>
            ) : query.length >= 3 && searchResults.length > 0 ? (
              searchResults.map((res, idx) => (
                <motion.div
                  key={res.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="w-full rounded-[2.5rem] bg-white/5 border border-white/5 hover:border-primary/50 flex items-center gap-4 p-4 text-left transition-all md:gap-8 md:p-8"
                >
                  <button
                    type="button"
                    onClick={() => selectDiscoveredPlace(res)}
                    className="flex min-w-0 flex-1 items-center gap-4 text-left transition-all active:scale-[0.99] md:gap-8"
                  >
                    <div className="rounded-3xl bg-primary/10 p-4 text-primary md:p-6">
                      <MapPin className="h-7 w-7 md:h-10 md:w-10" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-xl font-black md:text-3xl">{res.label}</h3>
                      <p className="line-clamp-1 text-sm text-muted-foreground md:text-xl">{res.address}</p>
                    </div>
                    <div className="rounded-2xl bg-zinc-800/50 p-3 md:p-4">
                      <Navigation className="h-6 w-6 text-muted-foreground md:h-8 md:w-8" />
                    </div>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void handleQuickSave(res)}
                    className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 font-black uppercase tracking-[0.18em] text-muted-foreground hover:bg-black/30 hover:text-white"
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                </motion.div>
              ))
            ) : showHistory ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                  <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-4">
                    <Clock className="w-6 h-6" /> Search History
                  </h2>
                  <Button 
                    variant="ghost" 
                    onClick={clearSearchHistory}
                    className="text-muted-foreground hover:text-destructive gap-2 rounded-xl"
                  >
                    <Trash2 className="w-5 h-5" /> Clear
                  </Button>
                </div>
                {searchHistory.map((res, idx) => (
                  <motion.button
                    key={'hist-'+res.id + idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    onClick={() => selectDiscoveredPlace(res)}
                    className="w-full p-6 rounded-[2rem] bg-zinc-900/50 border border-white/5 hover:bg-zinc-900 flex items-center gap-6 text-left transition-all"
                  >
                    <Clock className="w-8 h-8 text-muted-foreground/50" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-bold truncate">{res.label}</h3>
                      <p className="text-lg text-muted-foreground truncate">{res.address}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : query.length >= 3 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-50 py-20">
                <Compass className="w-24 h-24 mb-6" />
                <p className="text-2xl font-black uppercase tracking-widest text-center">No locations found for "{query}"</p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                <Search className="w-32 h-32 mb-6" />
                <p className="text-3xl font-black uppercase tracking-[0.5em] text-center">Start Typing to Discover</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}