import React, { useEffect, useState } from 'react';
import { CarLayout } from '@/components/layout/CarLayout';
import { useOSStore } from '@/store/use-os-store';
import { MapPin, Home, Briefcase, Star, Plus, Compass, Clock, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { SavedLocation } from '@shared/types';
import { getCategoryColor } from '@/lib/nav-utils';
import { cn } from '@/lib/utils';
import { useIsLandscapeMobile } from '@/hooks/use-landscape-mobile';
const CATEGORY_ICONS = {
  home: Home,
  work: Briefcase,
  favorite: Star,
  recent: Clock,
};
export function NavigationHub() {
  const locations = useOSStore(s => s.locations);
  const recentLocations = useOSStore(s => s.recentLocations);
  const fetchLocations = useOSStore(s => s.fetchLocations);
  const fetchRecentLocations = useOSStore(s => s.fetchRecentLocations);
  const addLocation = useOSStore(s => s.addLocation);
  const clearHistory = useOSStore(s => s.clearHistory);
  const openMap = useOSStore(s => s.openMap);
  const setSearchOverlay = useOSStore(s => s.setSearchOverlay);
  const isLandscapeMobile = useIsLandscapeMobile();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ label: '', address: '', category: 'favorite' as any, lat: '', lon: '' });
  useEffect(() => {
    fetchLocations();
    fetchRecentLocations();
  }, [fetchLocations, fetchRecentLocations]);
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(formData.lat);
    const lon = parseFloat(formData.lon);
    if (!formData.label.trim() || isNaN(lat) || isNaN(lon)) return toast.error('Please fill all required fields');
    try {
      await addLocation({ 
        label: formData.label.trim(), 
        address: formData.address.trim() || 'Saved Destination', 
        category: formData.category, 
        lat, 
        lon 
      });
      toast.success('Destination secured');
      setIsDialogOpen(false);
      setFormData({ label: '', address: '', category: 'favorite', lat: '', lon: '' });
    } catch (err) { toast.error('System failed to save location'); }
  };
  const LocationGrid = ({ items, emptyMsg, showAddCta = false }: { items: SavedLocation[], emptyMsg: string, showAddCta?: boolean }) => (
    <div className={cn(
      "grid",
      isLandscapeMobile ? "grid-cols-2 gap-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
    )}>
      {items.length > 0 ? (
        items.map((loc, idx) => {
          const Icon = CATEGORY_ICONS[loc.category] || MapPin;
          return (
            <motion.button 
              key={loc.id + idx} 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ delay: idx * 0.04 }} 
              onClick={() => openMap(loc)} 
              className={cn(
                "dashboard-card flex flex-col items-start text-left hover:border-primary/50 group bg-zinc-900/40 relative overflow-hidden",
                isLandscapeMobile ? "gap-3 p-3 rounded-2xl" : "gap-5"
              )}
            >
              <div className={cn(
                "absolute top-0 right-0 opacity-5 pointer-events-none uppercase font-black group-hover:opacity-10 transition-opacity",
                isLandscapeMobile ? "p-2 text-xl" : "p-4 text-2xl"
              )}>
                {loc.category}
              </div>
              <div 
                className={cn("transition-all group-hover:scale-110", isLandscapeMobile ? "p-3 rounded-xl" : "p-5 rounded-2xl")} 
                style={{ backgroundColor: `${getCategoryColor(loc.category)}15`, color: getCategoryColor(loc.category) }}
              >
                <Icon className={cn(isLandscapeMobile ? "w-6 h-6" : "w-9 h-9")} />
              </div>
              <div className="flex-1 w-full">
                <div className="flex justify-between items-start">
                  <h3 className={cn("font-black truncate max-w-[80%] tracking-tight", isLandscapeMobile ? "text-xl" : "text-3xl")}>{loc.label}</h3>
                  {loc.lastUsedAt && (
                    <span className={cn(
                      "text-muted-foreground whitespace-nowrap mt-2 font-bold uppercase tracking-widest opacity-60",
                      isLandscapeMobile ? "text-[10px]" : "text-xs"
                    )}>
                      {formatDistanceToNow(loc.lastUsedAt)}
                    </span>
                  )}
                </div>
                <p className={cn("text-muted-foreground line-clamp-1 mt-1 opacity-80", isLandscapeMobile ? "text-base" : "text-xl")}>{loc.address}</p>
              </div>
            </motion.button>
          );
        })
      ) : (
        <div className={cn(
          "col-span-full text-center dashboard-card border-dashed border-white/10 flex flex-col items-center justify-center",
          isLandscapeMobile ? "py-12 gap-4 rounded-2xl" : "py-24 gap-6"
        )}>
          <div className={cn("bg-white/5 rounded-full", isLandscapeMobile ? "p-6" : "p-10")}>
            <Compass className={cn("text-muted-foreground opacity-20", isLandscapeMobile ? "w-12 h-12" : "w-20 h-20")} />
          </div>
          <div className="space-y-2">
            <p className={cn("text-muted-foreground font-black uppercase tracking-widest", isLandscapeMobile ? "text-xl" : "text-3xl")}>{emptyMsg}</p>
            {showAddCta && <p className={cn("text-muted-foreground/50", isLandscapeMobile ? "text-sm" : "text-xl")}>Tap "Add Place" to bookmark your first destination.</p>}
          </div>
        </div>
      )}
    </div>
  );
  return (
    <CarLayout>
      <div className={cn("max-w-7xl mx-auto", isLandscapeMobile ? "space-y-4" : "space-y-12")}>
        <header className={cn("flex flex-col lg:flex-row justify-between lg:items-end", isLandscapeMobile ? "gap-3" : "gap-10")}>
          <div className={cn("flex-1", isLandscapeMobile ? "space-y-2" : "space-y-6")}>
            <h1 className={cn("font-black tracking-tighter", isLandscapeMobile ? "text-4xl" : "text-7xl")}>Navigation</h1>
            <div
              className={cn(
                "dashboard-card flex items-center cursor-pointer hover:border-primary/50 group transition-all bg-primary/5 border-primary/20 shadow-glow",
                isLandscapeMobile ? "p-3 gap-3 rounded-2xl" : "p-8 gap-8"
              )}
              onClick={() => setSearchOverlay(true)}
            >
              <Search className={cn("text-primary animate-pulse", isLandscapeMobile ? "w-7 h-7" : "w-12 h-12")} />
              <span className={cn("font-bold text-muted-foreground group-hover:text-foreground transition-colors", isLandscapeMobile ? "text-base" : "text-3xl")}>
                Search destinations globally...
              </span>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className={cn(
                  "bg-primary text-primary-foreground shadow-glow-lg font-black hover:scale-105 transition-transform",
                  isLandscapeMobile ? "rounded-2xl h-14 px-6 gap-2 text-base" : "rounded-[2.5rem] h-24 px-12 gap-4 text-2xl"
                )}
              >
                <Plus className={cn(isLandscapeMobile ? "w-5 h-5" : "w-10 h-10")} /> Add Destination
              </Button>
            </DialogTrigger>
            <DialogContent className={cn(
              "bg-zinc-950 border-white/10 text-white",
              isLandscapeMobile ? "sm:max-w-[460px] rounded-3xl p-6" : "sm:max-w-[600px] rounded-[3.5rem] p-12"
            )}>
              <DialogHeader><DialogTitle className={cn("font-black tracking-tighter", isLandscapeMobile ? "text-2xl" : "text-4xl")}>New Destination</DialogTitle></DialogHeader>
              <form onSubmit={handleSave} className={cn(isLandscapeMobile ? "space-y-4 pt-4" : "space-y-8 pt-8")}>
                <div className={cn(isLandscapeMobile ? "space-y-2" : "space-y-4")}>
                  <Label className={cn("font-bold ml-2", isLandscapeMobile ? "text-sm" : "text-xl")}>Display Name</Label>
                  <Input
                    placeholder="e.g. Favorite Coffee Shop"
                    value={formData.label}
                    onChange={e => setFormData(p => ({...p, label: e.target.value}))}
                    className={cn("bg-zinc-900 border-white/5 rounded-2xl", isLandscapeMobile ? "h-12 text-base px-4" : "h-20 text-2xl px-6")}
                  />
                </div>
                <div className={cn("grid grid-cols-2", isLandscapeMobile ? "gap-3" : "gap-6")}>
                  <div className={cn(isLandscapeMobile ? "space-y-2" : "space-y-4")}>
                    <Label className={cn("font-bold ml-2", isLandscapeMobile ? "text-sm" : "text-xl")}>Latitude</Label>
                    <Input
                      placeholder="40.7128"
                      value={formData.lat}
                      onChange={e => setFormData(p => ({...p, lat: e.target.value}))}
                      className={cn("bg-zinc-900 border-white/5 rounded-2xl", isLandscapeMobile ? "h-12 text-base px-4" : "h-20 text-2xl px-6")}
                    />
                  </div>
                  <div className={cn(isLandscapeMobile ? "space-y-2" : "space-y-4")}>
                    <Label className={cn("font-bold ml-2", isLandscapeMobile ? "text-sm" : "text-xl")}>Longitude</Label>
                    <Input
                      placeholder="-74.0060"
                      value={formData.lon}
                      onChange={e => setFormData(p => ({...p, lon: e.target.value}))}
                      className={cn("bg-zinc-900 border-white/5 rounded-2xl", isLandscapeMobile ? "h-12 text-base px-4" : "h-20 text-2xl px-6")}
                    />
                  </div>
                </div>
                <div className={cn(isLandscapeMobile ? "space-y-2" : "space-y-4")}>
                  <Label className={cn("font-bold ml-2", isLandscapeMobile ? "text-sm" : "text-xl")}>Category</Label>
                  <Select value={formData.category} onValueChange={v => setFormData(p => ({...p, category: v as any}))}>
                    <SelectTrigger className={cn("bg-zinc-900 border-white/5 rounded-2xl", isLandscapeMobile ? "h-12 text-base px-4" : "h-20 text-2xl px-6")}><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      <SelectItem value="home" className={cn(isLandscapeMobile ? "text-base p-2" : "text-xl p-4")}>Home</SelectItem>
                      <SelectItem value="work" className={cn(isLandscapeMobile ? "text-base p-2" : "text-xl p-4")}>Work</SelectItem>
                      <SelectItem value="favorite" className={cn(isLandscapeMobile ? "text-base p-2" : "text-xl p-4")}>Favorite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className={cn("w-full font-black shadow-glow", isLandscapeMobile ? "h-12 rounded-xl text-base mt-2" : "h-24 rounded-3xl text-3xl mt-4")}>Confirm Destination</Button>
              </form>
            </DialogContent>
          </Dialog>
        </header>
        <Tabs defaultValue="favorites" className={cn(isLandscapeMobile ? "space-y-4" : "space-y-10")}>
          <div className="flex justify-center">
            <TabsList className={cn(
              "bg-zinc-900/50 border border-white/5 w-fit shadow-2xl",
              isLandscapeMobile ? "p-1.5 h-12 rounded-2xl" : "p-3 h-24 rounded-[2.5rem]"
            )}>
              <TabsTrigger
                value="favorites"
                className={cn(
                  "h-full font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all",
                  isLandscapeMobile ? "px-5 rounded-xl text-sm" : "px-12 rounded-[1.8rem] text-2xl"
                )}
              >
                Favorites
              </TabsTrigger>
              <TabsTrigger
                value="recents"
                className={cn(
                  "h-full font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all",
                  isLandscapeMobile ? "px-5 rounded-xl text-sm" : "px-12 rounded-[1.8rem] text-2xl"
                )}
              >
                Recent History
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="favorites" className="focus-visible:outline-none">
            <LocationGrid items={locations} emptyMsg="No Bookmarks Found" showAddCta />
          </TabsContent>
          <TabsContent value="recents" className={cn("focus-visible:outline-none", isLandscapeMobile ? "space-y-3" : "space-y-8")}>
            <div className="flex justify-end">
              <Button
                variant="ghost"
                className={cn(
                  "text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-bold",
                  isLandscapeMobile ? "gap-2 h-10 rounded-xl px-4 text-sm" : "gap-3 h-16 rounded-2xl px-8 text-xl"
                )}
                onClick={clearHistory}
              >
                <Trash2 className={cn(isLandscapeMobile ? "w-4 h-4" : "w-6 h-6")} /> Purge History
              </Button>
            </div>
            <LocationGrid items={recentLocations} emptyMsg="No Recent Activity" />
          </TabsContent>
        </Tabs>
      </div>
    </CarLayout>
  );
}