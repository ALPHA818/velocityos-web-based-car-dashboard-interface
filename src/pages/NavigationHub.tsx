import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { CarLayout } from '@/components/layout/CarLayout';
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
import { type LocationCategory, type SavedLocation } from '@shared/types';
import { getCategoryColor } from '@/lib/nav-utils';
import { cn } from '@/lib/utils';
import { useIsLandscapeMobile } from '@/hooks/use-landscape-mobile';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { formatRouteDistance, formatRouteMinutes, getNavigationAlert } from '@/lib/navigation-status';
import { SystemStatePanel } from '@/components/system/SystemStatePanel';
import { useNavigationCollectionsState, useNavigationMapShellState, useNavigationStatusState } from '@/store/os-domain-hooks';

interface LocationFormState {
  label: string;
  address: string;
  category: LocationCategory;
  lat: string;
  lon: string;
}

const CATEGORY_ICONS = {
  home: Home,
  work: Briefcase,
  favorite: Star,
  recent: Clock,
};

type QuickSaveCategory = Exclude<LocationCategory, 'recent'>;

const LazyMapView = lazy(() => import('@/components/drive/MapView').then((module) => ({ default: module.MapView })));

export function NavigationHub() {
  const { locations, recentLocations, fetchLocations, fetchRecentLocations, addLocation, saveCurrentLocation, promoteRecentLocation, clearHistory, openMap, setSearchOverlay } = useNavigationCollectionsState();
  const { isMapOpen, closeMap } = useNavigationMapShellState();
  const { gpsStatus, currentPos, activeDestination, activeRoute, routeState, routeFailureKind, routeFailureMessage, lastGpsFixAt } = useNavigationStatusState();
  const isLandscapeMobile = useIsLandscapeMobile();
  const network = useNetworkStatus({ offlineGraceMs: 3000 });
  const mapSectionRef = useRef<HTMLElement | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusNow, setStatusNow] = useState(() => Date.now());
  const [formData, setFormData] = useState<LocationFormState>({
    label: '',
    address: '',
    category: 'favorite',
    lat: '',
    lon: '',
  });
  const navigationAlert = useMemo(() => getNavigationAlert({
    gpsStatus,
    routeState,
    routeFailureKind,
    routeFailureMessage,
    lastGpsFixAt,
    activeDestination,
    activeRoute,
    now: statusNow,
  }), [gpsStatus, routeState, routeFailureKind, routeFailureMessage, lastGpsFixAt, activeDestination, activeRoute, statusNow]);
  const canSaveCurrentPosition = Boolean(currentPos) && gpsStatus === 'granted';

  const statusCardClassName = navigationAlert?.tone === 'destructive'
    ? 'border-rose-400/35 bg-rose-500/15 text-rose-50'
    : navigationAlert?.tone === 'warning'
      ? 'border-amber-400/35 bg-amber-500/15 text-amber-50'
      : navigationAlert?.tone === 'success'
        ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-50'
        : 'border-cyan-400/25 bg-cyan-500/10 text-cyan-50';

  useEffect(() => {
    fetchLocations();
    fetchRecentLocations();
  }, [fetchLocations, fetchRecentLocations]);
  useEffect(() => {
    const interval = window.setInterval(() => setStatusNow(Date.now()), 5000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isMapOpen) {
      return;
    }

    mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [isMapOpen]);
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
  const handleQuickSaveCurrent = async (category: QuickSaveCategory) => {
    try {
      const saved = await saveCurrentLocation(category);
      toast.success(`${saved.label} saved`);
    } catch {
      toast.error('Current location is unavailable right now');
    }
  };

  const handlePromoteRecent = async (loc: SavedLocation, category: QuickSaveCategory) => {
    try {
      await promoteRecentLocation(loc, category);
      toast.success(`${loc.label} promoted to ${category}`);
    } catch {
      toast.error(`Failed to promote ${loc.label}`);
    }
  };

  const LocationGrid = ({ items, emptyMsg, showAddCta = false, variant = 'favorites' }: { items: SavedLocation[], emptyMsg: string, showAddCta?: boolean, variant?: 'favorites' | 'recents' }) => (
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
                {variant === 'recents' && (
                  <div className={cn('mt-3 flex flex-wrap gap-2', isLandscapeMobile ? 'text-[10px]' : 'text-xs')}>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handlePromoteRecent(loc, 'home');
                      }}
                      className="rounded-full border border-white/15 bg-black/25 px-3 py-1.5 font-black uppercase tracking-[0.18em] text-white/80 transition-colors hover:bg-black/35"
                    >
                      Set Home
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handlePromoteRecent(loc, 'work');
                      }}
                      className="rounded-full border border-white/15 bg-black/25 px-3 py-1.5 font-black uppercase tracking-[0.18em] text-white/80 transition-colors hover:bg-black/35"
                    >
                      Set Work
                    </button>
                  </div>
                )}
              </div>
            </motion.button>
          );
        })
      ) : (
        <div className="col-span-full">
          <SystemStatePanel
            kind="empty"
            compact={isLandscapeMobile}
            eyebrow={variant === 'recents' ? 'Recent history' : 'Bookmarks'}
            title={emptyMsg}
            message={showAddCta
              ? 'Search globally, add a manual destination, or save the current car position to build your first bookmark.'
              : 'Search for a place or start a trip to build up recent destinations.'}
            primaryAction={{ label: 'Search Destinations', onClick: () => setSearchOverlay(true) }}
            secondaryAction={showAddCta
              ? { label: 'Add Destination', onClick: () => setIsDialogOpen(true) }
              : canSaveCurrentPosition
                ? { label: 'Save Current Spot', onClick: () => { void handleQuickSaveCurrent('favorite'); } }
                : undefined}
          />
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
                  <Select value={formData.category} onValueChange={(value: LocationCategory) => setFormData((prev) => ({ ...prev, category: value }))}>
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
        <section ref={mapSectionRef} className="dashboard-card overflow-hidden border border-white/10 bg-zinc-950/45">
          <div className={cn(
            'flex items-center justify-between border-b border-white/10 bg-black/20',
            isLandscapeMobile ? 'px-3 py-3' : 'px-5 py-4'
          )}>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/70">Map tab</div>
              <h2 className={cn('mt-2 font-black tracking-tight', isLandscapeMobile ? 'text-xl' : 'text-3xl')}>
                {isMapOpen ? (activeDestination?.label ?? 'Live map view') : 'Open the embedded map'}
              </h2>
              <p className={cn('mt-2 text-muted-foreground', isLandscapeMobile ? 'text-[11px]' : 'text-sm')}>
                {isMapOpen
                  ? 'The map stays inside Navigation so the rest of the tab remains visible.'
                  : 'Launch the map here to keep search, route status, and saved destinations visible around it.'}
              </p>
            </div>
            {isMapOpen ? (
              <Button
                type="button"
                variant="secondary"
                onClick={closeMap}
                className={cn(
                  'whitespace-nowrap font-black',
                  isLandscapeMobile ? 'h-11 gap-2 rounded-xl px-4 text-sm' : 'h-14 gap-3 rounded-2xl px-6 text-base'
                )}
              >
                <MapPin className={cn(isLandscapeMobile ? 'h-4 w-4' : 'h-5 w-5')} /> Close Map
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => openMap()}
                className={cn(
                  'whitespace-nowrap font-black shadow-glow',
                  isLandscapeMobile ? 'h-11 gap-2 rounded-xl px-4 text-sm' : 'h-14 gap-3 rounded-2xl px-6 text-base'
                )}
              >
                <Compass className={cn(isLandscapeMobile ? 'h-4 w-4' : 'h-5 w-5')} /> Open Map
              </Button>
            )}
          </div>
          <div className={cn(isLandscapeMobile ? 'h-[18rem]' : 'h-[28rem] lg:h-[34rem]')}>
            {isMapOpen ? (
              <Suspense fallback={null}>
                <LazyMapView />
              </Suspense>
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-muted-foreground">
                <div className="max-w-xl">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Ready</div>
                  <div className={cn('mt-3 font-black tracking-tight text-white', isLandscapeMobile ? 'text-xl' : 'text-3xl')}>
                    The map opens inside this tab
                  </div>
                  <p className={cn('mt-3', isLandscapeMobile ? 'text-[11px]' : 'text-sm')}>
                    Saved places, search tools, and route cards stay on screen while the map runs in this section.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
        <section className={cn('grid', isLandscapeMobile ? 'grid-cols-1 gap-3' : 'md:grid-cols-12 gap-4')}>
          <div className={cn('dashboard-card border md:col-span-7', statusCardClassName)}>
            <div className={cn('flex h-full flex-col justify-between', isLandscapeMobile ? 'gap-3 p-3' : 'gap-4 p-5')}>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">Route readiness</div>
                <h2 className={cn('mt-2 font-black tracking-tight', isLandscapeMobile ? 'text-xl' : 'text-3xl')}>
                  {navigationAlert?.title ?? 'Navigation is ready for a destination'}
                </h2>
                <p className={cn('mt-2 text-white/75', isLandscapeMobile ? 'text-[11px]' : 'text-sm')}>
                  {navigationAlert?.detail ?? 'Search globally, open a saved place, or pin a recent destination to build the next route.'}
                </p>
              </div>
              <div className={cn('grid', isLandscapeMobile ? 'grid-cols-3 gap-2' : 'grid-cols-3 gap-3')}>
                <div className="rounded-[1.2rem] border border-white/10 bg-black/20 px-3 py-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">GPS</div>
                  <div className="mt-1 font-black uppercase">{gpsStatus}</div>
                </div>
                <div className="rounded-[1.2rem] border border-white/10 bg-black/20 px-3 py-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">Network</div>
                  <div className="mt-1 font-black uppercase">{network.isOnline ? 'online' : 'offline'}</div>
                </div>
                <div className="rounded-[1.2rem] border border-white/10 bg-black/20 px-3 py-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">Route</div>
                  <div className="mt-1 font-black uppercase">{navigationAlert?.compactLabel ?? 'idle'}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="dashboard-card border md:col-span-5">
            <div className={cn('flex h-full flex-col justify-between', isLandscapeMobile ? 'gap-3 p-3' : 'gap-4 p-5')}>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Current target</div>
                <h2 className={cn('mt-2 font-black tracking-tight', isLandscapeMobile ? 'text-xl' : 'text-3xl')}>
                  {activeDestination?.label ?? 'No destination armed'}
                </h2>
                <p className={cn('mt-2 text-muted-foreground', isLandscapeMobile ? 'text-[11px]' : 'text-sm')}>
                  {activeDestination ? 'Open the map to continue turn-by-turn guidance or refresh the route state.' : 'Use search or tap a saved card below to move into map mode immediately.'}
                </p>
              </div>
              <div className={cn('grid', isLandscapeMobile ? 'grid-cols-2 gap-2' : 'grid-cols-2 gap-3')}>
                <div className="rounded-[1.2rem] border border-white/10 bg-white/5 px-3 py-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Distance</div>
                  <div className={cn('mt-1 font-black tabular-nums', isLandscapeMobile ? 'text-lg' : 'text-2xl')}>{formatRouteDistance(activeRoute?.distance)}</div>
                </div>
                <div className="rounded-[1.2rem] border border-white/10 bg-white/5 px-3 py-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">ETA</div>
                  <div className={cn('mt-1 font-black tabular-nums', isLandscapeMobile ? 'text-lg' : 'text-2xl')}>{formatRouteMinutes(activeRoute?.duration)}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className={cn('grid', isLandscapeMobile ? 'grid-cols-1 gap-2' : 'grid-cols-3 gap-4')}>
          <button
            type="button"
            onClick={() => setSearchOverlay(true)}
            className="dashboard-card flex items-center justify-between border border-primary/20 bg-primary/10 text-left"
          >
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/80">Instant search</div>
              <div className={cn('mt-2 font-black tracking-tight', isLandscapeMobile ? 'text-lg' : 'text-2xl')}>Search and go</div>
              <p className={cn('mt-2 text-muted-foreground', isLandscapeMobile ? 'text-[11px]' : 'text-sm')}>Find a place globally and launch guidance immediately.</p>
            </div>
            <Search className={cn('text-primary', isLandscapeMobile ? 'h-6 w-6' : 'h-8 w-8')} />
          </button>
          <button
            type="button"
            onClick={() => void handleQuickSaveCurrent('favorite')}
            disabled={!canSaveCurrentPosition}
            className="dashboard-card flex items-center justify-between border border-white/10 bg-white/5 text-left disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Current location</div>
              <div className={cn('mt-2 font-black tracking-tight', isLandscapeMobile ? 'text-lg' : 'text-2xl')}>Save current spot</div>
              <p className={cn('mt-2 text-muted-foreground', isLandscapeMobile ? 'text-[11px]' : 'text-sm')}>Use the live GPS fix to create a bookmark in one tap.</p>
            </div>
            <MapPin className={cn(isLandscapeMobile ? 'h-6 w-6' : 'h-8 w-8')} />
          </button>
          <div className="dashboard-card border border-white/10 bg-white/5">
            <div className={cn('grid h-full', isLandscapeMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-3')}>
              <button
                type="button"
                onClick={() => void handleQuickSaveCurrent('home')}
                disabled={!canSaveCurrentPosition}
                className="rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4 text-left transition-colors hover:bg-black/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Quick assign</div>
                <div className={cn('mt-2 font-black tracking-tight', isLandscapeMobile ? 'text-base' : 'text-xl')}>Set Home</div>
              </button>
              <button
                type="button"
                onClick={() => void handleQuickSaveCurrent('work')}
                disabled={!canSaveCurrentPosition}
                className="rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4 text-left transition-colors hover:bg-black/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Quick assign</div>
                <div className={cn('mt-2 font-black tracking-tight', isLandscapeMobile ? 'text-base' : 'text-xl')}>Set Work</div>
              </button>
            </div>
          </div>
        </section>
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
            <LocationGrid items={recentLocations} emptyMsg="No Recent Activity" variant="recents" />
          </TabsContent>
        </Tabs>
      </div>
    </CarLayout>
  );
}
