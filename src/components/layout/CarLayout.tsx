import React, { useEffect } from 'react';
import { Home, Map, Music, Grid, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { requestWakeLock } from '@/lib/drive-utils';
import { useNavigate, useLocation } from 'react-router-dom';
interface NavButtonProps {
  icon: React.ElementType;
  isActive?: boolean;
  onClick?: () => void;
}
const NavButton = ({ icon: Icon, isActive, onClick }: NavButtonProps) => (
  <button
    onClick={onClick}
    className={cn(
      "touch-target w-20 h-20 rounded-3xl transition-all duration-300 flex items-center justify-center relative",
      isActive
        ? "bg-primary text-primary-foreground shadow-glow scale-105"
        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
    )}
  >
    <Icon className="w-10 h-10" />
    {isActive && (
      <span className="absolute -left-1 w-2 h-10 bg-primary-foreground rounded-r-full shadow-glow" />
    )}
  </button>
);
export function CarLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
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
    <div className="flex h-screen w-screen bg-black text-foreground overflow-hidden font-sans antialiased">
      {/* Sidebar Dock (Optimized for Left-Hand Drive) */}
      <nav className="w-28 border-r border-white/5 flex flex-col items-center py-10 gap-8 z-50 bg-zinc-950">
        <NavButton 
          icon={Home} 
          isActive={location.pathname === '/'} 
          onClick={() => navigate('/')} 
        />
        <NavButton 
          icon={Map} 
          isActive={location.pathname === '/navigation'} 
          onClick={() => navigate('/navigation')} 
        />
        <NavButton 
          icon={Music} 
          isActive={location.pathname === '/media'} 
          onClick={() => {}} 
        />
        <NavButton 
          icon={Grid} 
          isActive={location.pathname === '/apps'} 
          onClick={() => {}} 
        />
        <div className="mt-auto">
          <NavButton 
            icon={Settings} 
            isActive={location.pathname === '/settings'} 
            onClick={() => navigate('/settings')} 
          />
        </div>
      </nav>
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative p-8">
        {children}
      </main>
    </div>
  );
}