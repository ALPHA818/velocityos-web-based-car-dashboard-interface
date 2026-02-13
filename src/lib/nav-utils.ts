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
export const MAP_THEMES = {
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    filter: 'none'
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    filter: 'brightness(0.6) contrast(1.2) saturate(0.8)'
  },
  vibrant: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    filter: 'brightness(1.1) contrast(1.4) saturate(1.3)'
  },
  highway: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png',
    filter: 'brightness(1.2) contrast(1.6) saturate(1.5)'
  }
};
export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'home': return '#60a5fa'; // Bright Electric Blue
    case 'work': return '#a78bfa'; // Bright Purple
    case 'favorite': return '#fbbf24'; // Bright Amber
    case 'recent': return '#34d399'; // Bright Lime/Emerald
    default: return '#9ca3af';
  }
};
export const formatETA = (durationSeconds: number): string => {
  const arrivalDate = new Date(Date.now() + durationSeconds * 1000);
  return format(arrivalDate, 'hh:mm:ss a');
};