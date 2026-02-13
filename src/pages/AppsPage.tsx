import React from 'react';
import { CarLayout } from '@/components/layout/CarLayout';
import { motion } from 'framer-motion';
import { 
  Phone, 
  MessageSquare, 
  Calendar, 
  Cloud, 
  Radio, 
  Settings, 
  Shield, 
  Activity,
  Navigation
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
const APPS = [
  { id: 'phone', label: 'Phone', icon: Phone, color: 'bg-green-500', action: () => window.location.href = 'tel:' },
  { id: 'messages', label: 'Messages', icon: MessageSquare, color: 'bg-blue-500', action: () => window.location.href = 'sms:' },
  { id: 'nav', label: 'Maps', icon: Navigation, color: 'bg-indigo-500', path: '/navigation' },
  { id: 'weather', label: 'Weather', icon: Cloud, color: 'bg-sky-400', path: '/' },
  { id: 'radio', label: 'Radio', icon: Radio, color: 'bg-orange-500', path: '/media' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, color: 'bg-rose-500', action: () => {} },
  { id: 'safety', label: 'Safety', icon: Shield, color: 'bg-amber-500', action: () => {} },
  { id: 'settings', label: 'Settings', icon: Settings, color: 'bg-zinc-600', path: '/settings' },
];
export function AppsPage() {
  const navigate = useNavigate();
  return (
    <CarLayout>
      <div className="max-w-7xl mx-auto space-y-10">
        <header>
          <h1 className="text-4xl font-black tracking-tight">App Launcher</h1>
          <p className="text-muted-foreground mt-1">Quick access to all vehicle tools</p>
        </header>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {APPS.map((app, idx) => (
            <motion.button
              key={app.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => app.path ? navigate(app.path) : app.action?.()}
              className="aspect-square dashboard-card flex flex-col items-center justify-center gap-4 group hover:border-primary/50"
            >
              <div className={`p-8 rounded-[2rem] ${app.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <app.icon className="w-12 h-12" />
              </div>
              <span className="text-2xl font-bold tracking-tight">{app.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </CarLayout>
  );
}