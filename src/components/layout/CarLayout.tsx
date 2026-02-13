import React, { useEffect } from 'react';
import { Home, Map, Music, Grid, Settings, Wifi, Battery } from 'lucide-react';
import { cn } from '@/lib/utils';
import { requestWakeLock } from '@/lib/drive-utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
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
        ? "bg-primary text-primary-foreground shadow-glow scale-110"
        : "text-muted-foreground hover:bg-white/5 hover:text-foreground active:scale-95"
    )}
  >
    <Icon className="w-10 h-10" />
    {isActive && (
      <span className="absolute -left-2 w-2 h-10 bg-primary-foreground rounded-r-full shadow-glow" />
    )}
  </button>
);
export function CarLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    let currentWakeLock: any = null;
    
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        currentWakeLock = await requestWakeLock();
      } else if (currentWakeLock) {
        try {
          await currentWakeLock.release();
          currentWakeLock = null;
        } catch (e) {}
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    handleVisibilityChange(); // Initial lock
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (currentWakeLock) {
        currentWakeLock.release().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="flex h-screen w-screen bg-black text-foreground overflow-hidden font-sans antialiased">
      {/* Sidebar Dock */}
      <nav className="w-28 border-r border-white/10 flex flex-col items-center py-8 gap-6 z-50 bg-zinc-950/80 backdrop-blur-2xl">
        <div className="mb-4 flex flex-col items-center gap-1">
          <span className="text-xl font-black text-primary tracking-tighter">VOS</span>
          <div className="flex gap-1">
            <Wifi className="w-3 h-3 text-green-500" />
            {window.matchMedia('(display-mode: standalone)').matches && (
              <div className="w-1 h-1 bg-primary rounded-full animate-pulse" title="PWA Active" />
            )}
            <Battery className="w-3 h-3 text-white/50" />
          </div>
        </div>
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
          onClick={() => navigate('/media')}
        />
        <NavButton
          icon={Grid}
          isActive={location.pathname === '/apps'}
          onClick={() => navigate('/apps')}
        />
        <div className="mt-auto space-y-6 flex flex-col items-center">
          <div className="text-center">
            <div className="text-lg font-bold tabular-nums">{format(new Date(), 'HH:mm')}</div>
          </div>
          <NavButton
            icon={Settings}
            isActive={location.pathname === '/settings'}
            onClick={() => navigate('/settings')}
          />
        </div>
      </nav>
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative p-10 bg-gradient-to-br from-zinc-950 to-black">
        {children}
      </main>
    </div>
  );
}