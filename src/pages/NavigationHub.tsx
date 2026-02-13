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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              className="dashboard-card flex flex-col items-start text-left gap-5 hover:border-primary/50 group bg-zinc-900/40 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none uppercase font-black text-2xl group-hover:opacity-10 transition-opacity">
                {loc.category}
              </div>
              <div 
                className="p-5 rounded-2xl transition-all group-hover:scale-110" 
                style={{ backgroundColor: `${getCategoryColor(loc.category)}15`, color: getCategoryColor(loc.category) }}
              >
                <Icon className="w-9 h-9" />
              </div>
              <div className="flex-1 w-full">
                <div className="flex justify-between items-start">
                  <h3 className="text-3xl font-black truncate max-w-[80%] tracking-tight">{loc.label}</h3>
                  {loc.lastUsedAt && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap mt-2 font-bold uppercase tracking-widest opacity-60">
                      {formatDistanceToNow(loc.lastUsedAt)}
                    </span>
                  )}
                </div>
                <p className="text-xl text-muted-foreground line-clamp-1 mt-1 opacity-80">{loc.address}</p>
              </div>
            </motion.button>
          );
        })
      ) : (
        <div className="col-span-full py-24 text-center dashboard-card border-dashed border-white/10 flex flex-col items-center justify-center gap-6">
          <div className="p-10 bg-white/5 rounded-full">
            <Compass className="w-20 h-20 text-muted-foreground opacity-20" />
          </div>
          <div className="space-y-2">
            <p className="text-3xl text-muted-foreground font-black uppercase tracking-widest">{emptyMsg}</p>
            {showAddCta && <p className="text-xl text-muted-foreground/50">Tap "Add Place" to bookmark your first destination.</p>}
          </div>
        </div>
      )}
    </div>
  );
  return (
    <CarLayout>
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-10">
          <div className="flex-1 space-y-6">
            <h1 className="text-7xl font-black tracking-tighter">Navigation</h1>
            <div
              className="dashboard-card p-8 flex items-center gap-8 cursor-pointer hover:border-primary/50 group transition-all bg-primary/5 border-primary/20 shadow-glow"
              onClick={() => setSearchOverlay(true)}
            >
              <Search className="w-12 h-12 text-primary animate-pulse" />
              <span className="text-3xl font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                Search destinations globally...
              </span>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-[2.5rem] h-24 px-12 gap-4 bg-primary text-primary-foreground shadow-glow-lg text-2xl font-black hover:scale-105 transition-transform">
                <Plus className="w-10 h-10" /> Add Destination
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[600px] rounded-[3.5rem] p-12">
              <DialogHeader><DialogTitle className="text-4xl font-black tracking-tighter">New Destination</DialogTitle></DialogHeader>
              <form onSubmit={handleSave} className="space-y-8 pt-8">
                <div className="space-y-4">
                  <Label className="text-xl font-bold ml-2">Display Name</Label>
                  <Input placeholder="e.g. Favorite Coffee Shop" value={formData.label} onChange={e => setFormData(p => ({...p, label: e.target.value}))} className="h-20 bg-zinc-900 border-white/5 rounded-2xl text-2xl px-6" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label className="text-xl font-bold ml-2">Latitude</Label>
                    <Input placeholder="40.7128" value={formData.lat} onChange={e => setFormData(p => ({...p, lat: e.target.value}))} className="h-20 bg-zinc-900 border-white/5 rounded-2xl text-2xl px-6" />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-xl font-bold ml-2">Longitude</Label>
                    <Input placeholder="-74.0060" value={formData.lon} onChange={e => setFormData(p => ({...p, lon: e.target.value}))} className="h-20 bg-zinc-900 border-white/5 rounded-2xl text-2xl px-6" />
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-xl font-bold ml-2">Category</Label>
                  <Select value={formData.category} onValueChange={v => setFormData(p => ({...p, category: v as any}))}>
                    <SelectTrigger className="h-20 bg-zinc-900 border-white/5 rounded-2xl text-2xl px-6"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      <SelectItem value="home" className="text-xl p-4">Home</SelectItem>
                      <SelectItem value="work" className="text-xl p-4">Work</SelectItem>
                      <SelectItem value="favorite" className="text-xl p-4">Favorite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full h-24 rounded-3xl text-3xl font-black mt-4 shadow-glow">Confirm Destination</Button>
              </form>
            </DialogContent>
          </Dialog>
        </header>
        <Tabs defaultValue="favorites" className="space-y-10">
          <div className="flex justify-center">
            <TabsList className="bg-zinc-900/50 p-3 h-24 rounded-[2.5rem] border border-white/5 w-fit shadow-2xl">
              <TabsTrigger value="favorites" className="h-full px-12 rounded-[1.8rem] text-2xl font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Favorites</TabsTrigger>
              <TabsTrigger value="recents" className="h-full px-12 rounded-[1.8rem] text-2xl font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Recent History</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="favorites" className="focus-visible:outline-none">
            <LocationGrid items={locations} emptyMsg="No Bookmarks Found" showAddCta />
          </TabsContent>
          <TabsContent value="recents" className="focus-visible:outline-none space-y-8">
            <div className="flex justify-end">
              <Button variant="ghost" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-3 h-16 rounded-2xl px-8 text-xl font-bold" onClick={clearHistory}>
                <Trash2 className="w-6 h-6" /> Purge History
              </Button>
            </div>
            <LocationGrid items={recentLocations} emptyMsg="No Recent Activity" />
          </TabsContent>
        </Tabs>
      </div>
    </CarLayout>
  );
}