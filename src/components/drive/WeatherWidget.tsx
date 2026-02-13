import React, { useState, useEffect, useRef } from 'react';
import { Cloud, Sun, CloudRain, CloudLightning, Thermometer, MapPinOff } from 'lucide-react';
import { useOSStore } from '@/store/use-os-store';
export function WeatherWidget() {
  const currentPos = useOSStore((s) => s.currentPos);
  const gpsStatus = useOSStore((s) => s.gpsStatus);
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);
  const lastFetchedPos = useRef<[number, number] | null>(null);
  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );
        const data = await res.json();
        setWeather({
          temp: Math.round(data.current_weather.temperature),
          code: data.current_weather.weathercode,
        });
        lastFetchedPos.current = [lat, lon];
      } catch (err) {
        console.error("Weather fetch failed", err);
      }
    };
    if (currentPos) {
      // Avoid redundant fetches if position hasn't changed much
      if (!lastFetchedPos.current) {
        fetchWeather(currentPos[0], currentPos[1]);
      } else {
        const dist = Math.sqrt(
          Math.pow(currentPos[0] - lastFetchedPos.current[0], 2) + 
          Math.pow(currentPos[1] - lastFetchedPos.current[1], 2)
        );
        if (dist > 0.05) { // Roughly 5km
          fetchWeather(currentPos[0], currentPos[1]);
        }
      }
    } else if (gpsStatus === 'denied' && !weather) {
      fetchWeather(40.7128, -74.0060); // Default to NYC if denied and no data
    }
  }, [currentPos, gpsStatus, weather]);
  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="w-12 h-12 text-yellow-500" />;
    if (code < 4) return <Cloud className="w-12 h-12 text-zinc-400" />;
    if (code < 70) return <CloudRain className="w-12 h-12 text-blue-400" />;
    return <CloudLightning className="w-12 h-12 text-purple-400" />;
  };
  if (gpsStatus === 'denied' && !weather) {
     return (
       <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
         <MapPinOff className="w-12 h-12 text-muted-foreground" />
         <span className="text-xs uppercase font-black tracking-widest">No Location</span>
       </div>
     );
  }
  if (!weather) return <div className="animate-pulse bg-zinc-800/50 w-full h-full rounded-3xl" />;
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="p-4 bg-white/5 rounded-full">
        {getWeatherIcon(weather.code)}
      </div>
      <div className="flex items-center gap-1">
        <Thermometer className="w-6 h-6 text-muted-foreground" />
        <span className="text-5xl font-bold tabular-nums">
          {weather.temp}°
        </span>
      </div>
    </div>
  );
}