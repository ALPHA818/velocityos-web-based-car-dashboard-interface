import React, { useEffect, useState } from 'react';
import { CarLayout } from '@/components/layout/CarLayout';
import { useOSStore } from '@/store/use-os-store';
import { MapPin, Home, Briefcase, Star, Plus, Compass, X } from 'lucide-react';
import { getWazeLink, getGoogleMapsLink } from '@/lib/drive-utils';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
const CATEGORY_ICONS = {
  home: Home,
  work: Briefcase,
  favorite: Star,
  recent: Compass,
};
export function NavigationHub() {
  const locations = useOSStore((s) => s.locations);
  const fetchLocations = useOSStore((s) => s.fetchLocations);
  const addLocation = useOSStore((s) => s.addLocation);
  const mapProvider = useOSStore((s) => s.settings.mapProvider);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    address: '',
    category: 'favorite' as any,
    lat: '',
    lon: ''
  });
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);
  const handleNavigate = (lat: number, lon: number) => {
    const link = mapProvider === 'waze' ? getWazeLink(lat, lon) : getGoogleMapsLink(lat, lon);
    window.location.href = link;
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label || !formData.lat || !formData.lon) {
      toast.error('Please fill in required fields');
      return;
    }
    try {
      await addLocation({
        label: formData.label,
        address: formData.address,
        category: formData.category,
        lat: parseFloat(formData.lat),
        lon: parseFloat(formData.lon),
      });
      toast.success('Location saved');
      setIsDialogOpen(false);
      setFormData({ label: '', address: '', category: 'favorite', lat: '', lon: '' });
    } catch (err) {
      toast.error('Failed to save location');
    }
  };
  return (
    <CarLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Navigation</h1>
            <p className="text-muted-foreground mt-1">Select a destination to start your journey</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-2xl h-16 px-8 gap-2 bg-primary text-primary-foreground shadow-glow">
                <Plus className="w-6 h-6" />
                Add Place
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-[500px] rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">New Destination</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Label (e.g. Grandma's House)</Label>
                  <Input 
                    id="label" 
                    value={formData.label} 
                    onChange={e => setFormData(p => ({...p, label: e.target.value}))} 
                    className="h-14 bg-zinc-800 border-white/5 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lat">Latitude</Label>
                    <Input 
                      id="lat" 
                      placeholder="40.7128"
                      value={formData.lat} 
                      onChange={e => setFormData(p => ({...p, lat: e.target.value}))} 
                      className="h-14 bg-zinc-800 border-white/5 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lon">Longitude</Label>
                    <Input 
                      id="lon" 
                      placeholder="-74.0060"
                      value={formData.lon} 
                      onChange={e => setFormData(p => ({...p, lon: e.target.value}))} 
                      className="h-14 bg-zinc-800 border-white/5 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={v => setFormData(p => ({...p, category: v as any}))}>
                    <SelectTrigger className="h-14 bg-zinc-800 border-white/5 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-white/10">
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="favorite">Favorite</SelectItem>
                      <SelectItem value="recent">Recent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full h-16 rounded-2xl text-xl font-bold">Save Location</Button>
              </form>
            </DialogContent>
          </Dialog>
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
                    <p className="text-muted-foreground line-clamp-1">{loc.address || 'Saved Location'}</p>
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