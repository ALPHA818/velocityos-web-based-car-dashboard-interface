import { format } from 'date-fns';
export interface RouteData {
  coordinates: [number, number][];
  distance: number;
  duration: number;
}
export const fetchRoute = async (start: [number, number], end: [number, number]): Promise<RouteData | null> => {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
    );
    const data = await response.json();
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return null;
    }
    const route = data.routes[0];
    return {
      coordinates: route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]),
      distance: route.distance,
      duration: route.duration,
    };
  } catch (error) {
    console.error('Failed to fetch route:', error);
    return null;
  }
};
export const getVectorStyle = (theme: string): any => {
  const isHighway = theme === 'highway';
  const isDark = theme === 'dark' || isHighway;
  const isVibrant = theme === 'vibrant';
  const bgColor = isHighway ? '#020617' : isDark ? '#09090b' : '#f8fafc';
  const roadColor = isHighway ? '#3b82f6' : isDark ? '#334155' : '#94a3b8';
  const highwayColor = isHighway ? '#60a5fa' : isVibrant ? '#10b981' : '#3b82f6';
  const landColor = isDark ? '#111827' : '#f1f5f9';
  const waterColor = isHighway ? '#0f172a' : isVibrant ? '#06b6d4' : isDark ? '#1e3a8a' : '#bfdbfe';
  return {
    version: 8,
    // Add public glyphs for labels
    glyphs: "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
    sources: {
      protomaps: {
        type: 'vector',
        tiles: ['https://api.protomaps.com/tiles/v3/{z}/{x}/{y}.mvt'],
        attribution: 'Protomaps © OpenStreetMap'
      }
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': bgColor }
      },
      {
        id: 'water',
        type: 'fill',
        source: 'protomaps',
        'source-layer': 'water',
        paint: { 'fill-color': waterColor, 'fill-opacity': 0.6 }
      },
      {
        id: 'landuse',
        type: 'fill',
        source: 'protomaps',
        'source-layer': 'landuse',
        paint: { 'fill-color': landColor, 'fill-opacity': 0.8 }
      },
      {
        id: 'roads',
        type: 'line',
        source: 'protomaps',
        'source-layer': 'roads',
        filter: ['!=', ['get', 'kind'], 'highway'],
        paint: {
          'line-color': roadColor,
          'line-width': isHighway ? 2 : 1.5,
          'line-opacity': 0.5
        }
      },
      {
        id: 'highways',
        type: 'line',
        source: 'protomaps',
        'source-layer': 'roads',
        filter: ['==', ['get', 'kind'], 'highway'],
        paint: {
          'line-color': highwayColor,
          'line-width': isHighway ? 5 : 3,
          'line-blur': isHighway ? 2 : 0,
          'line-opacity': 1
        }
      },
      {
        id: 'road-labels',
        type: 'symbol',
        source: 'protomaps',
        'source-layer': 'roads',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 14,
          'symbol-placement': 'line',
          'text-letter-spacing': 0.05
        },
        paint: {
          'text-color': isDark ? '#ffffff' : '#000000',
          'text-halo-color': bgColor,
          'text-halo-width': 1.5,
          'text-opacity': 0.9
        }
      }
    ]
  };
};
export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'home': return '#3b82f6';
    case 'work': return '#8b5cf6';
    case 'favorite': return '#f59e0b';
    case 'recent': return '#10b981';
    default: return '#64748b';
  }
};
export const formatETA = (durationSeconds: number): string => {
  const arrivalDate = new Date(Date.now() + durationSeconds * 1000);
  return format(arrivalDate, 'HH:mm');
};