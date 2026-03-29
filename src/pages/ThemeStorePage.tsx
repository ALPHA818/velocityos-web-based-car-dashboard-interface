import React, { useMemo, useState } from 'react';
import { CarLayout } from '@/components/layout/CarLayout';
import { useOSStore } from '@/store/use-os-store';
import { applyMarketTheme, getThemePage, THEME_COUNT, type MarketTheme } from '@/lib/theme-market';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsLandscapeMobile } from '@/hooks/use-landscape-mobile';
import { Coins, Paintbrush2 } from 'lucide-react';

export function ThemeStorePage() {
  const isLandscapeMobile = useIsLandscapeMobile();
  const [page, setPage] = useState(1);

  const units = useOSStore((s) => s.settings.units);
  const kmCoinBalance = useOSStore((s) => s.kmCoinBalance);
  const mCoinBalance = useOSStore((s) => s.mCoinBalance);
  const unlockedThemeIds = useOSStore((s) => s.unlockedThemeIds);
  const activeThemeId = useOSStore((s) => s.activeThemeId);
  const purchaseTheme = useOSStore((s) => s.purchaseTheme);
  const setActiveTheme = useOSStore((s) => s.setActiveTheme);

  const pageSize = isLandscapeMobile ? 8 : 18;
  const totalPages = Math.ceil(THEME_COUNT / pageSize);
  const themes = useMemo(() => getThemePage(page, pageSize), [page, pageSize]);

  const currencyName = units === 'kph' ? 'KMcoin' : 'Mcoin';
  const balance = units === 'kph' ? kmCoinBalance : mCoinBalance;

  const acquireOrApply = (theme: MarketTheme) => {
    const unlocked = unlockedThemeIds.includes(theme.id);

    if (!unlocked) {
      const result = purchaseTheme(theme.id, theme.cost);
      if (!result.success) {
        toast.error(result.reason || `Not enough ${currencyName}`);
        return;
      }
      toast.success(`Unlocked ${theme.name}`);
    }

    setActiveTheme(theme.id);
    applyMarketTheme(theme);
    toast.success(`${theme.name} applied`);
  };

  return (
    <CarLayout>
      <div className={cn('max-w-7xl mx-auto', isLandscapeMobile ? 'px-2 py-2 space-y-3' : 'px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-7')}>
        <header className="space-y-1">
          <h1 className={cn('font-black tracking-tighter', isLandscapeMobile ? 'text-2xl' : 'text-5xl')}>Theme Store</h1>
          <p className={cn('text-muted-foreground', isLandscapeMobile ? 'text-xs' : 'text-lg')}>1,000 unlockable dashboard themes</p>
        </header>

        <section className={cn('dashboard-card flex items-center justify-between', isLandscapeMobile ? 'p-3' : 'p-6')}>
          <div className="flex items-center gap-3">
            <Coins className={cn('text-primary', isLandscapeMobile ? 'w-4 h-4' : 'w-6 h-6')} />
            <div>
              <div className={cn('font-black tabular-nums', isLandscapeMobile ? 'text-sm' : 'text-2xl')}>{balance.toFixed(2)} {currencyName}</div>
              <div className={cn('text-muted-foreground', isLandscapeMobile ? 'text-[10px]' : 'text-sm')}>Earned while driving</div>
            </div>
          </div>
          <div className={cn('text-right text-muted-foreground', isLandscapeMobile ? 'text-[10px]' : 'text-sm')}>
            Page {page} / {totalPages}
          </div>
        </section>

        <section className={cn('grid', isLandscapeMobile ? 'grid-cols-2 gap-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4')}>
          {themes.map((theme) => {
            const unlocked = unlockedThemeIds.includes(theme.id);
            const isActive = activeThemeId === theme.id;

            return (
              <div key={theme.id} className={cn('dashboard-card border', isActive ? 'border-primary/60' : 'border-white/10')}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={cn('font-black', isLandscapeMobile ? 'text-xs' : 'text-lg')}>{theme.name}</div>
                    <div className={cn('text-muted-foreground', isLandscapeMobile ? 'text-[10px]' : 'text-xs')}>{theme.id}</div>
                  </div>
                  <Paintbrush2 className={cn('text-primary', isLandscapeMobile ? 'w-4 h-4' : 'w-5 h-5')} />
                </div>

                <div className={cn('mt-3 grid grid-cols-4 gap-2', isLandscapeMobile && 'mt-2 gap-1')}>
                  <div className="h-6 rounded-md border border-white/20" style={{ backgroundColor: `hsl(${theme.primary})` }} />
                  <div className="h-6 rounded-md border border-white/20" style={{ backgroundColor: `hsl(${theme.ring})` }} />
                  <div className="h-6 rounded-md border border-white/20" style={{ backgroundColor: `hsl(${theme.background})` }} />
                  <div className="h-6 rounded-md border border-white/20" style={{ backgroundColor: `hsl(${theme.card})` }} />
                </div>

                <div className={cn('mt-3 flex items-center justify-between', isLandscapeMobile ? 'mt-2' : 'mt-4')}>
                  <span className={cn('font-bold tabular-nums', isLandscapeMobile ? 'text-[10px]' : 'text-sm')}>
                    {unlocked ? 'Unlocked' : `${theme.cost} ${currencyName}`}
                  </span>
                  <button
                    onClick={() => acquireOrApply(theme)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 font-black transition-colors',
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30',
                      isLandscapeMobile && 'text-[10px] px-2 py-1'
                    )}
                  >
                    {isActive ? 'Active' : unlocked ? 'Apply' : 'Buy'}
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        <section className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </section>
      </div>
    </CarLayout>
  );
}
