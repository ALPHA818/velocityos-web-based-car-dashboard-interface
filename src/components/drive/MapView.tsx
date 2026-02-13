import React, { useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useOSStore } from '@/store/use-os-store';
import { getCategoryColor, formatETA, getMapStyle, getMapFilter } from '@/lib/nav-utils';
import type { GeoJSON } from 'geojson';
import { X, Navigation, Share2, Compass, Globe, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TrackingOverlay } from './TrackingOverlay';
import { SearchOverlay } from './SearchOverlay';
import { PlaceDetails } from './PlaceDetails';
import { motion, AnimatePresence } from 'framer-motion';
export function MapView() {
  const isMapOpen = useOSStore(s => s.isMapOpen);
  const closeMap = useOSStore(s => s.closeMap);
  const activeRoute = useOSStore(s => s.activeRoute);
  const activeDestination = useOSStore(s => s.activeDestination);
  const isFollowing = useOSStore(s => s.isFollowing);
  const setFollowing = useOSStore(s => s.setFollowing);
  const isSharingLive = useOSStore(s => s.isSharingLive);
  const mapTheme = useOSStore(s => s.settings.mapTheme);
  const mapPerspective = useOSStore(s => s.settings.mapPerspective);
  const toggleMapPerspective = useOSStore(s => s.toggleMapPerspective);
  const currentPos = useOSStore(s => s.currentPos);
  const currentHeading = useOSStore(s => s.currentHeading);
  const locations = useOSStore(s => s.locations);
  const setSearchOverlay = useOSStore(s => s.setSearchOverlay);
  const discoveredPlace = useOSStore(s => s.selectedDiscoveredPlace);
  const mapRef = useRef<any>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showShare, setShowShare] = React.useState(false);
  useEffect(() => {
    if (isMapOpen && currentPos && isFollowing && mapRef.current) {
      const isDriving = mapPerspective === 'driving';
      const flyOptions: any = {
        center: [currentPos[1], currentPos[0]],
        zoom: isDriving ? 17.5 : 14.5,
        pitch: isDriving ? 60 : 0,
        bearing: isDriving ? (currentHeading ?? 0) : 0,
        essential: true,
        duration: 1500,
      };
      if (isDriving) {
        flyOptions.padding = { top: 300, bottom: 50, left: 0, right: 0 };
      }
      mapRef.current?.flyTo(flyOptions);
    }
  }, [currentPos, currentHeading, isFollowing, isMapOpen, mapPerspective]);
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (map) map.getCanvas().style.filter = getMapFilter(mapTheme);
  }, [mapTheme, isMapOpen]);
  const handleMapInteraction = () => {
    if (isFollowing) setFollowing(false);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => setFollowing(true), 15000);
  };
  const mapStyle = useMemo(() => getMapStyle(mapTheme), [mapTheme]);
  const routeGeoJSON = useMemo((): GeoJSON.Feature<GeoJSON.LineString> | null => {
    if (!activeRoute) return null;
    return {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: activeRoute.coordinates.map(c => [c[1], c[0]]) }
    };
  }, [activeRoute]);
  if (!isMapOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: currentPos ? currentPos[1] : -74.006,
          latitude: currentPos ? currentPos[0] : 40.7128,
          zoom: 13,
          pitch: mapPerspective === 'driving' ? 60 : 0,
          bearing: 0
        }}
        mapStyle={mapStyle}
        onDrag={handleMapInteraction}
        onWheel={handleMapInteraction}
        style={{ width: '100%', height: '100%' }}
      >
        {currentPos && (
          <Marker longitude={currentPos[1]} latitude={currentPos[0]}>
            <div className="relative flex items-center justify-center">
              <motion.div animate={{ scale: [1, 2.5], opacity: [0.5, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute w-12 h-12 bg-primary rounded-full" />
              <div className="custom-user-icon w-12 h-12 bg-primary border-4 border-white rounded-full shadow-glow z-10 flex items-center justify-center">
                <Navigation className="w-6 h-6 text-white fill-current" />
              </div>
            </div>
          </Marker>
        )}
        {discoveredPlace && (
          <Marker longitude={discoveredPlace.lon} latitude={discoveredPlace.lat}>
            <div className="w-12 h-12 bg-primary border-4 border-white rounded-full shadow-glow animate-bounce flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
          </Marker>
        )}
        {locations.map((loc) => (
          <Marker key={loc.id} longitude={loc.lon} latitude={loc.lat}>
            <div
              className="custom-pin-icon w-8 h-8 rounded-full border-4 border-white shadow-glow transition-all"
              style={{ backgroundColor: getCategoryColor(loc.category), transform: activeDestination?.id === loc.id ? 'scale(1.5) translateY(-10px)' : 'scale(1)' }}
            />
          </Marker>
        ))}
        {routeGeoJSON && (
          <Source id="route-source" type="geojson" data={routeGeoJSON}>
            <Layer id="route-layer-glow" type="line" paint={{ 'line-color': '#3b82f6', 'line-width': 22, 'line-opacity': 0.25, 'line-blur': 12 }} />
            <Layer id="route-layer" type="line" layout={{ 'line-join': 'round', 'line-cap': 'round' }} paint={{ 'line-color': '#3b82f6', 'line-width': 12, 'line-opacity': 1 }} />
          </Source>
        )}
      </Map>
      <div className="absolute top-8 left-32 right-8 z-[110] flex justify-between items-start">
        <div className="flex gap-4">
          <Button variant="secondary" size="lg" onClick={closeMap} className="h-24 w-24 rounded-[2rem] bg-zinc-950/90 backdrop-blur-3xl border border-white/10 shadow-glow">
            <X className="w-12 h-12" />
          </Button>
          <AnimatePresence>
            {(activeDestination || discoveredPlace) && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-primary/90 backdrop-blur-3xl p-6 rounded-[2.5rem] flex flex-col justify-center min-w-[350px] border border-white/20 shadow-glow-lg">
                <span className="text-xs uppercase font-black text-white/70 tracking-widest flex items-center gap-2">
                  <Navigation className="w-4 h-4 fill-current" /> Navigating To
                </span>
                <span className="text-4xl font-black text-white truncate max-w-[400px] text-neon">
                  {(activeDestination || discoveredPlace)?.label}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex flex-col gap-4">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setSearchOverlay(true)}
            className="h-24 w-24 rounded-[2rem] bg-zinc-950/90 backdrop-blur-3xl border border-white/10 shadow-glow"
          >
            <Search className="w-12 h-12" />
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setShowShare(true)}
            className={cn("h-24 w-24 rounded-[2rem] bg-zinc-950/90 backdrop-blur-3xl border border-white/10 shadow-glow", isSharingLive && "text-primary border-primary/50")}
          >
            <Share2 className="w-12 h-12" />
          </Button>
        </div>
      </div>
      <div className="absolute bottom-10 right-10 z-[110] flex flex-col gap-6">
        <Button variant={mapPerspective === 'top-down' ? "default" : "secondary"} size="lg" className={cn("h-24 w-24 rounded-[2.5rem] backdrop-blur-3xl border border-white/10 shadow-glow-lg", mapPerspective === 'top-down' ? "bg-primary text-white" : "bg-zinc-950/90 text-muted-foreground")} onClick={() => toggleMapPerspective()}>
          <Globe className="w-12 h-12" />
        </Button>
        <Button variant={mapPerspective === 'driving' ? "default" : "secondary"} size="lg" className={cn("h-24 w-24 rounded-[2.5rem] backdrop-blur-3xl border border-white/10 shadow-glow-lg", mapPerspective === 'driving' ? "bg-primary text-white" : "bg-zinc-950/90 text-muted-foreground")} onClick={() => toggleMapPerspective()}>
          <Navigation className="w-12 h-12" />
        </Button>
        <Button variant={isFollowing ? "default" : "secondary"} size="lg" className={cn("h-24 w-24 rounded-[2.5rem] backdrop-blur-3xl border border-white/10 shadow-glow-lg", isFollowing ? "bg-primary" : "bg-zinc-950/90")} onClick={() => setFollowing(true)}>
          <Compass className={cn("w-12 h-12", isFollowing && "animate-pulse")} />
        </Button>
      </div>
      <PlaceDetails />
      <SearchOverlay />
      {showShare && <TrackingOverlay onClose={() => setShowShare(false)} />}
    </div>
  );
}