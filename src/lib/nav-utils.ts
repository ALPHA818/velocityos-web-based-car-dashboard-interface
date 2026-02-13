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
export const MAP_TILES = {
  url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  attribution: '&copy; OpenStreetMap &copy; CARTO',
};
export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'home': return '#3b82f6';
    case 'work': return '#6366f1';
    case 'favorite': return '#f59e0b';
    case 'recent': return '#10b981';
    default: return '#71717a';
  }
};
export const formatETA = (durationSeconds: number): string => {
  const arrivalDate = new Date(Date.now() + durationSeconds * 1000);
  return format(arrivalDate, 'hh:mm a');
};