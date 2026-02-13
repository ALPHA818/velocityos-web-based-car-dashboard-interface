import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useOSStore } from '@/store/use-os-store';
import { MAP_THEMES, getCategoryColor, formatETA } from '@/lib/nav-utils';
import { X, Navigation, Share2, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TrackingOverlay } from './TrackingOverlay';
const UserIcon = L.divIcon({
  className: 'custom-user-icon',
  html: `<div class="w-10 h-10 bg-primary border-4 border-white rounded-full shadow-glow animate-pulse"></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});
const getColoredIcon = (color: string) => L.divIcon({
  className: 'custom-pin-icon',
  html: `<div class="w-10 h-10 rounded-full border-4 border-white shadow-glow" style="background-color: ${color}"></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});
function MapContent() {
  const map = useMap();
  const currentPos = useOSStore((s) => s.currentPos);
  const activeRoute = useOSStore((s) => s.activeRoute);
  const isFollowing = useOSStore((s) => s.isFollowing);
  const setFollowing = useOSStore((s) => s.setFollowing);
  const isMapOpen = useOSStore((s) => s.isMapOpen);
  const activeDestination = useOSStore((s) => s.activeDestination);
  const locations = useOSStore((s) => s.locations);
  const mapTheme = useOSStore((s) => s.settings.mapTheme);
  useEffect(() => {
    if (isMapOpen) {
      setTimeout(() => map.invalidateSize(), 150);
    }
  }, [isMapOpen, map]);
  useMapEvents({
    dragstart: () => setFollowing(false)
  });
  useEffect(() => {
    if (!isFollowing) return;
    if (activeRoute && activeRoute.coordinates.length > 0) {
      const bounds = L.latLngBounds(activeRoute.coordinates);
      map.fitBounds(bounds, { padding: [120, 120], animate: true });
    } else if (currentPos) {
      map.setView(currentPos, 16, { animate: true });
    }
  }, [activeRoute, currentPos, isFollowing, map]);
  const themeConfig = MAP_THEMES[mapTheme] || MAP_THEMES.highway;
  return (
    <>
      <TileLayer url={themeConfig.url} attribution="&copy; OpenStreetMap &copy; CARTO" />
      {currentPos && (
        <Marker position={currentPos} icon={UserIcon} zIndexOffset={1000} />
      )}
      {locations.map((loc) => (
        <Marker
          key={loc.id}
          position={[loc.lat, loc.lon]}
          opacity={activeDestination?.id === loc.id ? 1 : 0.7}
          icon={getColoredIcon(getCategoryColor(loc.category))}
        />
      ))}
      {activeRoute && (
        <Polyline
          positions={activeRoute.coordinates}
          color="#3b82f6"
          weight={18}
          opacity={0.9}
          lineCap="round"
          className="shadow-glow-lg"
        />
      )}
    </>
  );
}
export function MapView() {
  const isMapOpen = useOSStore((s) => s.isMapOpen);
  const closeMap = useOSStore((s) => s.closeMap);
  const activeRoute = useOSStore((s) => s.activeRoute);
  const activeDestination = useOSStore((s) => s.activeDestination);
  const isFollowing = useOSStore((s) => s.isFollowing);
  const setFollowing = useOSStore((s) => s.setFollowing);
  const isSharingLive = useOSStore((s) => s.isSharingLive);
  const mapTheme = useOSStore((s) => s.settings.mapTheme);
  const currentPos = useOSStore((s) => s.currentPos);
  const [showShare, setShowShare] = useState(false);
  if (!isMapOpen) return null;
  const themeClass = `map-${mapTheme}-filter`;
  return (
    <div className={cn("fixed inset-0 z-[100] bg-black", themeClass)}>
      <MapContainer
        center={currentPos || [40.7128, -74.0060]}
        zoom={13}
        minZoom={10}
        zoomControl={false}
        className="w-full h-full"
      >
        <MapContent />
      </MapContainer>
      <div className="absolute top-8 left-32 right-8 z-[1000] flex justify-between items-start pointer-events-none">
        <div className="flex gap-4 pointer-events-auto">
          <Button
            variant="secondary"
            size="lg"
            onClick={closeMap}
            className="h-24 w-24 rounded-[2rem] bg-zinc-900/95 backdrop-blur-3xl border-white/20 shadow-glow"
          >
            <X className="w-12 h-12" />
          </Button>
          {activeDestination && (
            <div className="bg-primary/80 backdrop-blur-3xl p-6 rounded-[2.5rem] flex flex-col justify-center min-w-[350px] border border-white/20 shadow-glow-lg">
              <span className="text-sm uppercase font-black text-white tracking-widest flex items-center gap-2">
                <Navigation className="w-4 h-4 fill-current" /> Navigating To
              </span>
              <span className="text-4xl font-black text-white truncate max-w-[400px] text-neon">{activeDestination.label}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4 pointer-events-auto">
          {isSharingLive && (
            <div className="px-6 py-2 bg-red-600 text-white text-sm font-black rounded-full animate-pulse shadow-glow flex items-center gap-2 uppercase">
              <div className="w-3 h-3 bg-white rounded-full" /> Live
            </div>
          )}
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setShowShare(true)}
            className={cn("h-24 w-24 rounded-[2rem] bg-zinc-900/95 backdrop-blur-3xl border-white/20 shadow-glow", isSharingLive && "text-primary")}
          >
            <Share2 className="w-12 h-12" />
          </Button>
        </div>
      </div>
      <div className="absolute bottom-8 right-8 z-[1000] flex flex-col gap-4">
         <Button
          variant={isFollowing ? "default" : "secondary"}
          size="lg"
          className={cn(
            "h-24 w-24 rounded-[2rem] backdrop-blur-3xl border-white/20 transition-all shadow-glow-lg",
            isFollowing ? "bg-primary" : "bg-zinc-900/95"
          )}
          onClick={() => setFollowing(true)}
        >
          <Compass className={cn("w-12 h-12", isFollowing && "animate-pulse")} />
        </Button>
      </div>
      {activeRoute && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] w-[800px] pointer-events-none">
          <div className="bg-primary/90 backdrop-blur-3xl border border-white/30 rounded-[3.5rem] p-10 flex items-center justify-between shadow-glow-lg pointer-events-auto">
            <div className="flex flex-col">
              <span className="text-white/70 font-black uppercase text-sm tracking-[0.3em]">Arrival</span>
              <span className="text-6xl font-black tabular-nums text-white text-neon">{formatETA(activeRoute.duration).split(' ')[0]}</span>
            </div>
            <div className="h-20 w-px bg-white/20 mx-6" />
            <div className="flex flex-col items-center">
              <span className="text-white/70 font-black uppercase text-sm tracking-[0.3em]">Duration</span>
              <span className="text-5xl font-black tabular-nums text-white">{Math.round(activeRoute.duration / 60)} <span className="text-2xl">min</span></span>
            </div>
            <div className="h-20 w-px bg-white/20 mx-6" />
            <div className="flex flex-col items-end">
              <span className="text-white/70 font-black uppercase text-sm tracking-[0.3em]">Distance</span>
              <span className="text-5xl font-black tabular-nums text-white">{(activeRoute.distance / 1000).toFixed(1)} <span className="text-2xl">km</span></span>
            </div>
          </div>
        </div>
      )}
      {showShare && <TrackingOverlay onClose={() => setShowShare(false)} />}
    </div>
  );
}