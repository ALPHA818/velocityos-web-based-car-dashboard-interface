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
export const getMapStyle = (theme: string): any => {
  const isHighway = theme === 'highway';
  const isDark = theme === 'dark' || isHighway;
  const bgColor = isHighway ? '#020617' : isDark ? '#09090b' : '#f8fafc';
  return {
    version: 8,
    name: 'VelocityOS-Precision',
    metadata: { 'vos:precision': true },
    glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
    sources: {
      openmap: {
        type: 'raster',
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': bgColor }
      },
      {
        id: 'openmap-layer',
        type: 'raster',
        source: 'openmap'
      },
      // Precision Overlay for Roads (Visual Highlight)
      {
        id: 'road-precision-glow',
        type: 'line',
        source: 'openmap', // Note: OSRM/OpenMap raster doesn't have vector features, but we can overlay our own calculated path later in MapView
        paint: {
          'line-color': '#3b82f6',
          'line-width': 12,
          'line-opacity': 0.1
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
export const getMapFilter = (theme: string): string => {
  switch (theme) {
    case 'dark': return 'sepia(0) contrast(1.25) brightness(0.58) invert(0.85) hue-rotate(160deg)';
    case 'highway': return 'contrast(1.6) saturate(2) hue-rotate(220deg) brightness(1.2) contrast(1.8)';
    case 'vibrant': return 'saturate(2.2) contrast(1.4) brightness(1.1) hue-rotate(5deg)';
    case 'offline': return 'grayscale(1) saturate(0) brightness(0.6)';
    default: return 'none';
  }
};
export const formatETA = (durationSeconds: number): string => {
  const arrivalDate = new Date(Date.now() + durationSeconds * 1000);
  return format(arrivalDate, 'HH:mm');
};