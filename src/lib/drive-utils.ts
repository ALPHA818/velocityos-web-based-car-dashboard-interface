export const getWazeLink = (lat: number, lon: number) => `https://www.waze.com/ul?ll=${encodeURIComponent(`${lat},${lon}`)}&navigate=yes`;
export const getGoogleMapsLink = (lat: number, lon: number) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lon}`)}&travelmode=driving`;
export const requestWakeLock = async () => {
  if ('wakeLock' in navigator) {
    if (document.visibilityState !== 'visible') return null;
    try {
      const wakeLock = await (navigator as any).wakeLock.request('screen');
      return wakeLock;
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        console.warn(`Wake Lock request failed: ${err.message}`);
      }
      return null;
    }
  }
  return null;
};
export const formatSpeed = (metersPerSecond: number | null, unit: 'mph' | 'kph' = 'mph'): number => {
  if (metersPerSecond === null) return 0;
  const kph = metersPerSecond * 3.6;
  if (unit === 'mph') {
    return Math.round(kph * 0.621371);
  }
  return Math.round(kph);
};
export const isValidCoordinate = (val: string | number, type: 'lat' | 'lon'): boolean => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return false;
  if (type === 'lat') return num >= -90 && num <= 90;
  if (type === 'lon') return num >= -180 && num <= 180;
  return false;
};

export const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // in meters
};