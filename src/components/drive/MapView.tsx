import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import Map, { Source, Layer, Marker, type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useShallow } from 'zustand/react/shallow';
import { useOSStore } from '@/store/use-os-store';
import { getCategoryColor, getMapStyle, getMapFilter } from '@/lib/nav-utils';
import type { GeoJSON } from 'geojson';
import { X, Navigation, Share2, Compass, Globe, Search, ExternalLink, Route, Timer, Gauge, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsLandscapeMobile } from '@/hooks/use-landscape-mobile';
import {
  formatDriveDistance,
  formatDriveDuration,
  formatTripRetentionRemaining,
  formatTripSpeed,
  getLiveDriveTrip,
  getLiveDriveTripHistory,
  getPathGeoJson,
  getTripDurationMs,
  getTripRetentionRemainingMs,
} from '@/lib/live-drive';
import { formatRouteDistance, formatRouteMinutes, getNavigationAlert } from '@/lib/navigation-status';
import { isEmbeddedWebViewAvailable, openEmbeddedWebView } from '@/lib/embedded-web-view';
import { formatSpeed, getGoogleMapsEmbedUrl, getGoogleMapsLink, getGoogleMapsPreviewUrl } from '@/lib/drive-utils';
import { useDriveSessionState, useNavigationMapShellState } from '@/store/os-domain-hooks';
import type { TripRecord } from '@/store/use-os-store';

const TrackingOverlay = lazy(() => import('./TrackingOverlay').then((module) => ({ default: module.TrackingOverlay })));
const SearchOverlay = lazy(() => import('./SearchOverlay').then((module) => ({ default: module.SearchOverlay })));
const PlaceDetails = lazy(() => import('./PlaceDetails').then((module) => ({ default: module.PlaceDetails })));
const MapCarIcon = lazy(() => import('./MapCarIcon').then((module) => ({ default: module.MapCarIcon })));

const MAP_CAMERA_UPDATE_INTERVAL_MS = 550;
const MAP_CAMERA_TOP_DOWN_UPDATE_INTERVAL_MS = 1000;
const MAP_CAMERA_MIN_POSITION_DELTA = 0.000025;
const MAP_CAMERA_TOP_DOWN_MIN_POSITION_DELTA = 0.00006;
const MAP_CAMERA_MIN_HEADING_DELTA = 6;

function getHeadingDelta(previous: number | null | undefined, next: number | null | undefined) {
  if (previous == null || next == null) {
    return Number.POSITIVE_INFINITY;
  }

  const rawDelta = Math.abs(previous - next);
  return Math.min(rawDelta, 360 - rawDelta);
}

function formatTripTimestamp(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp);
}

function renderTripClockRange(trip: TripRecord) {
  const startedAt = formatTripTimestamp(trip.startTime);
  if (!trip.endTime) {
    return `Started ${startedAt}`;
  }

  return `${startedAt} to ${formatTripTimestamp(trip.endTime)}`;
}

