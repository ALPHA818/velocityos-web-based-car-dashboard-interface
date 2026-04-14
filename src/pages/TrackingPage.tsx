import React, { Suspense, lazy, useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Map, { Marker, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getMapStyle, getMapFilter } from '@/lib/nav-utils';
import { Wifi, Clock, Gauge, Navigation, Route, Timer } from 'lucide-react';
import { api } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';
import type { TrackingState } from '@shared/types';
import { useOSStore } from '@/store/use-os-store';
import { formatDriveDistance, formatDriveDuration, getPathGeoJson } from '@/lib/live-drive';

const MapCarIcon = lazy(() => import('@/components/drive/MapCarIcon').then((module) => ({ default: module.MapCarIcon })));
export function TrackingPage() {
  const { id } = useParams();
  const [data, setData] = useState<TrackingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  const mapStyle = useMemo(() => getMapStyle('dark'), []);
  const activeMapIconId = useOSStore((s) => s.activeMapIconId);
  const pathGeoJSON = useMemo(() => getPathGeoJson(data), [data]);
  useEffect(() => {
    const applyFilter = () => {
      const map = mapRef.current?.getMap();
      if (map) {
        map.getCanvas().style.filter = navigator.onLine ? getMapFilter('dark') : 'grayscale(1) saturate(0) brightness(0.6)';
      }
    };
    applyFilter();
    window.addEventListener('online', applyFilter);
    window.addEventListener('offline', applyFilter);
    return () => {
      window.removeEventListener('online', applyFilter);
      window.removeEventListener('offline', applyFilter);
    };
  }, []);
  useEffect(() => {
    const poll = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await api<TrackingState>(`/api/tracking/${id}`);
        setData(res);
        if (mapRef.current) {
          if (res.path.length > 1) {
            const bounds = res.path.reduce((acc, [lat, lon]) => {
              acc.minLat = Math.min(acc.minLat, lat);
              acc.maxLat = Math.max(acc.maxLat, lat);
              acc.minLon = Math.min(acc.minLon, lon);
              acc.maxLon = Math.max(acc.maxLon, lon);
              return acc;
            }, {
              minLat: res.path[0][0],
              maxLat: res.path[0][0],
              minLon: res.path[0][1],
              maxLon: res.path[0][1],
            });

            mapRef.current?.fitBounds(
              [[bounds.minLon, bounds.minLat], [bounds.maxLon, bounds.maxLat]],
              { padding: 80, duration: 2000, maxZoom: 16 }
            );
          } else {
            mapRef.current?.flyTo({
              center: [res.lon, res.lat],
              zoom: 15,
              bearing: res.heading || 0,
              essential: true,
              duration: 2000,
            });
          }
        }
      } catch (err) {
        setError('Connection lost. The session may have ended.');
      }
    };
    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [id]);
  if (error) return (
    <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white p-10">
      <div className="p-10 bg-zinc-900 rounded-[3rem] border border-white/10 text-center space-y-6">
        <Wifi className="w-20 h-20 mx-auto text-muted-foreground" />
        <h1 className="text-4xl font-black">Tracking Unavailable</h1>
        <p className="text-xl text-muted-foreground">{error}</p>
      </div>
    </div>
  );
  if (!data) return (
    <div className="h-screen w-screen bg-black flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-2xl font-black tracking-widest uppercase opacity-50">Initializing Live360...</span>
      </div>
    </div>
  );
  return (
    <div className="h-screen w-screen bg-black overflow-hidden flex flex-col md:flex-row">
      <div className="md:hidden p-6 bg-zinc-950 border-b border-white/10 flex items-center justify-between z-10">
        <span className="text-2xl font-black text-primary">Booster Live360</span>
        <div className="flex items-center gap-2 text-red-500 text-xs font-bold animate-pulse">
          <div className="w-2 h-2 bg-red-500 rounded-full" /> LIVE
        </div>
      </div>
      <div className="flex-1 relative">
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: data.lon,
            latitude: data.lat,
            zoom: 15,
            bearing: data.heading || 0
          }}
          mapStyle={mapStyle}
          style={{ width: '100%', height: '100%' }}
        >
          {pathGeoJSON && (
            <Source id="tracking-path" type="geojson" data={pathGeoJSON}>
              <Layer id="tracking-path-glow" type="line" paint={{ 'line-color': '#22c55e', 'line-width': 20, 'line-opacity': 0.24, 'line-blur': 14 }} />
              <Layer id="tracking-path-line" type="line" layout={{ 'line-join': 'round', 'line-cap': 'round' }} paint={{ 'line-color': '#34d399', 'line-width': 8, 'line-opacity': 0.95 }} />
            </Source>
          )}
          <Marker longitude={data.lon} latitude={data.lat}>
            <Suspense fallback={<div className="h-[78px] w-[78px] rounded-full border-4 border-white/70 bg-primary/80 shadow-glow" />}>
              <MapCarIcon
                iconId={activeMapIconId}
                heading={data.heading || 0}
                size={78}
                animated
                showPulse
              />
            </Suspense>
          </Marker>
        </Map>
        <div className="absolute top-6 left-6 z-[1000] p-6 bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl hidden md:block w-80">
          <h1 className="text-2xl font-black text-primary mb-1">Booster Live360</h1>
          <p className="text-muted-foreground font-medium mb-6">Real-time vehicle position</p>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
              <Gauge className="w-6 h-6 text-primary" />
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">Speed</div>
                <div className="text-xl font-bold">{Math.round(data.speed * 3.6)} km/h</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
              <Route className="w-6 h-6 text-primary" />
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">Distance</div>
                <div className="text-xl font-bold">{formatDriveDistance(data.distanceKm, 'kph')} / {formatDriveDistance(data.distanceKm, 'mph')}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
              <Timer className="w-6 h-6 text-primary" />
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">Duration</div>
                <div className="text-xl font-bold">{formatDriveDuration(data.durationMs)}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
              <Clock className="w-6 h-6 text-primary" />
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">Last Ping</div>
                <div className="text-xl font-bold">
                  {data.lastUpdate ? formatDistanceToNow(data.lastUpdate) : 'Just now'} ago
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
