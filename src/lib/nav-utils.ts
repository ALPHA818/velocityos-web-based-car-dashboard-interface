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
  const isDark = theme === 'dark' || theme === 'highway';
  const bgColor = isDark ? '#09090b' : '#ffffff';
  const roadColor = isDark ? '#4a5568' : '#cbd5e0';
  const buildingColor = isDark ? '#18181b' : '#edf2f7';
  const waterColor = '#4299e1';
  const landColor = '#48bb78';
  return {
    version: 8,
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
        paint: { 'fill-color': waterColor }
      },
      {
        id: 'landuse',
        type: 'fill',
        source: 'protomaps',
        'source-layer': 'landuse',
        paint: { 'fill-color': landColor, 'fill-opacity': 0.2 }
      },
      {
        id: 'buildings',
        type: 'fill',
        source: 'protomaps',
        'source-layer': 'buildings',
        paint: { 'fill-color': buildingColor, 'fill-opacity': 0.8 }
      },
      {
        id: 'roads',
        type: 'line',
        source: 'protomaps',
        'source-layer': 'roads',
        paint: {
          'line-color': roadColor,
          'line-width': theme === 'highway' ? 3 : 1.5
        }
      },
      {
        id: 'boundaries',
        type: 'line',
        source: 'protomaps',
        'source-layer': 'boundaries',
        paint: { 'line-color': '#718096', 'line-dasharray': [2, 2] }
      }
    ]
  };
};
export const MAP_THEMES: Record<string, { filter: string }> = {
  light: { filter: 'none' },
  dark: { filter: 'brightness(0.6) contrast(1.2) saturate(0.8)' },
  vibrant: { filter: 'brightness(1.1) contrast(1.4) saturate(1.3)' },
  highway: { filter: 'brightness(1.2) contrast(1.6) saturate(1.5)' }
};
export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'home': return '#60a5fa'; 
    case 'work': return '#a78bfa'; 
    case 'favorite': return '#fbbf24'; 
    case 'recent': return '#34d399'; 
    default: return '#9ca3af';
  }
};
export const formatETA = (durationSeconds: number): string => {
  const arrivalDate = new Date(Date.now() + durationSeconds * 1000);
  return format(arrivalDate, 'hh:mm:ss a');
};