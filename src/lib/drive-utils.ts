export const getWazeLink = (lat: number, lon: number) => {
  return `waze://?ll=${lat},${lon}&navigate=yes`;
};
export const getGoogleMapsLink = (lat: number, lon: number) => {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
};
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