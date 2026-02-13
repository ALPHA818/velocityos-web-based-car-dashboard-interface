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
    if (!formData.label.trim() || isNaN(lat) || isNaN(lon)) return toast.error('Invalid input');
    try {
      await addLocation({ label: formData.label.trim(), address: formData.address.trim() || 'Saved Place', category: formData.category, lat, lon });
      toast.success('Location saved');
      setIsDialogOpen(false);
      setFormData({ label: '', address: '', category: 'favorite', lat: '', lon: '' });
    } catch (err) { toast.error('Failed to save'); }
  };
  const LocationGrid = ({ items, emptyMsg }: { items: SavedLocation[], emptyMsg: string }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.length > 0 ? (
        items.map((loc, idx) => {
          const Icon = CATEGORY_ICONS[loc.category] || MapPin;
          return (
            <motion.button key={loc.id + idx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }} onClick={() => openMap(loc)} className="dashboard-card flex flex-col items-start text-left gap-4 hover:border-primary/50 group bg-zinc-900/40">
              <div className="p-4 rounded-2xl transition-colors" style={{ backgroundColor: `${getCategoryColor(loc.category)}15`, color: getCategoryColor(loc.category) }}><Icon className="w-8 h-8" /></div>
              <div className="flex-1 w-full">
                <div className="flex justify-between items-start">
                  <h3 className="text-2xl font-bold truncate max-w-[80%]">{loc.label}</h3>
                  {loc.lastUsedAt && <span className="text-xs text-muted-foreground whitespace-nowrap mt-2">{formatDistanceToNow(loc.lastUsedAt)} ago</span>}
                </div>
                <p className="text-muted-foreground line-clamp-1">{loc.address}</p>
              </div>
            </motion.button>
          );
        })
      ) : (
        <div className="col-span-full py-20 text-center dashboard-card border-dashed opacity-50">
          <MapPin className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-xl text-muted-foreground font-medium">{emptyMsg}</p>
        </div>
      )}
    </div>
  );
  return (
    <CarLayout>
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="flex justify-between items-end gap-10">
          <div className="flex-1 space-y-4">
            <h1 className="text-6xl font-black tracking-tighter">Navigate</h1>
            <div 
              className="dashboard-card p-6 flex items-center gap-6 cursor-pointer hover:border-primary/50 group transition-all"
              onClick={() => setSearchOverlay(true)}
            >
              <Search className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-2xl font-bold text-muted-foreground">Search destinations anywhere in the world...</span>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-[2rem] h-20 px-10 gap-3 bg-primary text-primary-foreground shadow-glow-lg text-xl font-bold mb-1">
                <Plus className="w-8 h-8" /> Add Place
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[550px] rounded-[3rem] p-10">
              <DialogHeader><DialogTitle className="text-3xl font-black">New Destination</DialogTitle></DialogHeader>
              <form onSubmit={handleSave} className="space-y-8 pt-6">
                <div className="space-y-3"><Label className="text-lg">Label</Label><Input value={formData.label} onChange={e => setFormData(p => ({...p, label: e.target.value}))} className="h-16 bg-zinc-900 border-white/5 rounded-2xl text-xl" /></div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3"><Label className="text-lg">Latitude</Label><Input value={formData.lat} onChange={e => setFormData(p => ({...p, lat: e.target.value}))} className="h-16 bg-zinc-900 border-white/5 rounded-2xl text-xl" /></div>
                  <div className="space-y-3"><Label className="text-lg">Longitude</Label><Input value={formData.lon} onChange={e => setFormData(p => ({...p, lon: e.target.value}))} className="h-16 bg-zinc-900 border-white/5 rounded-2xl text-xl" /></div>
                </div>
                <div className="space-y-3">
                  <Label className="text-lg">Category</Label>
                  <Select value={formData.category} onValueChange={v => setFormData(p => ({...p, category: v as any}))}>
                    <SelectTrigger className="h-16 bg-zinc-900 border-white/5 rounded-2xl text-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10"><SelectItem value="home">Home</SelectItem><SelectItem value="work">Work</SelectItem><SelectItem value="favorite">Favorite</SelectItem></SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full h-20 rounded-2xl text-2xl font-black mt-4">Save Location</Button>
              </form>
            </DialogContent>
          </Dialog>
        </header>
        <Tabs defaultValue="favorites" className="space-y-8">
          <TabsList className="bg-zinc-900/50 p-2 h-20 rounded-[2rem] border border-white/5 w-fit">
            <TabsTrigger value="favorites" className="h-full px-10 rounded-[1.5rem] text-xl font-bold data-[state=active]:bg-primary">Favorites</TabsTrigger>
            <TabsTrigger value="recents" className="h-full px-10 rounded-[1.5rem] text-xl font-bold data-[state=active]:bg-primary">Recent Trips</TabsTrigger>
          </TabsList>
          <TabsContent value="favorites"><LocationGrid items={locations} emptyMsg="No favorites saved yet" /></TabsContent>
          <TabsContent value="recents">
            <div className="space-y-6">
              <div className="flex justify-end"><Button variant="ghost" className="text-muted-foreground hover:text-destructive gap-2 h-14 rounded-2xl px-6" onClick={clearHistory}><Trash2 className="w-5 h-5" /> Clear History</Button></div>
              <LocationGrid items={recentLocations} emptyMsg="Your recent history will appear here" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </CarLayout>
  );
}