export const MapView = React.memo(function MapView() {
  const { isMapOpen, closeMap, isFollowing, setFollowing, currentPos, currentHeading } = useNavigationMapShellState();
  const currentSpeed = useOSStore((state) => state.currentSpeed);
  const {
    gpsStatus,
    activeRoute,
    activeDestination,
    routeState,
    routeFailureKind,
    routeFailureMessage,
    lastGpsFixAt,
    isSharingLive,
    mapProvider,
    mapTheme,
    mapPerspective,
    activeMapIconId,
    setMapPerspective,
    locations,
    setSearchOverlay,
    discoveredPlace,
    isSearchOverlayOpen,
  } = useOSStore(useShallow((state) => ({
    gpsStatus: state.gpsStatus,
    activeRoute: state.activeRoute,
    activeDestination: state.activeDestination,
    routeState: state.routeState,
    routeFailureKind: state.routeFailureKind,
    routeFailureMessage: state.routeFailureMessage,
    lastGpsFixAt: state.lastGpsFixAt,
    isSharingLive: state.isSharingLive,
    mapProvider: state.settings.mapProvider,
    mapTheme: state.settings.mapTheme,
    mapPerspective: state.settings.mapPerspective,
    activeMapIconId: state.activeMapIconId,
    setMapPerspective: state.setMapPerspective,
    locations: state.locations,
    setSearchOverlay: state.setSearchOverlay,
    discoveredPlace: state.selectedDiscoveredPlace,
    isSearchOverlayOpen: state.isSearchOverlayOpen,
  })));
  const { trips, units } = useDriveSessionState();
  const mapRef = useRef<MapRef | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const googlePreviewSeededRef = useRef(false);
  const lastCameraSyncRef = useRef<{
    timestamp: number;
    position: [number, number] | null;
    heading: number | null;
  } | null>(null);
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
  const [showShare, setShowShare] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [googleMapCenter, setGoogleMapCenter] = useState<[number, number] | null>(currentPos);
  const [isLiveDrivePanelHidden, setIsLiveDrivePanelHidden] = useState(false);
  const [isTripHistoryHidden, setIsTripHistoryHidden] = useState(false);
  const navigationAlert = useMemo(() => getNavigationAlert({
    gpsStatus,
    routeState,
    routeFailureKind,
    routeFailureMessage,
    lastGpsFixAt,
    activeDestination,
    activeRoute,
  }), [gpsStatus, routeState, routeFailureKind, routeFailureMessage, lastGpsFixAt, activeDestination, activeRoute]);
  const liveDriveTrip = useMemo(() => getLiveDriveTrip(trips), [trips]);
  const liveDriveHistory = useMemo(() => getLiveDriveTripHistory(trips), [trips]);
  const shouldShowLiveDrive = Boolean(!activeDestination && !discoveredPlace && liveDriveTrip);
  const shouldShowTripHistory = liveDriveHistory.length > 0;
  const showLiveDrivePanel = shouldShowLiveDrive && !isLiveDrivePanelHidden;
  const showTripHistoryPanel = shouldShowTripHistory && !isTripHistoryHidden;
  const liveDriveDurationMs = liveDriveTrip ? getTripDurationMs(liveDriveTrip) : 0;
  const mapSpeed = useMemo(() => formatSpeed(currentSpeed ?? 0, units), [currentSpeed, units]);
  const useGooglePreview = mapProvider === 'google' && !shouldShowLiveDrive;
  const canOpenNativeGoogleFullscreen = useGooglePreview && isEmbeddedWebViewAvailable();
  const liveDrivePanelSessionKey = liveDriveTrip ? `${liveDriveTrip.startTime}:${liveDriveTrip.endTime ?? 'active'}` : 'none';
  const liveDriveGeoJSON = useMemo((): GeoJSON.Feature<GeoJSON.LineString> | null => {
    if (!shouldShowLiveDrive) return null;
    return getPathGeoJson(liveDriveTrip);
  }, [liveDriveTrip, shouldShowLiveDrive]);
  const mapCarFallbackClassName = isLandscapeMobile ? 'h-[66px] w-[66px]' : 'h-[88px] w-[88px]';
  const mapStyle = useMemo(() => getMapStyle(mapTheme), [mapTheme]);
  const mapFilter = useMemo(() => getMapFilter(mapTheme), [mapTheme]);

  useEffect(() => {
    setIsLiveDrivePanelHidden(false);
  }, [liveDrivePanelSessionKey, activeDestination?.id, discoveredPlace?.id]);

  useEffect(() => {
    if (liveDriveHistory.length) {
      setIsTripHistoryHidden(false);
    }
  }, [liveDriveHistory.length, liveDriveHistory[0]?.startTime]);

  useEffect(() => {
    if (useGooglePreview) {
      return;
    }

    if (!isMapOpen || !currentPos || !isFollowing || !mapRef.current) {
      if (!isMapOpen || !isFollowing) {
        lastCameraSyncRef.current = null;
      }
      return;
    }

    const isDriving = mapPerspective === 'driving';
    const heading = typeof currentHeading === 'number' && !Number.isNaN(currentHeading) ? currentHeading : null;
    const now = Date.now();
    const lastSync = lastCameraSyncRef.current;
    const positionDeltaThreshold = isDriving ? MAP_CAMERA_MIN_POSITION_DELTA : MAP_CAMERA_TOP_DOWN_MIN_POSITION_DELTA;
    const updateInterval = isDriving ? MAP_CAMERA_UPDATE_INTERVAL_MS : MAP_CAMERA_TOP_DOWN_UPDATE_INTERVAL_MS;
    const movedEnough = !lastSync?.position
      || Math.abs(currentPos[0] - lastSync.position[0]) >= positionDeltaThreshold
      || Math.abs(currentPos[1] - lastSync.position[1]) >= positionDeltaThreshold;
    const turnedEnough = isDriving && getHeadingDelta(lastSync?.heading, heading) >= MAP_CAMERA_MIN_HEADING_DELTA;
    const intervalElapsed = !lastSync || now - lastSync.timestamp >= updateInterval;

    if (!movedEnough && !turnedEnough && !intervalElapsed) {
      return;
    }

    const easeOptions = {
      center: [currentPos[1], currentPos[0]] as [number, number],
      zoom: isDriving ? 17.8 : 15.2,
      pitch: isDriving ? 65 : 0,
      bearing: isDriving ? (heading ?? 0) : 0,
      duration: isDriving ? 420 : 520,
      essential: true,
      padding: isDriving
        ? { top: isLandscapeMobile ? 160 : 350, bottom: 0, left: 0, right: 0 }
        : { top: 0, bottom: 0, left: 0, right: 0 },
    };

    mapRef.current.stop();
    mapRef.current.easeTo(easeOptions);
    lastCameraSyncRef.current = {
      timestamp: now,
      position: currentPos,
      heading,
    };
  }, [currentPos, currentHeading, isFollowing, isMapOpen, mapPerspective, isLandscapeMobile, useGooglePreview]);

  useEffect(() => {
    if (!isMapOpen || !useGooglePreview) {
      googlePreviewSeededRef.current = false;
      return;
    }

    const focusPlace = discoveredPlace ?? activeDestination;

    if (focusPlace) {
      setGoogleMapCenter([focusPlace.lat, focusPlace.lon]);
      googlePreviewSeededRef.current = true;
      return;
    }

    googlePreviewSeededRef.current = false;
  }, [activeDestination, discoveredPlace, isMapOpen, useGooglePreview]);

  useEffect(() => {
    if (!isMapOpen || !useGooglePreview || googlePreviewSeededRef.current || !currentPos) {
      return;
    }

    setGoogleMapCenter(currentPos);
    googlePreviewSeededRef.current = true;
  }, [currentPos, isMapOpen, useGooglePreview]);

  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMapOpen) {
      setIsFullscreen(false);
    }
  }, [isMapOpen]);

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (map) map.getCanvas().style.filter = mapFilter;
  }, [isMapOpen, mapFilter]);

  useEffect(() => {
    if (!isMapOpen || useGooglePreview || !mapRef.current) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => mapRef.current?.resize());
    return () => window.cancelAnimationFrame(frameId);
  }, [isFullscreen, isMapOpen, useGooglePreview]);

  const handleMapInteraction = () => {
    if (isFollowing) setFollowing(false);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => setFollowing(true), 15000);
  };
  const googleMapUrl = useMemo(() => {
    const focusPlace = discoveredPlace ?? activeDestination;
    const zoom = mapPerspective === 'driving' ? 17 : 15;

    return getGoogleMapsEmbedUrl({
      focus: focusPlace ? {
        label: focusPlace.label,
        address: focusPlace.address,
        lat: focusPlace.lat,
        lon: focusPlace.lon,
      } : null,
      currentPos: googleMapCenter,
      zoom,
    });
  }, [activeDestination, discoveredPlace, googleMapCenter, mapPerspective]);
  const googlePreviewUrl = useMemo(() => {
    const focusPlace = discoveredPlace ?? activeDestination;
    const zoom = mapPerspective === 'driving' ? 17 : 15;

    return getGoogleMapsPreviewUrl({
      focus: focusPlace ? {
        label: focusPlace.label,
        address: focusPlace.address,
        lat: focusPlace.lat,
        lon: focusPlace.lon,
      } : null,
      currentPos: googleMapCenter ?? currentPos,
      zoom,
    });
  }, [activeDestination, currentPos, discoveredPlace, googleMapCenter, mapPerspective]);
  const googleDirectionsUrl = useMemo(() => {
    const target = discoveredPlace ?? activeDestination;
    if (!target) {
      const anchor = googleMapCenter ?? currentPos;
      return anchor ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${anchor[0]},${anchor[1]}`)}` : 'https://www.google.com/maps';
    }
    return getGoogleMapsLink(target.lat, target.lon);
  }, [activeDestination, currentPos, discoveredPlace, googleMapCenter]);
  const googleFullscreenUrl = useMemo(() => {
    if (activeDestination || discoveredPlace) {
      return googleDirectionsUrl;
    }

    return googlePreviewUrl;
  }, [activeDestination, discoveredPlace, googleDirectionsUrl, googlePreviewUrl]);
  const routeGeoJSON = useMemo((): GeoJSON.Feature<GeoJSON.LineString> | null => {
    if (!activeRoute) return null;
    return {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: activeRoute.coordinates.map(c => [c[1], c[0]]) }
    };
  }, [activeRoute]);

  const locationMarkers = useMemo(() => locations.map((loc) => (
    <Marker key={loc.id} longitude={loc.lon} latitude={loc.lat}>
      <div
        className="custom-pin-icon w-8 h-8 rounded-full border-4 border-white shadow-glow transition-all"
        style={{
          backgroundColor: getCategoryColor(loc.category),
          transform: activeDestination?.id === loc.id ? 'scale(1.5) translateY(-10px)' : 'scale(1)'
        }}
      />
    </Marker>
  )), [locations, activeDestination?.id]);

  const handleFullscreenToggle = async () => {
    if (canOpenNativeGoogleFullscreen) {
      const opened = await openEmbeddedWebView({
        url: googleFullscreenUrl,
        title: activeDestination?.label ?? discoveredPlace?.label ?? 'Google Maps',
        startFullscreen: true,
      });

      if (opened) {
        return;
      }
    }

    setIsFullscreen((current) => !current);
  };

  if (!isMapOpen) return null;
  return (
    <div className={cn(
      "relative h-full min-h-0 w-full overflow-hidden border border-white/10 bg-black overscroll-none shadow-[0_24px_80px_-36px_rgba(0,0,0,0.85)]",
      isFullscreen ? 'fixed inset-0 z-[180] rounded-none border-0 shadow-none' : 'rounded-[1.5rem] md:rounded-[2.5rem]'
    )}>
      {useGooglePreview ? (
        <div className="absolute inset-0 bg-black overscroll-none">
          <iframe
            src={googleMapUrl}
            title="Google Maps Preview"
            className="h-full w-full border-0"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            style={{ filter: mapFilter }}
          />
        </div>
      ) : (
        <Map
          ref={mapRef}
          reuseMaps
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
              <Suspense
                fallback={<div className={cn('rounded-full border-4 border-white/70 bg-primary/80 shadow-glow', mapCarFallbackClassName)} />}
              >
                <MapCarIcon
                  iconId={activeMapIconId}
                  heading={currentHeading}
                  size={isLandscapeMobile ? 66 : 88}
                  animated
                  showPulse
                />
              </Suspense>
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
          {locationMarkers}
          {liveDriveGeoJSON && !activeRoute && (
            <Source id="live-drive-source" type="geojson" data={liveDriveGeoJSON}>
              <Layer id="live-drive-layer-glow" type="line" paint={{ 'line-color': '#22c55e', 'line-width': 18, 'line-opacity': 0.24, 'line-blur': 12 }} />
              <Layer id="live-drive-layer" type="line" layout={{ 'line-join': 'round', 'line-cap': 'round' }} paint={{ 'line-color': '#34d399', 'line-width': 7, 'line-opacity': 0.95 }} />
            </Source>
          )}
          {routeGeoJSON && (
            <Source id="route-source" type="geojson" data={routeGeoJSON}>
              <Layer id="route-layer-glow" type="line" paint={{ 'line-color': '#3b82f6', 'line-width': 24, 'line-opacity': 0.3, 'line-blur': 15 }} />
              <Layer id="route-layer" type="line" layout={{ 'line-join': 'round', 'line-cap': 'round' }} paint={{ 'line-color': '#3b82f6', 'line-width': 12, 'line-opacity': 1 }} />
            </Source>
          )}
        </Map>
      )}
      <div className={cn(
        "absolute z-[110] flex justify-between items-start",
        isLandscapeMobile ? "top-2 left-2 right-2" : "top-6 left-6 right-6"
      )}>
        <div className="flex gap-4">
          <Button variant="secondary" size="lg" onClick={closeMap} className={cn(topActionButtonClass, "bg-zinc-950/90 backdrop-blur-3xl border border-white/10 shadow-glow active:scale-90 transition-transform")}>
            <X className={actionIconClass} />
          </Button>
          {useGooglePreview && (
            <Button
              variant="secondary"
              size="lg"
              onClick={() => window.open(googleDirectionsUrl, '_blank', 'noopener,noreferrer')}
              className={cn(topActionButtonClass, "bg-zinc-950/90 backdrop-blur-3xl border border-white/10 shadow-glow active:scale-90 transition-transform")}
            >
              <ExternalLink className={actionIconClass} />
            </Button>
          )}
          <Button
            variant="secondary"
            size="lg"
            onClick={() => void handleFullscreenToggle()}
            className={cn(topActionButtonClass, "bg-zinc-950/90 backdrop-blur-3xl border border-white/10 shadow-glow active:scale-90 transition-transform")}
          >
            <span className={cn('font-black uppercase tracking-[0.18em]', isLandscapeMobile ? 'text-[8px]' : 'text-[9px] md:text-[11px]')}>
              {isFullscreen ? 'Exit' : 'Full'}
            </span>
          </Button>
          {shouldShowLiveDrive && isLiveDrivePanelHidden && !(activeDestination || discoveredPlace) && (
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setIsLiveDrivePanelHidden(false)}
              className={cn(
                "bg-zinc-950/90 backdrop-blur-3xl border border-emerald-400/25 text-emerald-100 shadow-glow active:scale-95 transition-transform font-black uppercase tracking-[0.18em]",
                isLandscapeMobile ? 'h-10 rounded-xl px-3 text-[10px]' : 'h-12 rounded-2xl px-4 text-[11px] md:h-16 md:rounded-[1.5rem] md:px-5'
              )}
            >
              Open Drive Panel
            </Button>
          )}
          <AnimatePresence mode="wait">
            {(activeDestination || discoveredPlace) ? (
              <motion.div 
                key="destination-panel"
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
                <span className="mt-2 text-[10px] md:text-xs font-bold uppercase tracking-[0.18em] text-white/70">
                  {navigationAlert?.compactLabel ?? 'Destination pinned'}
                  {activeRoute ? ` • ${formatRouteDistance(activeRoute.distance)} • ${formatRouteMinutes(activeRoute.duration)}` : ''}
                </span>
                {useGooglePreview && (
                  <span className="mt-1 text-[10px] md:text-xs font-bold uppercase tracking-[0.18em] text-white/55">
                    Google preview shows nearby shops and points of interest.
                  </span>
                )}
              </motion.div>
            ) : showLiveDrivePanel ? (
              <motion.div
                key="live-drive-panel"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-zinc-950/88 backdrop-blur-3xl p-3 sm:p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] flex flex-col justify-center min-w-[190px] sm:min-w-[250px] md:min-w-[390px] border border-emerald-400/25 shadow-glow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] md:text-xs uppercase font-black text-emerald-200/75 tracking-widest flex items-center gap-1.5 md:gap-2">
                      <Route className="w-3.5 h-3.5 md:w-4 md:h-4" /> Live Drive
                    </span>
                    <span className="mt-2 block text-xl sm:text-2xl md:text-4xl font-black text-white text-neon">
                      {liveDriveTrip?.endTime ? 'Last untethered drive' : 'Recording the road behind you'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLiveDrivePanelHidden(true)}
                    className="inline-flex h-8 items-center rounded-full border border-white/15 bg-white/5 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Close Panel
                  </button>
                </div>
                <span className="mt-2 text-[11px] md:text-sm text-white/72 max-w-[340px]">
                  {liveDriveTrip?.endTime
                    ? 'No destination was pinned, so VelocityOS kept the breadcrumb trail of the path you actually drove.'
                    : 'No point of interest is armed, so VelocityOS is tracing your exact path in real time.'}
                </span>
                {liveDriveTrip?.endTime && (
                  <span className="mt-2 text-[10px] md:text-xs font-bold uppercase tracking-[0.18em] text-emerald-200/65">
                    Auto deletes in {formatTripRetentionRemaining(getTripRetentionRemainingMs(liveDriveTrip))}
                  </span>
                )}
                <div className="mt-3 grid grid-cols-3 gap-2 md:gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55 flex items-center gap-1.5">
                      <Gauge className="h-3.5 w-3.5" /> Distance
                    </div>
                    <div className="mt-1 font-black text-sm md:text-lg tabular-nums text-white">
                      {formatDriveDistance(liveDriveTrip?.distanceKm ?? 0, units)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55 flex items-center gap-1.5">
                      <Timer className="h-3.5 w-3.5" /> Time
                    </div>
                    <div className="mt-1 font-black text-sm md:text-lg tabular-nums text-white">
                      {formatDriveDuration(liveDriveDurationMs)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Status</div>
                    <div className="mt-1 font-black text-sm md:text-lg uppercase text-white">
                      {liveDriveTrip?.endTime ? 'Complete' : 'Active'}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
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
        "absolute z-[108] flex flex-col items-start",
        isLandscapeMobile ? 'bottom-2 left-2 max-w-[76vw] gap-2' : 'bottom-6 left-6 max-w-[28rem] gap-4'
      )}>
        <div className={cn(
          "pointer-events-none rounded-2xl border border-white/10 bg-zinc-950/45 text-white shadow-[0_18px_50px_-28px_rgba(0,0,0,0.9)] backdrop-blur-xl",
          isLandscapeMobile ? 'px-3 py-2' : 'px-4 py-3'
        )}>
          <div className="text-[9px] font-black uppercase tracking-[0.22em] text-white/55">Map Speed</div>
          <div className="mt-1 flex items-end gap-2">
            <span className={cn('font-black tabular-nums leading-none text-white/88', isLandscapeMobile ? 'text-3xl' : 'text-5xl')}>
              {mapSpeed}
            </span>
            <span className={cn('pb-1 font-black uppercase tracking-[0.22em] text-white/55', isLandscapeMobile ? 'text-[10px]' : 'text-xs')}>
              {units}
            </span>
          </div>
        </div>
        {shouldShowTripHistory && isTripHistoryHidden && (
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setIsTripHistoryHidden(false)}
            className={cn(
              "bg-zinc-950/88 backdrop-blur-3xl border border-cyan-300/20 text-cyan-50 shadow-glow active:scale-95 transition-transform font-black uppercase tracking-[0.18em]",
              isLandscapeMobile ? 'h-10 rounded-xl px-3 text-[10px]' : 'h-12 rounded-2xl px-4 text-[11px]'
            )}
          >
            Open Trip History
          </Button>
        )}
        <AnimatePresence>
          {showTripHistoryPanel && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              className={cn(
                "w-full rounded-[1.6rem] border border-cyan-300/16 bg-zinc-950/82 p-3 text-white shadow-[0_30px_80px_-42px_rgba(0,0,0,0.95)] backdrop-blur-3xl",
                isLandscapeMobile ? 'max-w-[76vw]' : 'max-w-[28rem] p-4'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/70">
                    <History className="h-3.5 w-3.5" /> Untethered Trips
                  </div>
                  <div className="mt-1 text-sm font-black text-white md:text-base">Map-tab trip history with 30-day expiry.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTripHistoryHidden(true)}
                  className="inline-flex h-8 items-center rounded-full border border-white/15 bg-white/5 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Close History
                </button>
              </div>
              <div className="mt-2 text-[11px] text-white/58">
                VelocityOS keeps untethered drives for 30 days, then removes each one automatically.
              </div>
              <div className={cn('mt-3 space-y-2 overflow-y-auto pr-1', isLandscapeMobile ? 'max-h-[30vh]' : 'max-h-[38vh]')}>
                {liveDriveHistory.map((trip) => {
                  const retentionLabel = formatTripRetentionRemaining(getTripRetentionRemainingMs(trip));
                  const durationMs = getTripDurationMs(trip);

                  return (
                    <div key={trip.startTime} className="rounded-[1.35rem] border border-white/10 bg-white/5 px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/48">Drive Log</div>
                          <div className="mt-1 text-sm font-black text-white md:text-base">{renderTripClockRange(trip)}</div>
                        </div>
                        <div className="rounded-full border border-cyan-300/18 bg-cyan-400/8 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/78">
                          {retentionLabel}
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2.5">
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
                            <Route className="h-3.5 w-3.5" /> Distance
                          </div>
                          <div className="mt-1 text-sm font-black tabular-nums text-white md:text-base">
                            {formatDriveDistance(trip.distanceKm, units)}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2.5">
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
                            <Timer className="h-3.5 w-3.5" /> Duration
                          </div>
                          <div className="mt-1 text-sm font-black tabular-nums text-white md:text-base">
                            {formatDriveDuration(durationMs)}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2.5">
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
                            <Gauge className="h-3.5 w-3.5" /> Avg Speed
                          </div>
                          <div className="mt-1 text-sm font-black tabular-nums text-white md:text-base">
                            {formatTripSpeed(trip.averageSpeedKph, units)}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2.5">
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
                            <Gauge className="h-3.5 w-3.5" /> Max Speed
                          </div>
                          <div className="mt-1 text-sm font-black tabular-nums text-white md:text-base">
                            {formatTripSpeed(trip.maxSpeedKph, units)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className={cn(
        "absolute z-[110] flex flex-col",
        isLandscapeMobile ? "bottom-2 right-2 gap-2" : "bottom-6 right-6 gap-4"
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
          onClick={() => setMapPerspective('top-down')}
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
          onClick={() => setMapPerspective('driving')}
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
          onClick={() => {
            setFollowing(true);
            if (mapProvider === 'google' && currentPos) {
              setGoogleMapCenter(currentPos);
            }
          }}
        >
          <Compass className={cn(actionIconClass, isFollowing && "animate-pulse")} />
        </Button>
      </div>
      {discoveredPlace && (
        <Suspense fallback={null}>
          <PlaceDetails />
        </Suspense>
      )}
      {isSearchOverlayOpen && (
        <Suspense fallback={null}>
          <SearchOverlay />
        </Suspense>
      )}
      {showShare && (
        <Suspense fallback={null}>
          <TrackingOverlay onClose={() => setShowShare(false)} />
        </Suspense>
      )}
    </div>
  );
});
