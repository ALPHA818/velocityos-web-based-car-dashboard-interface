import { useEffect, useState } from 'react';
import { useOSStore } from '@/store/use-os-store';

export interface WeatherSnapshot {
  temp: number;
  code: number;
  fetchedAt: number;
  lat: number;
  lon: number;
}

interface SharedWeatherState {
  weather: WeatherSnapshot | null;
  error: boolean;
}

const WEATHER_REFRESH_MS = 120000;
const WEATHER_BUCKET_SIZE_DEGREES = 0.12;

const weatherState: SharedWeatherState & { inFlight: Promise<void> | null } = {
  weather: null,
  error: false,
  inFlight: null,
};

const listeners = new Set<(state: SharedWeatherState) => void>();

function notifyListeners() {
  const snapshot = {
    weather: weatherState.weather,
    error: weatherState.error,
  };

  listeners.forEach((listener) => listener(snapshot));
}

function getWeatherBucketKey(lat: number, lon: number) {
  return `${Math.floor(lat / WEATHER_BUCKET_SIZE_DEGREES)}:${Math.floor(lon / WEATHER_BUCKET_SIZE_DEGREES)}`;
}

async function requestWeather(lat: number, lon: number) {
  const snapshot = weatherState.weather;
  const now = Date.now();
  if (snapshot) {
    const age = now - snapshot.fetchedAt;
    const snapshotBucketKey = getWeatherBucketKey(snapshot.lat, snapshot.lon);
    const requestBucketKey = getWeatherBucketKey(lat, lon);
    if (age < WEATHER_REFRESH_MS && snapshotBucketKey === requestBucketKey) {
      return;
    }
  }

  if (weatherState.inFlight) {
    return weatherState.inFlight;
  }

  weatherState.inFlight = (async () => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
      );
      if (!response.ok) {
        throw new Error('Weather request failed');
      }

      const data = await response.json();
      weatherState.weather = {
        temp: Math.round(data.current_weather.temperature),
        code: data.current_weather.weathercode,
        fetchedAt: Date.now(),
        lat,
        lon,
      };
      weatherState.error = false;
    } catch (error) {
      console.error('Weather fetch failed', error);
      weatherState.error = true;
    } finally {
      weatherState.inFlight = null;
      notifyListeners();
    }
  })();

  return weatherState.inFlight;
}

export function useWeatherSnapshot() {
  const currentPos = useOSStore((state) => state.currentPos);
  const gpsStatus = useOSStore((state) => state.gpsStatus);
  const [state, setState] = useState<SharedWeatherState>({
    weather: weatherState.weather,
    error: weatherState.error,
  });

  useEffect(() => {
    const listener = (nextState: SharedWeatherState) => setState(nextState);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (currentPos) {
      void requestWeather(currentPos[0], currentPos[1]);
      return;
    }

    if (gpsStatus === 'denied' && !weatherState.weather) {
      void requestWeather(40.7128, -74.006);
    }
  }, [currentPos, gpsStatus]);

  return {
    weather: state.weather,
    error: state.error,
    gpsStatus,
  };
}