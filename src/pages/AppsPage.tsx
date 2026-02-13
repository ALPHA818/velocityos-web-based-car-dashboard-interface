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
  Navigation,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
const APPS = [
  { id: 'phone', label: 'Phone', icon: Phone, color: 'bg-green-500', action: () => window.location.href = 'tel:' },
  { id: 'messages', label: 'Messages', icon: MessageSquare, color: 'bg-blue-500', action: () => window.location.href = 'sms:' },
  { id: 'nav', label: 'Maps', icon: Navigation, color: 'bg-indigo-500', path: '/navigation' },
  { id: 'weather', label: 'Weather', icon: Cloud, color: 'bg-sky-400', path: '/' },
  { id: 'radio', label: 'Radio', icon: Radio, color: 'bg-orange-500', path: '/media' },
  { 
    id: 'calendar', 
    label: 'Calendar', 
    icon: Calendar, 
    color: 'bg-rose-500', 
    action: () => toast('Next Meeting: Design Review at 2:00 PM', { icon: <CalendarDays className="text-rose-500" /> }) 
  },
  { 
    id: 'safety', 
    label: 'Safety', 
    icon: Shield, 
    color: 'bg-amber-500', 
    action: () => toast.success('All systems nominal. Brake fluid, tire pressure, and oil levels are green.', { icon: <CheckCircle2 className="text-green-500" /> }) 
  },
  { id: 'settings', label: 'Settings', icon: Settings, color: 'bg-zinc-600', path: '/settings' },
];
export function AppsPage() {
  const navigate = useNavigate();
  return (
    <CarLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <header className="mb-12">
          <h1 className="text-6xl font-black tracking-tighter">App Launcher</h1>
          <p className="text-2xl text-muted-foreground mt-2 font-medium">Quick access to vehicle tools</p>
        </header>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {APPS.map((app, idx) => (
            <motion.button
              key={app.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.04 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => app.path ? navigate(app.path) : app.action?.()}
              className="aspect-square dashboard-card flex flex-col items-center justify-center gap-6 group hover:border-primary/50 transition-all shadow-lg active:shadow-inner"
            >
              <div className={`p-10 rounded-[2.5rem] ${app.color} text-white shadow-lg group-hover:shadow-glow transition-all duration-300`}>
                <app.icon className="w-14 h-14" />
              </div>
              <span className="text-2xl font-black tracking-tight">{app.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </CarLayout>
  );
}