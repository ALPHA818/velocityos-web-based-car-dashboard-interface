import React, { useEffect } from 'react';
import { Home, Map, Music, Grid, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { requestWakeLock } from '@/lib/drive-utils';
interface NavButtonProps {
  icon: React.ElementType;
  isActive?: boolean;
  onClick?: () => void;
}
const NavButton = ({ icon: Icon, isActive, onClick }: NavButtonProps) => (
  <button
    onClick={onClick}
    className={cn(
      "touch-target rounded-2xl transition-all duration-200",
      isActive 
        ? "bg-primary text-primary-foreground shadow-glow" 
        : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
    )}
  >
    <Icon className="w-8 h-8" />
  </button>
);
export function CarLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let wakeLock: any = null;
    const lock = async () => {
      wakeLock = await requestWakeLock();
    };
    lock();
    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, []);
  return (
    <div className="flex h-screen w-screen bg-velocity-black text-foreground overflow-hidden">
      {/* Sidebar Dock (Optimized for Left-Hand Drive) */}
      <nav className="w-24 border-r border-white/5 flex flex-col items-center py-8 gap-6 z-50">
        <NavButton icon={Home} isActive />
        <NavButton icon={Map} />
        <NavButton icon={Music} />
        <NavButton icon={Grid} />
        <div className="mt-auto">
          <NavButton icon={Settings} />
        </div>
      </nav>
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative p-6">
        {children}
      </main>
    </div>
  );
}