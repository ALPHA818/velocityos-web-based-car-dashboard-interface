import React, { useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useOSStore } from '@/store/use-os-store';
import { getCategoryColor, formatETA, getMapStyle, getMapFilter } from '@/lib/nav-utils';
import type { GeoJSON } from 'geojson';
import { X, Navigation, Share2, Compass, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TrackingOverlay } from './TrackingOverlay';
import { motion, AnimatePresence } from 'framer-motion';
export function MapView() {
  const isMapOpen = useOSStore((s) => s.isMapOpen);
  const closeMap = useOSStore((s) => s.closeMap);
  const activeRoute = useOSStore((s) => s.activeRoute);
  const activeDestination = useOSStore((s) => s.activeDestination);
  const isFollowing = useOSStore((s) => s.isFollowing);
  const setFollowing = useOSStore((s) => s.setFollowing);
  const isSharingLive = useOSStore((s) => s.isSharingLive);
  const mapTheme = useOSStore((s) => s.settings.mapTheme);
  const mapPerspective = useOSStore((s) => s.mapPerspective);
  const toggleMapPerspective = useOSStore((s) => s.toggleMapPerspective);
  const currentPos = useOSStore((s) => s.currentPos);
  const currentHeading = useOSStore((s) => s.currentHeading);
  const locations = useOSStore((s) => s.locations);
  const mapRef = useRef<any>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showShare, setShowShare] = React.useState(false);
  // Sync Map View Perspective
  useEffect(() => {
    if (isMapOpen && currentPos && isFollowing && mapRef.current) {
      const isDriving = mapPerspective === 'driving';
      mapRef.current.flyTo({
        center: [currentPos[1], currentPos[0]],
        zoom: isDriving ? 17 : 14,
        pitch: isDriving ? 60 : 0,
        bearing: isDriving ? (currentHeading ?? 0) : 0,
        essential: true,
        duration: 2000
      });
    }
  }, [currentPos, currentHeading, isFollowing, isMapOpen, mapPerspective]);
  // Apply map theme filter
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      const canvas = map.getCanvas();
      canvas.style.filter = getMapFilter(mapTheme);
    }
  }, [mapTheme, isMapOpen]);
  // Handle offline/online status
  useEffect(() => {
    const handleStatus = () => {
      const map = mapRef.current?.getMap();
      if (!map) return;
      const canvas = map.getCanvas();
      canvas.style.filter = navigator.onLine ? getMapFilter(mapTheme) : 'grayscale(1) saturate(0) brightness(0.6)';
    };
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, [mapTheme]);
  const handleMapInteraction = () => {
    if (isFollowing) setFollowing(false);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      setFollowing(true);
    }, 15000);
  };
  const mapStyle = useMemo(() => getMapStyle(mapTheme), [mapTheme]);
  const routeGeoJSON = useMemo((): GeoJSON.Feature<GeoJSON.LineString> | null => {
    if (!activeRoute) return null;
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: activeRoute.coordinates.map(c => [c[1], c[0]])
      }
    };
  }, [activeRoute]);
  if (!isMapOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden">
      {/* Dynamic Safe Zone Gradient */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-black/80 to-transparent z-[101] pointer-events-none transition-opacity duration-500",
        mapPerspective === 'top-down' ? "opacity-30" : "opacity-100"
      )} />
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
              <motion.div
                animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                className="absolute w-12 h-12 bg-primary rounded-full"
              />
              <div 
                className="custom-user-icon w-10 h-10 bg-primary border-4 border-white rounded-full shadow-glow z-10 flex items-center justify-center"
                style={{ transform: mapPerspective === 'driving' ? `rotate(${currentHeading ?? 0}deg)` : 'none' }}
              >
                <Navigation className="w-5 h-5 text-white fill-current" />
              </div>
            </div>
          </Marker>
        )}
        {locations.map((loc) => (
          <Marker key={loc.id} longitude={loc.lon} latitude={loc.lat}>
            <div
              className="custom-pin-icon w-8 h-8 rounded-full border-4 border-white shadow-glow transition-all duration-300"
              style={{
                backgroundColor: getCategoryColor(loc.category),
                transform: activeDestination?.id === loc.id ? 'scale(1.5) translateY(-10px)' : 'scale(1)'
              }}
            />
          </Marker>
        ))}
        {routeGeoJSON && (
          <Source id="route-source" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-layer-glow"
              type="line"
              paint={{
                'line-color': '#3b82f6',
                'line-width': 20,
                'line-opacity': 0.2,
                'line-blur': 10
              }}
            />
            <Layer
              id="route-layer"
              type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{
                'line-color': '#3b82f6',
                'line-width': 12,
                'line-opacity': 1
              }}
            />
          </Source>
        )}
      </Map>
      {/* Header UI */}
      <div className="absolute top-8 left-32 right-8 z-[110] flex justify-between items-start">
        <div className="flex gap-4">
          <Button
            variant="secondary"
            size="lg"
            onClick={closeMap}
            className="h-24 w-24 rounded-[2rem] bg-zinc-950/90 backdrop-blur-3xl border border-white/10 shadow-glow active:scale-90 transition-transform"
          >
            <X className="w-12 h-12" />
          </Button>
          <AnimatePresence>
            {activeDestination && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-primary/90 backdrop-blur-3xl p-6 rounded-[2.5rem] flex flex-col justify-center min-w-[350px] border border-white/20 shadow-glow-lg"
              >
                <span className="text-xs uppercase font-black text-white/70 tracking-widest flex items-center gap-2">
                  <Navigation className="w-4 h-4 fill-current" /> Navigating To
                </span>
                <span className="text-4xl font-black text-white truncate max-w-[400px] text-neon">{activeDestination.label}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex flex-col gap-4">
          {isSharingLive && (
            <div className="px-6 py-2 bg-red-600 text-white text-sm font-black rounded-full animate-pulse shadow-glow flex items-center gap-2 uppercase self-end">
              <div className="w-3 h-3 bg-white rounded-full" /> Live
            </div>
          )}
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setShowShare(true)}
            className={cn(
              "h-24 w-24 rounded-[2rem] bg-zinc-950/90 backdrop-blur-3xl border border-white/10 shadow-glow active:scale-90 transition-transform",
              isSharingLive && "text-primary border-primary/50"
            )}
          >
            <Share2 className="w-12 h-12" />
          </Button>
        </div>
      </div>
      {/* Perspective Toggle & Compass */}
      <div className="absolute bottom-10 right-10 z-[110] flex flex-col gap-6">
         <Button
          variant="secondary"
          size="lg"
          className="h-24 w-24 rounded-[2.5rem] bg-zinc-950/90 backdrop-blur-3xl border border-white/10 shadow-glow-lg active:scale-90 transition-all"
          onClick={toggleMapPerspective}
        >
          {mapPerspective === 'driving' ? <Layers className="w-12 h-12" /> : <Navigation className="w-12 h-12" />}
        </Button>
         <Button
          variant={isFollowing ? "default" : "secondary"}
          size="lg"
          className={cn(
            "h-24 w-24 rounded-[2.5rem] backdrop-blur-3xl border border-white/10 transition-all shadow-glow-lg active:scale-90",
            isFollowing ? "bg-primary" : "bg-zinc-950/90"
          )}
          onClick={() => setFollowing(true)}
        >
          <Compass className={cn("w-12 h-12", isFollowing && "animate-pulse")} />
        </Button>
      </div>
      {/* Footer Info Panel */}
      {activeRoute && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[110] w-[800px]">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-zinc-950/95 backdrop-blur-3xl border border-white/20 rounded-[4rem] p-10 flex items-center justify-between shadow-glow-lg"
          >
            <div className="flex flex-col items-center flex-1">
              <span className="text-white/50 font-black uppercase text-xs tracking-[0.3em] mb-1">Arrival</span>
              <span className="text-6xl font-black tabular-nums text-white text-neon">{formatETA(activeRoute.duration)}</span>
            </div>
            <div className="h-16 w-px bg-white/10" />
            <div className="flex flex-col items-center flex-1">
              <span className="text-white/50 font-black uppercase text-xs tracking-[0.3em] mb-1">Duration</span>
              <span className="text-5xl font-black tabular-nums text-white">
                {Math.round(activeRoute.duration / 60)} <span className="text-xl text-muted-foreground uppercase">min</span>
              </span>
            </div>
            <div className="h-16 w-px bg-white/10" />
            <div className="flex flex-col items-center flex-1">
              <span className="text-white/50 font-black uppercase text-xs tracking-[0.3em] mb-1">Distance</span>
              <span className="text-5xl font-black tabular-nums text-white">
                {(activeRoute.distance / 1000).toFixed(1)} <span className="text-xl text-muted-foreground uppercase">km</span>
              </span>
            </div>
          </motion.div>
        </div>
      )}
      {showShare && <TrackingOverlay onClose={() => setShowShare(false)} />}
    </div>
  );
}