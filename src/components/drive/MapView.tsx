import React, { useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useOSStore } from '@/store/use-os-store';
import { getCategoryColor, getMapStyle, getMapFilter } from '@/lib/nav-utils';
import type { GeoJSON } from 'geojson';
import { X, Navigation, Share2, Compass, Globe, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TrackingOverlay } from './TrackingOverlay';
import { SearchOverlay } from './SearchOverlay';
import { PlaceDetails } from './PlaceDetails';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsLandscapeMobile } from '@/hooks/use-landscape-mobile';
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
  const isLandscapeMobile = useIsLandscapeMobile();
  const topActionButtonClass = isLandscapeMobile
    ? "h-10 w-10 rounded-xl"
    : "h-12 w-12 sm:h-14 sm:w-14 md:h-24 md:w-24 rounded-2xl md:rounded-[2rem]";
  const perspectiveButtonClass = isLandscapeMobile
    ? "h-10 w-10 rounded-xl"
    : "h-12 w-12 sm:h-14 sm:w-14 md:h-24 md:w-24 rounded-2xl md:rounded-[2.5rem]";
  const actionIconClass = isLandscapeMobile
    ? "w-4 h-4"
    : "w-5 h-5 sm:w-6 sm:h-6 md:w-12 md:h-12";
  const [showShare, setShowShare] = React.useState(false);
  useEffect(() => {
    if (isMapOpen && currentPos && isFollowing && mapRef.current) {
      const isDriving = mapPerspective === 'driving';
      const easeOptions: any = {
        center: [currentPos[1], currentPos[0]],
        zoom: isDriving ? 17.8 : 15.2,
        pitch: isDriving ? 65 : 0,
        bearing: isDriving ? (currentHeading ?? 0) : 0,
        duration: 1200,
        essential: true,
      };
      if (isDriving) {
        // Offset the center slightly so the car is at the bottom 1/3 of the screen for better foresight
        easeOptions.padding = { top: isLandscapeMobile ? 160 : 350, bottom: 0, left: 0, right: 0 };
      } else {
        easeOptions.padding = { top: 0, bottom: 0, left: 0, right: 0 };
      }
      mapRef.current?.easeTo(easeOptions);
    }
  }, [currentPos, currentHeading, isFollowing, isMapOpen, mapPerspective, isLandscapeMobile]);
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
          pitch: mapPerspective === 'driving' ? 65 : 0,
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
                animate={{ scale: [1, 2.5], opacity: [0.3, 0] }} 
                transition={{ repeat: Infinity, duration: 2 }} 
                className="absolute w-14 h-14 bg-primary rounded-full blur-md" 
              />
              <div 
                className="custom-user-icon w-14 h-14 bg-primary border-[5px] border-white rounded-full shadow-glow-lg z-10 flex items-center justify-center transition-transform duration-500 ease-out"
                style={{ transform: `rotate(${currentHeading ?? 0}deg)` }}
              >
                <Navigation className="w-7 h-7 text-white fill-current" />
              </div>
            </div>
          </Marker>
        )}
        {discoveredPlace && (
          <Marker longitude={discoveredPlace.lon} latitude={discoveredPlace.lat}>
            <motion.div 
              initial={{ scale: 0, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-14 h-14 bg-primary border-4 border-white rounded-full shadow-glow-lg flex items-center justify-center"
            >
              <Globe className="w-7 h-7 text-white" />
            </motion.div>
          </Marker>
        )}
        {locations.map((loc) => (
          <Marker key={loc.id} longitude={loc.lon} latitude={loc.lat}>
            <div
              className="custom-pin-icon w-8 h-8 rounded-full border-4 border-white shadow-glow transition-all"
              style={{ 
                backgroundColor: getCategoryColor(loc.category), 
                transform: activeDestination?.id === loc.id ? 'scale(1.5) translateY(-10px)' : 'scale(1)' 
              }}
            />
          </Marker>
        ))}
        {routeGeoJSON && (
          <Source id="route-source" type="geojson" data={routeGeoJSON}>
            <Layer id="route-layer-glow" type="line" paint={{ 'line-color': '#3b82f6', 'line-width': 24, 'line-opacity': 0.3, 'line-blur': 15 }} />
            <Layer id="route-layer" type="line" layout={{ 'line-join': 'round', 'line-cap': 'round' }} paint={{ 'line-color': '#3b82f6', 'line-width': 12, 'line-opacity': 1 }} />
          </Source>
        )}
      </Map>
      <div className={cn(
        "absolute z-[110] flex justify-between items-start",
        isLandscapeMobile ? "top-2 left-2 right-2" : "top-8 left-32 right-8"
      )}>
        <div className="flex gap-4">
          <Button variant="secondary" size="lg" onClick={closeMap} className={cn(topActionButtonClass, "bg-zinc-950/90 backdrop-blur-3xl border border-white/10 shadow-glow active:scale-90 transition-transform")}>
            <X className={actionIconClass} />
          </Button>
          <AnimatePresence>
            {(activeDestination || discoveredPlace) && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }} 
                className="bg-primary/95 backdrop-blur-3xl p-3 sm:p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] flex flex-col justify-center min-w-[170px] sm:min-w-[230px] md:min-w-[350px] border border-white/20 shadow-glow-lg"
              >
                <span className="text-[10px] md:text-xs uppercase font-black text-white/70 tracking-widest flex items-center gap-1.5 md:gap-2">
                  <Navigation className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" /> Navigating To
                </span>
                <span className="text-xl sm:text-2xl md:text-4xl font-black text-white truncate max-w-[180px] sm:max-w-[250px] md:max-w-[400px] text-neon">
                  {(activeDestination || discoveredPlace)?.label}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setSearchOverlay(true)}
            className={cn(topActionButtonClass, "bg-zinc-950/90 backdrop-blur-3xl border border-white/10 shadow-glow active:scale-95 transition-transform")}
          >
            <Search className={actionIconClass} />
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setShowShare(true)}
            className={cn(
              topActionButtonClass,
              "bg-zinc-950/90 backdrop-blur-3xl border border-white/10 shadow-glow active:scale-95 transition-transform", 
              isSharingLive && "text-primary border-primary/50"
            )}
          >
            <Share2 className={actionIconClass} />
          </Button>
        </div>
      </div>
      <div className={cn(
        "absolute z-[110] flex flex-col",
        isLandscapeMobile ? "bottom-2 right-2 gap-2" : "bottom-10 right-10 gap-6"
      )}>
        <Button 
          variant={mapPerspective === 'top-down' ? "default" : "secondary"} 
          size="lg" 
          className={cn(
            perspectiveButtonClass,
            "backdrop-blur-3xl border border-white/10 shadow-glow-lg transition-all", 
            mapPerspective === 'top-down'
              ? cn("bg-primary text-white", isLandscapeMobile ? "scale-100" : "scale-110")
              : "bg-zinc-950/90 text-muted-foreground"
          )} 
          onClick={() => toggleMapPerspective()}
        >
          <Globe className={actionIconClass} />
        </Button>
        <Button 
          variant={mapPerspective === 'driving' ? "default" : "secondary"} 
          size="lg" 
          className={cn(
            perspectiveButtonClass,
            "backdrop-blur-3xl border border-white/10 shadow-glow-lg transition-all", 
            mapPerspective === 'driving'
              ? cn("bg-primary text-white", isLandscapeMobile ? "scale-100" : "scale-110")
              : "bg-zinc-950/90 text-muted-foreground"
          )} 
          onClick={() => toggleMapPerspective()}
        >
          <Navigation className={actionIconClass} />
        </Button>
        <Button 
          variant={isFollowing ? "default" : "secondary"} 
          size="lg" 
          className={cn(
            perspectiveButtonClass,
            "backdrop-blur-3xl border border-white/10 shadow-glow-lg transition-all", 
            isFollowing ? "bg-primary" : "bg-zinc-950/90"
          )} 
          onClick={() => setFollowing(true)}
        >
          <Compass className={cn(actionIconClass, isFollowing && "animate-pulse")} />
        </Button>
      </div>
      <PlaceDetails />
      <SearchOverlay />
      {showShare && <TrackingOverlay onClose={() => setShowShare(false)} />}
    </div>
  );
}