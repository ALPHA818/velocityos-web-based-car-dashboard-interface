export interface TripInsightRecord {
  startTime: number;
  endTime?: number;
  distanceKm: number;
  destinationLabel?: string | null;
  averageSpeedKph?: number;
  maxSpeedKph?: number;
}

function getTripDurationMinutes(trip: TripInsightRecord, now = Date.now()) {
  const durationMs = trip.endTime ? trip.endTime - trip.startTime : now - trip.startTime;
  return Math.max(0, Math.round(durationMs / 60000));
}

function toDayKey(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function getDrivingStreakDays(trips: TripInsightRecord[]) {
  if (!trips.length) return 0;

  const uniqueDays = [...new Set(trips.map((trip) => toDayKey(trip.startTime)))].sort((left, right) => {
    return new Date(right).getTime() - new Date(left).getTime();
  });

  let streak = 0;
  let cursor = new Date();

  for (const dayKey of uniqueDays) {
    if (dayKey !== toDayKey(cursor.getTime())) {
      if (streak === 0) {
        cursor.setDate(cursor.getDate() - 1);
        if (dayKey !== toDayKey(cursor.getTime())) {
          break;
        }
      } else {
        break;
      }
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function getFavoriteDestination(trips: TripInsightRecord[]) {
  const counts = new Map<string, number>();

  trips.forEach((trip) => {
    const label = trip.destinationLabel?.trim();
    if (!label) return;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  let winner: { label: string; count: number } | null = null;
  counts.forEach((count, label) => {
    if (!winner || count > winner.count) {
      winner = { label, count };
    }
  });

  return winner;
}

export function getRecentRouteMemory(trips: TripInsightRecord[], limit = 3) {
  return trips
    .slice()
    .sort((left, right) => right.startTime - left.startTime)
    .filter((trip) => Boolean(trip.destinationLabel))
    .reduce<Array<{ label: string; lastDrivenAt: number }>>((memory, trip) => {
      const label = trip.destinationLabel?.trim();
      if (!label || memory.some((entry) => entry.label === label)) {
        return memory;
      }

      memory.push({ label, lastDrivenAt: trip.startTime });
      return memory;
    }, [])
    .slice(0, limit);
}

export function getTripComparison(trips: TripInsightRecord[]) {
  const ordered = trips.slice().sort((left, right) => right.startTime - left.startTime);
  const current = ordered[0];
  const previous = ordered[1];

  if (!current || !previous) {
    return null;
  }

  return {
    current,
    previous,
    distanceDeltaKm: Number((current.distanceKm - previous.distanceKm).toFixed(2)),
    durationDeltaMin: getTripDurationMinutes(current) - getTripDurationMinutes(previous),
    averageSpeedDeltaKph: Number(((current.averageSpeedKph ?? 0) - (previous.averageSpeedKph ?? 0)).toFixed(1)),
  };
}

export function getTripInsightSummary(trips: TripInsightRecord[]) {
  const totalDurationMin = trips.reduce((sum, trip) => sum + getTripDurationMinutes(trip), 0);
  const longestTrip = trips.reduce<TripInsightRecord | null>((longest, trip) => {
    if (!longest || trip.distanceKm > longest.distanceKm) {
      return trip;
    }
    return longest;
  }, null);

  return {
    totalDurationMin,
    drivingStreakDays: getDrivingStreakDays(trips),
    favoriteDestination: getFavoriteDestination(trips),
    recentRouteMemory: getRecentRouteMemory(trips),
    comparison: getTripComparison(trips),
    longestTrip,
  };
}