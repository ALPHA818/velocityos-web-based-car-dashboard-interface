export const getWazeLink = (lat: number, lon: number) => {
  return `waze://?ll=${lat},${lon}&navigate=yes`;
};
export const getGoogleMapsLink = (lat: number, lon: number) => {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
};
export const requestWakeLock = async () => {
  if ('wakeLock' in navigator) {
    try {
      const wakeLock = await (navigator as any).wakeLock.request('screen');
      return wakeLock;
    } catch (err) {
      console.error(`Wake Lock error: ${err}`);
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