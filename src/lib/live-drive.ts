import type { GeoJSON } from 'geojson';
import type { TripRecord } from '@/store/use-os-store';
import type { TrackingState } from '@shared/types';

type DistanceUnits = 'mph' | 'kph';
const LIVE_DRIVE_HISTORY_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

type PathCarrier = {
  path?: Array<[number, number, number]>;
};

export function isLiveDriveTrip(trip: TripRecord | null | undefined) {
  if (!trip) {
    return false;
  }

  return trip.driveMode === 'live-drive'
    || (!trip.destinationLabel && (trip.path?.length ?? 0) > 1);
}

export function getLiveDriveTrip(trips: TripRecord[]) {
  const latestTrip = trips[trips.length - 1];
  if (!latestTrip) {
    return null;
  }

  return isLiveDriveTrip(latestTrip) ? latestTrip : null;
}

export function getLiveDriveTripHistory(trips: TripRecord[]) {
  return trips
    .filter((trip) => isLiveDriveTrip(trip) && Boolean(trip.endTime))
    .slice()
    .sort((left, right) => right.startTime - left.startTime);
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

export function formatTripSpeed(speedKph: number | null | undefined, units: DistanceUnits) {
  const normalizedSpeedKph = Math.max(0, speedKph ?? 0);
  const speed = units === 'mph' ? normalizedSpeedKph * 0.621371 : normalizedSpeedKph;
  const precision = speed >= 100 ? 0 : 1;
  return `${speed.toFixed(precision)} ${units}`;
}

export function getTripRetentionRemainingMs(trip: Pick<TripRecord, 'startTime' | 'endTime'>, now = Date.now()) {
  const expiresAt = (trip.endTime ?? trip.startTime) + LIVE_DRIVE_HISTORY_RETENTION_MS;
  return Math.max(0, expiresAt - now);
}

export function formatTripRetentionRemaining(remainingMs: number) {
  const totalHours = Math.max(1, Math.ceil(remainingMs / 3600000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days >= 2) {
    return `${days} days left`;
  }

  if (days === 1) {
    return hours > 0 ? `1 day ${hours} hr left` : '1 day left';
  }

  return `${totalHours} hr left`;
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