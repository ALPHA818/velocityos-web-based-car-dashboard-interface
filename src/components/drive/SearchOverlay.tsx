import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '@/store/use-os-store';
import { Search, X, MapPin, Loader2, Navigation, Compass } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
export function SearchOverlay() {
  const isOpen = useOSStore(s => s.isSearchOverlayOpen);
  const setSearchOverlay = useOSStore(s => s.setSearchOverlay);
  const isSearching = useOSStore(s => s.isSearching);
  const searchResults = useOSStore(s => s.searchResults);
  const performSearch = useOSStore(s => s.performSearch);
  const selectDiscoveredPlace = useOSStore(s => s.selectDiscoveredPlace);
  const [query, setQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) performSearch(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, performSearch]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[2000] bg-zinc-950/95 backdrop-blur-xl p-10 flex flex-col items-center">
      <div className="w-full max-w-5xl flex flex-col h-full space-y-8">
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center opacity-50"
              >
                <Loader2 className="w-20 h-20 animate-spin text-primary mb-4" />
                <p className="text-2xl font-black uppercase tracking-widest">Scanning World Data</p>
              </motion.div>
            ) : searchResults.length > 0 ? (
              searchResults.map((res, idx) => (
                <motion.button
                  key={res.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => selectDiscoveredPlace(res)}
                  className="w-full p-8 rounded-[2.5rem] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/50 flex items-center gap-8 text-left transition-all active:scale-[0.98]"
                >
                  <div className="p-6 bg-primary/10 rounded-3xl text-primary">
                    <MapPin className="w-10 h-10" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-black truncate">{res.label}</h3>
                    <p className="text-xl text-muted-foreground line-clamp-1">{res.address}</p>
                  </div>
                  <div className="p-4 bg-zinc-800/50 rounded-2xl">
                    <Navigation className="w-8 h-8 text-muted-foreground" />
                  </div>
                </motion.button>
              ))
            ) : query.length > 2 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-50">
                <Compass className="w-24 h-24 mb-6" />
                <p className="text-2xl font-black uppercase tracking-widest text-center">No locations found for "{query}"</p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20">
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