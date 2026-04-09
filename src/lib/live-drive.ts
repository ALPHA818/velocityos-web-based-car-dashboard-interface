import type { GeoJSON } from 'geojson';
import type { TripRecord } from '@/store/use-os-store';
import type { TrackingState } from '@shared/types';

type DistanceUnits = 'mph' | 'kph';

type PathCarrier = {
  path?: Array<[number, number, number]>;
};

export function getLiveDriveTrip(trips: TripRecord[]) {
  const latestTrip = trips[trips.length - 1];
  if (!latestTrip) {
    return null;
  }

  const isLiveDrive = latestTrip.driveMode === 'live-drive'
    || (!latestTrip.destinationLabel && (latestTrip.path?.length ?? 0) > 1);

  return isLiveDrive ? latestTrip : null;
}

export function getTripDurationMs(trip: Pick<TripRecord, 'startTime' | 'endTime'>, now = Date.now()) {
  const endedAt = trip.endTime ?? now;
  return Math.max(0, endedAt - trip.startTime);
}

export function formatDriveDuration(durationMs: number) {
  const totalMinutes = Math.max(0, Math.round(durationMs / 60000));
  if (totalMinutes < 1) {
    return '<1 min';
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours) {
    return `${totalMinutes} min`;
  }

  if (!minutes) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

export function formatDriveDistance(distanceKm: number, units: DistanceUnits) {
  const isMiles = units === 'mph';
  const distance = isMiles ? distanceKm * 0.621371 : distanceKm;
  const precision = distance >= 100 ? 0 : 1;
  return `${distance.toFixed(precision)} ${isMiles ? 'mi' : 'km'}`;
}

export function getPathGeoJson(pathCarrier: PathCarrier | TrackingState | null): GeoJSON.Feature<GeoJSON.LineString> | null {
  if (!pathCarrier?.path || pathCarrier.path.length < 2) {
    return null;
  }

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: pathCarrier.path.map(([lat, lon]) => [lon, lat]),
    },
  };
}