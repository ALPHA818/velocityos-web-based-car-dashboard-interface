import React from 'react';
import { Map, Music, Phone, Settings, MessageSquare, Compass } from 'lucide-react';
const APPS = [
  { id: 'maps', name: 'Navigation', icon: Map, color: 'bg-emerald-500/20 text-emerald-500' },
  { id: 'music', name: 'Music', icon: Music, color: 'bg-pink-500/20 text-pink-500' },
  { id: 'phone', name: 'Phone', icon: Phone, color: 'bg-blue-500/20 text-blue-500' },
  { id: 'msgs', name: 'Messages', icon: MessageSquare, color: 'bg-indigo-500/20 text-indigo-500' },
  { id: 'compass', name: 'Explore', icon: Compass, color: 'bg-orange-500/20 text-orange-500' },
  { id: 'settings', name: 'Settings', icon: Settings, color: 'bg-zinc-500/20 text-zinc-400' },
];
export function AppGrid() {
  return (
    <div className="grid grid-cols-3 grid-rows-2 gap-4 h-full">
      {APPS.map((app) => (
        <button
          key={app.id}
          className="flex flex-col items-center justify-center gap-2 dashboard-card hover:bg-zinc-800/80 group"
        >
          <div className={`p-4 rounded-2xl ${app.color} group-hover:scale-110 transition-transform`}>
            <app.icon className="w-8 h-8" />
          </div>
          <span className="text-sm font-bold uppercase tracking-wider opacity-70">
            {app.name}
          </span>
        </button>
      ))}
    </div>
  );
}