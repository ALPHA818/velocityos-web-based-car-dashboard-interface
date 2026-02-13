import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudLightning, Thermometer } from 'lucide-react';
export function WeatherWidget() {
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);
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
      } catch (err) {
        console.error("Weather fetch failed", err);
      }
    };
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => fetchWeather(40.7128, -74.0060) // Fallback NYC
    );
  }, []);
  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="w-12 h-12 text-yellow-500" />;
    if (code < 4) return <Cloud className="w-12 h-12 text-zinc-400" />;
    if (code < 70) return <CloudRain className="w-12 h-12 text-blue-400" />;
    return <CloudLightning className="w-12 h-12 text-purple-400" />;
  };
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