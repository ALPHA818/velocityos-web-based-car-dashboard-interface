import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { useOSStore } from '@/store/use-os-store';
import { MAP_TILES } from '@/lib/nav-utils';
import { X, Navigation, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Fix for default marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;
const UserIcon = L.divIcon({
  className: 'custom-user-icon',
  html: `<div class="w-6 h-6 bg-primary border-4 border-white rounded-full shadow-glow animate-pulse"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});
function MapController() {
  const map = useMap();
  const currentPos = useOSStore((s) => s.currentPos);
  const activeRoute = useOSStore((s) => s.activeRoute);
  useEffect(() => {
    if (activeRoute && activeRoute.coordinates.length > 0) {
      const bounds = L.latLngBounds(activeRoute.coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (currentPos) {
      map.setView(currentPos, 15);
    }
  }, [activeRoute, currentPos, map]);
  return null;
}
export function MapView() {
  const isMapOpen = useOSStore((s) => s.isMapOpen);
  const closeMap = useOSStore((s) => s.closeMap);
  const currentPos = useOSStore((s) => s.currentPos);
  const activeRoute = useOSStore((s) => s.activeRoute);
  const activeDestination = useOSStore((s) => s.activeDestination);
  const locations = useOSStore((s) => s.locations);
  if (!isMapOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black">
      <MapContainer
        center={currentPos || [40.7128, -74.0060]}
        zoom={13}
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer {...MAP_TILES} />
        {currentPos && (
          <Marker position={currentPos} icon={UserIcon} />
        )}
        {locations.map((loc) => (
          <Marker 
            key={loc.id} 
            position={[loc.lat, loc.lon]}
            opacity={activeDestination?.id === loc.id ? 1 : 0.6}
          />
        ))}
        {activeRoute && (
          <Polyline 
            positions={activeRoute.coordinates} 
            color="#3b82f6" 
            weight={8}
            opacity={0.8}
            lineCap="round"
          />
        )}
        <MapController />
      </MapContainer>
      {/* Overlays */}
      <div className="absolute top-8 left-32 z-[1000] flex gap-4">
        <Button 
          variant="secondary" 
          size="lg" 
          onClick={closeMap}
          className="h-20 w-20 rounded-3xl bg-zinc-900/80 backdrop-blur-xl border-white/10"
        >
          <X className="w-10 h-10" />
        </Button>
        {activeDestination && (
          <div className="dashboard-card py-4 px-8 flex flex-col justify-center min-w-[300px]">
            <span className="text-xs uppercase font-black text-primary tracking-widest">Navigating to</span>
            <span className="text-2xl font-bold">{activeDestination.label}</span>
            {activeRoute && (
              <span className="text-muted-foreground text-sm">
                {(activeRoute.distance / 1000).toFixed(1)} km • {Math.round(activeRoute.duration / 60)} min
              </span>
            )}
          </div>
        )}
      </div>
      <div className="absolute bottom-8 right-8 z-[1000] flex flex-col gap-4">
         <Button 
          variant="secondary" 
          size="lg" 
          className="h-20 w-20 rounded-3xl bg-zinc-900/80 backdrop-blur-xl border-white/10"
          onClick={() => {}} // Leaflet handles internal zoom
        >
          <LocateFixed className="w-10 h-10" />
        </Button>
      </div>
    </div>
  );
}