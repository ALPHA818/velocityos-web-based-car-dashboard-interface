import React, { useMemo, useState } from 'react';
import { CarLayout } from '@/components/layout/CarLayout';
import { DashboardBackdrop } from '@/components/layout/DashboardCosmetics';
import { useOSStore } from '@/store/use-os-store';
import { applyMarketTheme, getThemeById, getThemePage, THEME_COUNT, type MarketTheme } from '@/lib/theme-market';
import { getMapIconById, getMapIconPage, MAP_ICON_COUNT, type MapCarIconDefinition } from '@/lib/map-icon-market';
import {
  AMBIENT_EFFECT_COUNT,
  LIMITED_BUNDLE_COUNT,
  SCENE_PACK_COUNT,
  TRIP_COSMETIC_COUNT,
  WIDGET_SKIN_COUNT,
  getAmbientEffectById,
  getAmbientEffectPage,
  getBundleRewardCategoryLabel,
  getLimitedBundlePage,
  getScenePackById,
  getScenePackPage,
  getTripCosmeticById,
  getTripCosmeticPage,
  getWidgetSkinById,
  getWidgetSkinPage,
  type AmbientEffectDefinition,
  type BundleRewardDescriptor,
  type LimitedBundleDefinition,
  type ScenePackDefinition,
  type TripCosmeticDefinition,
  type WidgetSkinDefinition,
} from '@/lib/cosmetic-market';
import { getStoreRankByCost } from '@/lib/store-ranks';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsLandscapeMobile } from '@/hooks/use-landscape-mobile';
import { Award, CarFront, ChevronLeft, ChevronRight, CloudSun, Coins, Gauge, Package2, Paintbrush2, Power } from 'lucide-react';
import { MapCarIcon } from '@/components/drive/MapCarIcon';

type StoreCategory =
  | 'trip-cosmetics'
  | 'startup-scenes'
  | 'limited-bundles'
  | 'ambient-effects'
  | 'widget-skins'
  | 'themes'
  | 'map-icons';

type RankSortMode = 'store' | 'rank-asc' | 'rank-desc';

const RANK_SORT_OPTIONS: Array<{ id: RankSortMode; label: string }> = [
  { id: 'store', label: 'Store Order' },
  { id: 'rank-asc', label: 'Common -> Mythic' },
  { id: 'rank-desc', label: 'Mythic -> Common' },
];

const STORE_CATEGORIES: Array<{
  id: StoreCategory;
  title: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    id: 'trip-cosmetics',
    title: 'Trip Progression',
    description: 'Driver badges, odometer plates, and trip-card frames',
    icon: Award,
  },
  {
    id: 'startup-scenes',
    title: 'Startup & Idle Scenes',
    description: 'Boot visuals, charging cues, and parked-mode atmospheres',
    icon: Power,
  },
  {
    id: 'limited-bundles',
    title: 'Limited Bundles',
    description: 'Seasonal drops that unlock multiple cosmetics at once',
    icon: Package2,
  },
  {
    id: 'ambient-effects',
    title: 'Ambient Effects',
    description: 'Rain, tunnel glow, sunrise haze, snowfall, and city passes',
    icon: CloudSun,
  },
  {
    id: 'widget-skins',
    title: 'Gauge & Widget Skins',
    description: 'Speedometer, battery, trip, weather, and clock skins',
    icon: Gauge,
  },
  {
    id: 'themes',
    title: 'Dashboard Themes',
    description: 'Apply color systems across the dashboard',
    icon: Paintbrush2,
  },
  {
    id: 'map-icons',
    title: 'Map Car Icons',
    description: 'Equip animated ride markers for map mode',
    icon: CarFront,
  },
];

function StoreActionButton({
  active,
  unlocked,
  activeLabel,
  unlockedLabel,
  lockedLabel,
  compact,
  onClick,
  disabled = false,
}: {
  active: boolean;
  unlocked: boolean;
  activeLabel: string;
  unlockedLabel: string;
  lockedLabel: string;
  compact: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-lg border px-3 py-1.5 font-black transition-colors disabled:opacity-55',
        active
          ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
          : unlocked
            ? 'border-primary/40 bg-primary/20 text-primary hover:bg-primary/30'
            : 'border-white/15 bg-white/[0.04] text-white hover:border-primary/30 hover:text-primary',
        compact && 'px-2 py-1 text-[10px]'
      )}
    >
      {active ? activeLabel : unlocked ? unlockedLabel : lockedLabel}
    </button>
  );
}

function StoreItemCard({
  cost,
  highlighted = false,
  children,
}: {
  cost: number;
  highlighted?: boolean;
  children: React.ReactNode;
}) {
  const rank = getStoreRankByCost(cost);
  const isMythic = rank.id === 'mythic';

  return (
    <div
      className={cn(
        'dashboard-card border relative overflow-hidden',
        highlighted ? 'border-primary/60' : 'border-white/10',
        isMythic && 'shadow-[0_18px_52px_rgba(248,113,113,0.12)]'
      )}
    >
      {isMythic && (
        <>
          <div
            className="pointer-events-none absolute inset-[1px] rounded-[inherit]"
            style={{
              background: `radial-gradient(circle at top right, ${rank.glowColor} 0%, transparent 34%), radial-gradient(circle at bottom left, rgba(251,191,36,0.12) 0%, transparent 28%)`,
              boxShadow: 'inset 0 0 0 1px rgba(251,191,36,0.08)',
            }}
          />
          <div
            className="pointer-events-none absolute inset-x-6 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${rank.color}, rgba(251,191,36,0.88), transparent)` }}
          />
        </>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function getBundleRewardName(reward: BundleRewardDescriptor) {
  switch (reward.category) {
    case 'trip-cosmetics':
      return getTripCosmeticById(reward.itemId)?.name ?? reward.itemId;
    case 'startup-scenes':
      return getScenePackById(reward.itemId)?.name ?? reward.itemId;
    case 'ambient-effects':
      return getAmbientEffectById(reward.itemId)?.name ?? reward.itemId;
    case 'widget-skins':
      return getWidgetSkinById(reward.itemId)?.name ?? reward.itemId;
    case 'themes':
      return getThemeById(reward.itemId)?.name ?? reward.itemId;
    case 'map-icons':
      return getMapIconById(reward.itemId)?.name ?? reward.itemId;
    default:
      return reward.itemId;
  }
}

function getWidgetPreviewTone(widgetSkin: WidgetSkinDefinition) {
  switch (widgetSkin.style) {
    case 'retro':
      return {
        frame: 'border-amber-400/25 bg-amber-500/10',
        value: 'font-mono text-amber-300',
        label: 'text-amber-100/70',
      };
    case 'motorsport':
      return {
        frame: 'border-rose-400/30 bg-rose-500/10',
        value: 'text-rose-200 tracking-tight',
        label: 'text-white/65 uppercase tracking-[0.22em]',
      };
    case 'luxury':
      return {
        frame: 'border-amber-200/20 bg-white/[0.05]',
        value: 'font-serif text-amber-100',
        label: 'text-amber-100/55 uppercase tracking-[0.18em]',
      };
    case 'cyber':
      return {
        frame: 'border-emerald-400/25 bg-emerald-500/10',
        value: 'font-mono text-emerald-300',
        label: 'text-emerald-100/60 uppercase tracking-[0.24em]',
      };
    case 'expedition':
      return {
        frame: 'border-emerald-300/20 bg-lime-500/10',
        value: 'font-mono text-lime-200',
        label: 'text-lime-100/55 uppercase tracking-[0.18em]',
      };
    case 'core':
    default:
      return {
        frame: 'border-primary/25 bg-primary/10',
        value: 'text-primary',
        label: 'text-white/60 uppercase tracking-[0.18em]',
      };
  }
}

function ThemePreviewCard({ theme, compact }: { theme: MarketTheme; compact: boolean }) {
  const rank = getStoreRankByCost(theme.cost);
  const isMythic = rank.id === 'mythic';

  return (
    <div
      className={cn('mt-3 overflow-hidden rounded-[1.75rem] border border-white/10 p-3', compact ? 'mt-2 p-2.5' : '')}
      style={{
        background: isMythic
          ? `radial-gradient(circle at top right, ${rank.glowColor} 0%, transparent 24%), radial-gradient(circle at bottom left, hsl(${theme.accent} / 0.22), transparent 26%), linear-gradient(165deg, hsl(${theme.background}), hsl(${theme.card}))`
          : `radial-gradient(circle at top right, hsl(${theme.ring} / 0.3), transparent 42%), linear-gradient(165deg, hsl(${theme.background}), hsl(${theme.card}))`,
        boxShadow: isMythic ? `0 16px 36px ${rank.glowColor}` : undefined,
      }}
    >
      <div
        className="rounded-[1.45rem] border border-white/10 p-3"
        style={{
          background: `linear-gradient(180deg, hsl(${theme.card}), hsl(${theme.background}))`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px hsl(${theme.ring} / 0.08)`,
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className="rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em]"
            style={{
              borderColor: `hsl(${theme.ring} / 0.28)`,
              backgroundColor: `hsl(${theme.secondary} / 0.38)`,
              color: `hsl(${theme.accent})`,
            }}
          >
            {isMythic ? 'Signature Dash' : 'Live Dash'}
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/55">{isMythic ? 'Flagship' : 'Preview'}</span>
        </div>

        <div className="mt-3 grid grid-cols-[1.1fr,0.9fr] gap-2">
          <div
            className="rounded-[1.2rem] border p-3"
            style={{
              borderColor: `hsl(${theme.ring} / 0.16)`,
              background: `linear-gradient(180deg, hsl(${theme.card}), hsl(${theme.background}))`,
            }}
          >
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">Speed</div>
            <div className="mt-1 text-4xl font-black leading-none" style={{ color: `hsl(${theme.primary})` }}>
              124
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-black/25">
              <div
                className="h-full rounded-full"
                style={{ width: '72%', background: `linear-gradient(90deg, hsl(${theme.primary}), hsl(${theme.ring}))` }}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <div
              className="rounded-[1.1rem] border p-2.5"
              style={{
                borderColor: `hsl(${theme.ring} / 0.16)`,
                backgroundColor: `hsl(${theme.secondary} / 0.42)`,
              }}
            >
              <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/50">Battery</div>
              <div className="mt-1 text-lg font-black" style={{ color: `hsl(${theme.accent})` }}>
                76%
              </div>
            </div>
            <div
              className="rounded-[1.1rem] border p-2.5"
              style={{
                borderColor: `hsl(${theme.ring} / 0.16)`,
                backgroundColor: `hsl(${theme.accent} / 0.18)`,
              }}
            >
              <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/50">Route</div>
              <div className="mt-1 text-sm font-black" style={{ color: `hsl(${theme.ring})` }}>
                18.4 km
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="h-2 flex-1 rounded-full" style={{ background: `linear-gradient(90deg, hsl(${theme.primary}), hsl(${theme.accent}))` }} />
          <div className="h-2 w-12 rounded-full" style={{ backgroundColor: `hsl(${theme.secondary})` }} />
        </div>
      </div>
    </div>
  );
}

function StoreRankBadge({ cost, compact }: { cost: number; compact: boolean }) {
  const rank = getStoreRankByCost(cost);
  const isMythic = rank.id === 'mythic';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em]',
        compact && 'px-1.5 py-0.5 text-[9px]'
      )}
      style={{
        color: rank.color,
        borderColor: rank.borderColor,
        background: isMythic
          ? 'linear-gradient(135deg, rgba(127,29,29,0.42), rgba(120,53,15,0.36), rgba(146,64,14,0.4))'
          : rank.backgroundColor,
        boxShadow: isMythic
          ? `0 0 24px ${rank.glowColor}, inset 0 0 0 1px rgba(251,191,36,0.16)`
          : `0 0 20px ${rank.glowColor}`,
        textShadow: isMythic ? '0 0 10px rgba(251,191,36,0.18)' : undefined,
      }}
    >
      {rank.label}
    </span>
  );
}

function RankSortSpinEdit({
  value,
  compact,
  onChange,
}: {
  value: RankSortMode;
  compact: boolean;
  onChange: (value: RankSortMode) => void;
}) {
  const currentIndex = Math.max(0, RANK_SORT_OPTIONS.findIndex((option) => option.id === value));
  const currentOption = RANK_SORT_OPTIONS[currentIndex] ?? RANK_SORT_OPTIONS[0];

  const stepOption = (direction: -1 | 1) => {
    const nextIndex = (currentIndex + direction + RANK_SORT_OPTIONS.length) % RANK_SORT_OPTIONS.length;
    onChange(RANK_SORT_OPTIONS[nextIndex].id);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="text-right">
        <div className={cn('font-black uppercase tracking-[0.22em] text-white/55', compact ? 'text-[9px]' : 'text-[10px]')}>
          Rank Sort
        </div>
        <div className={cn('text-white/85', compact ? 'text-[10px]' : 'text-xs')}>
          {currentOption.label}
        </div>
      </div>

      <div className="inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.04] p-1">
        <button
          type="button"
          aria-label="Previous rank sort mode"
          onClick={() => stepOption(-1)}
          className={cn(
            'rounded-xl border border-white/10 text-white/75 transition-colors hover:border-primary/40 hover:text-primary',
            compact ? 'p-1' : 'p-1.5'
          )}
        >
          <ChevronLeft className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        </button>

        <div
          className={cn(
            'min-w-[8.5rem] px-2 text-center font-black uppercase tracking-[0.18em] text-white/90',
            compact ? 'text-[9px]' : 'text-[10px]'
          )}
        >
          {currentOption.label}
        </div>

        <button
          type="button"
          aria-label="Next rank sort mode"
          onClick={() => stepOption(1)}
          className={cn(
            'rounded-xl border border-white/10 text-white/75 transition-colors hover:border-primary/40 hover:text-primary',
            compact ? 'p-1' : 'p-1.5'
          )}
        >
          <ChevronRight className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        </button>
      </div>
    </div>
  );
}

function paginateItems<T>(items: T[], page: number, pageSize: number): T[] {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const start = (safePage - 1) * safePageSize;
  return items.slice(start, start + safePageSize);
}

function sortItemsByRank<T extends { cost: number }>(items: T[], mode: RankSortMode): T[] {
  if (mode === 'store') {
    return items;
  }

  const direction = mode === 'rank-desc' ? -1 : 1;

  return items
    .map((item, index) => ({
      item,
      index,
      rankOrder: getStoreRankByCost(item.cost).order,
    }))
    .sort((left, right) => {
      const rankDelta = (left.rankOrder - right.rankOrder) * direction;
      if (rankDelta !== 0) {
        return rankDelta;
      }

      return left.index - right.index;
    })
    .map((entry) => entry.item);
}

export function ThemeStorePage() {
  const isLandscapeMobile = useIsLandscapeMobile();
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<StoreCategory>('trip-cosmetics');
  const [rankSortMode, setRankSortMode] = useState<RankSortMode>('store');

  const units = useOSStore((state) => state.settings.units);
  const kmCoinBalance = useOSStore((state) => state.kmCoinBalance);
  const mCoinBalance = useOSStore((state) => state.mCoinBalance);

  const unlockedThemeIds = useOSStore((state) => state.unlockedThemeIds);
  const activeThemeId = useOSStore((state) => state.activeThemeId);
  const unlockedMapIconIds = useOSStore((state) => state.unlockedMapIconIds);
  const activeMapIconId = useOSStore((state) => state.activeMapIconId);
  const unlockedTripCosmeticIds = useOSStore((state) => state.unlockedTripCosmeticIds);
  const activeTripCosmeticId = useOSStore((state) => state.activeTripCosmeticId);
  const unlockedScenePackIds = useOSStore((state) => state.unlockedScenePackIds);
  const activeScenePackId = useOSStore((state) => state.activeScenePackId);
  const unlockedAmbientEffectIds = useOSStore((state) => state.unlockedAmbientEffectIds);
  const activeAmbientEffectId = useOSStore((state) => state.activeAmbientEffectId);
  const unlockedWidgetSkinIds = useOSStore((state) => state.unlockedWidgetSkinIds);
  const activeWidgetSkinId = useOSStore((state) => state.activeWidgetSkinId);
  const unlockedBundleIds = useOSStore((state) => state.unlockedBundleIds);

  const purchaseTheme = useOSStore((state) => state.purchaseTheme);
  const setActiveTheme = useOSStore((state) => state.setActiveTheme);
  const purchaseMapIcon = useOSStore((state) => state.purchaseMapIcon);
  const setActiveMapIcon = useOSStore((state) => state.setActiveMapIcon);
  const purchaseTripCosmetic = useOSStore((state) => state.purchaseTripCosmetic);
  const setActiveTripCosmetic = useOSStore((state) => state.setActiveTripCosmetic);
  const purchaseScenePack = useOSStore((state) => state.purchaseScenePack);
  const setActiveScenePack = useOSStore((state) => state.setActiveScenePack);
  const purchaseAmbientEffect = useOSStore((state) => state.purchaseAmbientEffect);
  const setActiveAmbientEffect = useOSStore((state) => state.setActiveAmbientEffect);
  const purchaseWidgetSkin = useOSStore((state) => state.purchaseWidgetSkin);
  const setActiveWidgetSkin = useOSStore((state) => state.setActiveWidgetSkin);
  const purchaseBundle = useOSStore((state) => state.purchaseBundle);

  const pageSize = isLandscapeMobile ? 8 : 18;
  const totalItems = useMemo(() => {
    switch (category) {
      case 'trip-cosmetics':
        return TRIP_COSMETIC_COUNT;
      case 'startup-scenes':
        return SCENE_PACK_COUNT;
      case 'limited-bundles':
        return LIMITED_BUNDLE_COUNT;
      case 'ambient-effects':
        return AMBIENT_EFFECT_COUNT;
      case 'widget-skins':
        return WIDGET_SKIN_COUNT;
      case 'themes':
        return THEME_COUNT;
      case 'map-icons':
        return MAP_ICON_COUNT;
      default:
        return 0;
    }
  }, [category]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const tripCosmetics = useMemo(() => {
    if (category !== 'trip-cosmetics') return [];
    return paginateItems(sortItemsByRank(getTripCosmeticPage(1, TRIP_COSMETIC_COUNT), rankSortMode), page, pageSize);
  }, [category, page, pageSize, rankSortMode]);
  const scenePacks = useMemo(() => {
    if (category !== 'startup-scenes') return [];
    return paginateItems(sortItemsByRank(getScenePackPage(1, SCENE_PACK_COUNT), rankSortMode), page, pageSize);
  }, [category, page, pageSize, rankSortMode]);
  const limitedBundles = useMemo(() => {
    if (category !== 'limited-bundles') return [];
    return paginateItems(sortItemsByRank(getLimitedBundlePage(1, LIMITED_BUNDLE_COUNT), rankSortMode), page, pageSize);
  }, [category, page, pageSize, rankSortMode]);
  const ambientEffects = useMemo(() => {
    if (category !== 'ambient-effects') return [];
    return paginateItems(sortItemsByRank(getAmbientEffectPage(1, AMBIENT_EFFECT_COUNT), rankSortMode), page, pageSize);
  }, [category, page, pageSize, rankSortMode]);
  const widgetSkins = useMemo(() => {
    if (category !== 'widget-skins') return [];
    return paginateItems(sortItemsByRank(getWidgetSkinPage(1, WIDGET_SKIN_COUNT), rankSortMode), page, pageSize);
  }, [category, page, pageSize, rankSortMode]);
  const themes = useMemo(() => {
    if (category !== 'themes') return [];
    return paginateItems(sortItemsByRank(getThemePage(1, THEME_COUNT), rankSortMode), page, pageSize);
  }, [category, page, pageSize, rankSortMode]);
  const mapIcons = useMemo(() => {
    if (category !== 'map-icons') return [];
    return paginateItems(sortItemsByRank(getMapIconPage(1, MAP_ICON_COUNT), rankSortMode), page, pageSize);
  }, [category, page, pageSize, rankSortMode]);

  const currencyName = units === 'kph' ? 'KMcoin' : 'Mcoin';
  const balance = units === 'kph' ? kmCoinBalance : mCoinBalance;
  const previewScene = getScenePackById(activeScenePackId) ?? getScenePackById('scene-garage-grid');
  const previewAmbientEffect = getAmbientEffectById(activeAmbientEffectId) ?? getAmbientEffectById('effect-clear-air');

  const acquireOrApplyTheme = (theme: MarketTheme) => {
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

  const acquireOrApplyMapIcon = (icon: MapCarIconDefinition) => {
    const unlocked = unlockedMapIconIds.includes(icon.id);

    if (!unlocked) {
      const result = purchaseMapIcon(icon.id, icon.cost);
      if (!result.success) {
        toast.error(result.reason || `Not enough ${currencyName}`);
        return;
      }
      toast.success(`Unlocked ${icon.name}`);
    }

    setActiveMapIcon(icon.id);
    toast.success(`${icon.name} equipped`);
  };

  const acquireOrApplyTripCosmetic = (item: TripCosmeticDefinition) => {
    const unlocked = unlockedTripCosmeticIds.includes(item.id);
    if (!unlocked) {
      const result = purchaseTripCosmetic(item.id, item.cost);
      if (!result.success) {
        toast.error(result.reason || `Not enough ${currencyName}`);
        return;
      }
      toast.success(`Unlocked ${item.name}`);
    }

    setActiveTripCosmetic(item.id);
    toast.success(`${item.name} equipped`);
  };

  const acquireOrApplyScenePack = (scenePack: ScenePackDefinition) => {
    const unlocked = unlockedScenePackIds.includes(scenePack.id);
    if (!unlocked) {
      const result = purchaseScenePack(scenePack.id, scenePack.cost);
      if (!result.success) {
        toast.error(result.reason || `Not enough ${currencyName}`);
        return;
      }
      toast.success(`Unlocked ${scenePack.name}`);
    }

    setActiveScenePack(scenePack.id);
    toast.success(`${scenePack.name} activated`);
  };

  const acquireOrApplyAmbientEffect = (effect: AmbientEffectDefinition) => {
    const unlocked = unlockedAmbientEffectIds.includes(effect.id);
    if (!unlocked) {
      const result = purchaseAmbientEffect(effect.id, effect.cost);
      if (!result.success) {
        toast.error(result.reason || `Not enough ${currencyName}`);
        return;
      }
      toast.success(`Unlocked ${effect.name}`);
    }

    setActiveAmbientEffect(effect.id);
    toast.success(`${effect.name} activated`);
  };

  const acquireOrApplyWidgetSkin = (widgetSkin: WidgetSkinDefinition) => {
    const unlocked = unlockedWidgetSkinIds.includes(widgetSkin.id);
    if (!unlocked) {
      const result = purchaseWidgetSkin(widgetSkin.id, widgetSkin.cost);
      if (!result.success) {
        toast.error(result.reason || `Not enough ${currencyName}`);
        return;
      }
      toast.success(`Unlocked ${widgetSkin.name}`);
    }

    setActiveWidgetSkin(widgetSkin.id);
    toast.success(`${widgetSkin.name} equipped`);
  };

  const acquireBundle = (bundle: LimitedBundleDefinition) => {
    if (unlockedBundleIds.includes(bundle.id)) return;

    const result = purchaseBundle(bundle.id, bundle.cost, bundle.rewards);
    if (!result.success) {
      toast.error(result.reason || `Not enough ${currencyName}`);
      return;
    }

    toast.success(`${bundle.name} unlocked ${bundle.rewards.length} rewards`);
  };

  const selectCategory = (nextCategory: StoreCategory) => {
    setCategory(nextCategory);
    setPage(1);
  };

  const selectRankSortMode = (nextMode: RankSortMode) => {
    setRankSortMode(nextMode);
    setPage(1);
  };

  return (
    <CarLayout>
      <div className={cn('max-w-7xl mx-auto', isLandscapeMobile ? 'px-2 py-2 space-y-3' : 'px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-7')}>
        <header className="space-y-1">
          <h1 className={cn('font-black tracking-tighter', isLandscapeMobile ? 'text-2xl' : 'text-5xl')}>Velocity Store</h1>
          <p className={cn('text-muted-foreground', isLandscapeMobile ? 'text-xs' : 'text-lg')}>
            Trip cosmetics, scenes, bundles, ambient effects, widget skins, themes, and animated map icons
          </p>
        </header>

        <section className={cn('dashboard-card flex items-center justify-between gap-3', isLandscapeMobile ? 'p-3' : 'p-6')}>
          <div className="flex items-center gap-3">
            <Coins className={cn('text-primary', isLandscapeMobile ? 'w-4 h-4' : 'w-6 h-6')} />
            <div>
              <div className={cn('font-black tabular-nums', isLandscapeMobile ? 'text-sm' : 'text-2xl')}>
                {balance.toFixed(2)} {currencyName}
              </div>
              <div className={cn('text-muted-foreground', isLandscapeMobile ? 'text-[10px]' : 'text-sm')}>
                Earned while driving
              </div>
            </div>
          </div>
          <div className={cn('flex items-center gap-3', isLandscapeMobile ? 'flex-col items-end' : 'items-center')}>
            <RankSortSpinEdit value={rankSortMode} compact={isLandscapeMobile} onChange={selectRankSortMode} />
            <div className={cn('text-right text-muted-foreground', isLandscapeMobile ? 'text-[10px]' : 'text-sm')}>
              Page {page} / {totalPages}
            </div>
          </div>
        </section>

        <section className={cn('dashboard-card', isLandscapeMobile ? 'p-2.5 space-y-2.5' : 'p-4 space-y-4')}>
          <div className={cn('grid gap-2', isLandscapeMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4')}>
            {STORE_CATEGORIES.map((item) => {
              const Icon = item.icon;
              const selected = category === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => selectCategory(item.id)}
                  className={cn(
                    'rounded-2xl border px-4 py-3 text-left transition-all',
                    selected
                      ? 'border-primary/60 bg-primary/10 text-primary shadow-glow'
                      : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  )}
                >
                  <div className="inline-flex items-center gap-2 font-black">
                    <Icon className="w-4 h-4" />
                    {item.title}
                  </div>
                  <div className={cn('mt-1 text-muted-foreground', isLandscapeMobile ? 'text-[10px]' : 'text-xs')}>
                    {item.description}
                  </div>
                </button>
              );
            })}
          </div>

          {category === 'trip-cosmetics' && (
            <section className={cn('grid', isLandscapeMobile ? 'grid-cols-2 gap-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4')}>
              {tripCosmetics.map((item) => {
                const unlocked = unlockedTripCosmeticIds.includes(item.id);
                const isActive = activeTripCosmeticId === item.id;

                return (
                  <StoreItemCard key={item.id} cost={item.cost} highlighted={isActive}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className={cn('font-black', isLandscapeMobile ? 'text-xs' : 'text-lg')}>{item.name}</div>
                        <div className={cn('text-muted-foreground', isLandscapeMobile ? 'text-[10px]' : 'text-xs')}>{item.id}</div>
                      </div>
                      <Award className={cn('text-primary shrink-0', isLandscapeMobile ? 'w-4 h-4' : 'w-5 h-5')} />
                    </div>

                    <div className={cn('mt-3', isLandscapeMobile && 'mt-2')}>
                      <StoreRankBadge cost={item.cost} compact={isLandscapeMobile} />
                    </div>

                    <div className={cn('mt-3 overflow-hidden rounded-[1.75rem] border border-white/10 p-3', isLandscapeMobile ? 'mt-2 p-2.5' : '')} style={{ background: item.surface }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white/90" style={{ borderColor: item.accent, backgroundColor: item.glow }}>
                          {item.badgeLabel}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">{item.frameLabel}</span>
                      </div>

                      <div className="mt-3 rounded-2xl border border-white/10 px-3 py-3" style={{ background: item.plate, boxShadow: `0 0 24px ${item.glow}` }}>
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/55">{item.odometerLabel}</div>
                        <div className="mt-1 text-3xl font-black tabular-nums leading-none" style={{ color: item.accent }}>128.4</div>
                      </div>

                      <p className="mt-3 text-xs text-white/70">{item.description}</p>
                    </div>

                    <div className={cn('mt-3 flex items-center justify-between gap-3', isLandscapeMobile ? 'mt-2' : 'mt-4')}>
                      <span className={cn('font-bold tabular-nums', isLandscapeMobile ? 'text-[10px]' : 'text-sm')}>
                        {unlocked ? 'Unlocked' : `${item.cost} ${currencyName}`}
                      </span>
                      <StoreActionButton
                        active={isActive}
                        unlocked={unlocked}
                        activeLabel="Equipped"
                        unlockedLabel="Equip"
                        lockedLabel="Buy"
                        compact={isLandscapeMobile}
                        onClick={() => acquireOrApplyTripCosmetic(item)}
                      />
                    </div>
                  </StoreItemCard>
                );
              })}
            </section>
          )}

          {category === 'startup-scenes' && (
            <section className={cn('grid', isLandscapeMobile ? 'grid-cols-2 gap-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4')}>
              {scenePacks.map((scenePack) => {
                const unlocked = unlockedScenePackIds.includes(scenePack.id);
                const isActive = activeScenePackId === scenePack.id;

                return (
                  <StoreItemCard key={scenePack.id} cost={scenePack.cost} highlighted={isActive}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className={cn('font-black', isLandscapeMobile ? 'text-xs' : 'text-lg')}>{scenePack.name}</div>
                        <div className={cn('text-muted-foreground', isLandscapeMobile ? 'text-[10px]' : 'text-xs')}>{scenePack.id}</div>
                      </div>
                      <Power className={cn('text-primary shrink-0', isLandscapeMobile ? 'w-4 h-4' : 'w-5 h-5')} />
                    </div>

                    <div className={cn('mt-3', isLandscapeMobile && 'mt-2')}>
                      <StoreRankBadge cost={scenePack.cost} compact={isLandscapeMobile} />
                    </div>

                    <div className={cn('relative mt-3 overflow-hidden rounded-[1.75rem] border border-white/10', isLandscapeMobile ? 'mt-2 h-28' : 'h-36')}>
                      <DashboardBackdrop scene={scenePack} effect={null} weatherCode={61} compact showIdleLabel parked />
                      <div className="relative z-10 flex h-full flex-col justify-between p-3 text-left">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Boot</div>
                          <div className="mt-1 text-sm font-black text-white">{scenePack.bootTitle}</div>
                        </div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">{scenePack.chargingTitle}</div>
                      </div>
                    </div>

                    <p className={cn('mt-3 text-white/70', isLandscapeMobile ? 'text-[10px] leading-snug' : 'text-xs')}>
                      {scenePack.description}
                    </p>

                    <div className={cn('mt-3 flex items-center justify-between gap-3', isLandscapeMobile ? 'mt-2' : 'mt-4')}>
                      <span className={cn('font-bold tabular-nums', isLandscapeMobile ? 'text-[10px]' : 'text-sm')}>
                        {unlocked ? 'Unlocked' : `${scenePack.cost} ${currencyName}`}
                      </span>
                      <StoreActionButton
                        active={isActive}
                        unlocked={unlocked}
                        activeLabel="Active"
                        unlockedLabel="Apply"
                        lockedLabel="Buy"
                        compact={isLandscapeMobile}
                        onClick={() => acquireOrApplyScenePack(scenePack)}
                      />
                    </div>
                  </StoreItemCard>
                );
              })}
            </section>
          )}

          {category === 'limited-bundles' && (
            <section className={cn('grid', isLandscapeMobile ? 'grid-cols-1 gap-2' : 'grid-cols-1 md:grid-cols-2 gap-4')}>
              {limitedBundles.map((bundle) => {
                const unlocked = unlockedBundleIds.includes(bundle.id);

                return (
                  <StoreItemCard key={bundle.id} cost={bundle.cost} highlighted={unlocked}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className={cn('font-black', isLandscapeMobile ? 'text-xs' : 'text-lg')}>{bundle.name}</div>
                        <div className={cn('text-muted-foreground', isLandscapeMobile ? 'text-[10px]' : 'text-xs')}>{bundle.seasonLabel}</div>
                      </div>
                      <Package2 className={cn('text-primary shrink-0', isLandscapeMobile ? 'w-4 h-4' : 'w-5 h-5')} />
                    </div>

                    <div className={cn('mt-3', isLandscapeMobile && 'mt-2')}>
                      <StoreRankBadge cost={bundle.cost} compact={isLandscapeMobile} />
                    </div>

                    <div className="mt-3 rounded-[1.75rem] border border-white/10 p-4" style={{ background: `linear-gradient(145deg, ${bundle.accent}, rgba(15,23,42,0.92))` }}>
                      <p className={cn('text-white/80', isLandscapeMobile ? 'text-[10px] leading-snug' : 'text-sm')}>
                        {bundle.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {bundle.rewards.map((reward) => (
                          <span
                            key={`${bundle.id}-${reward.category}-${reward.itemId}`}
                            className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white/80"
                          >
                            {getBundleRewardCategoryLabel(reward.category)} · {getBundleRewardName(reward)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className={cn('mt-3 flex items-center justify-between gap-3', isLandscapeMobile ? 'mt-2' : 'mt-4')}>
                      <span className={cn('font-bold tabular-nums', isLandscapeMobile ? 'text-[10px]' : 'text-sm')}>
                        {unlocked ? 'Owned' : `${bundle.cost} ${currencyName}`}
                      </span>
                      <StoreActionButton
                        active={false}
                        unlocked={unlocked}
                        activeLabel="Owned"
                        unlockedLabel="Owned"
                        lockedLabel="Buy Bundle"
                        compact={isLandscapeMobile}
                        disabled={unlocked}
                        onClick={() => acquireBundle(bundle)}
                      />
                    </div>
                  </StoreItemCard>
                );
              })}
            </section>
          )}

          {category === 'ambient-effects' && (
            <section className={cn('grid', isLandscapeMobile ? 'grid-cols-2 gap-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4')}>
              {ambientEffects.map((effect) => {
                const unlocked = unlockedAmbientEffectIds.includes(effect.id);
                const isActive = activeAmbientEffectId === effect.id;

                return (
                  <StoreItemCard key={effect.id} cost={effect.cost} highlighted={isActive}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className={cn('font-black', isLandscapeMobile ? 'text-xs' : 'text-lg')}>{effect.name}</div>
                        <div className={cn('text-muted-foreground', isLandscapeMobile ? 'text-[10px]' : 'text-xs')}>{effect.label}</div>
                      </div>
                      <CloudSun className={cn('text-primary shrink-0', isLandscapeMobile ? 'w-4 h-4' : 'w-5 h-5')} />
                    </div>

                    <div className={cn('mt-3', isLandscapeMobile && 'mt-2')}>
                      <StoreRankBadge cost={effect.cost} compact={isLandscapeMobile} />
                    </div>

                    <div className={cn('relative mt-3 overflow-hidden rounded-[1.75rem] border border-white/10', isLandscapeMobile ? 'mt-2 h-28' : 'h-36')}>
                      <DashboardBackdrop scene={previewScene} effect={effect} weatherCode={previewScene?.weatherReactive ? 61 : 0} compact parked={false} />
                      <div className="relative z-10 flex h-full items-end p-3">
                        <div className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/80">
                          {effect.label}
                        </div>
                      </div>
                    </div>

                    <p className={cn('mt-3 text-white/70', isLandscapeMobile ? 'text-[10px] leading-snug' : 'text-xs')}>
                      {effect.description}
                    </p>

                    <div className={cn('mt-3 flex items-center justify-between gap-3', isLandscapeMobile ? 'mt-2' : 'mt-4')}>
                      <span className={cn('font-bold tabular-nums', isLandscapeMobile ? 'text-[10px]' : 'text-sm')}>
                        {unlocked ? 'Unlocked' : `${effect.cost} ${currencyName}`}
                      </span>
                      <StoreActionButton
                        active={isActive}
                        unlocked={unlocked}
                        activeLabel="Active"
                        unlockedLabel="Apply"
                        lockedLabel="Buy"
                        compact={isLandscapeMobile}
                        onClick={() => acquireOrApplyAmbientEffect(effect)}
                      />
                    </div>
                  </StoreItemCard>
                );
              })}
            </section>
          )}

          {category === 'widget-skins' && (
            <section className={cn('grid', isLandscapeMobile ? 'grid-cols-2 gap-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4')}>
              {widgetSkins.map((widgetSkin) => {
                const unlocked = unlockedWidgetSkinIds.includes(widgetSkin.id);
                const isActive = activeWidgetSkinId === widgetSkin.id;
                const tone = getWidgetPreviewTone(widgetSkin);

                return (
                  <StoreItemCard key={widgetSkin.id} cost={widgetSkin.cost} highlighted={isActive}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className={cn('font-black', isLandscapeMobile ? 'text-xs' : 'text-lg')}>{widgetSkin.name}</div>
                        <div className={cn('text-muted-foreground', isLandscapeMobile ? 'text-[10px]' : 'text-xs')}>{widgetSkin.label}</div>
                      </div>
                      <Gauge className={cn('text-primary shrink-0', isLandscapeMobile ? 'w-4 h-4' : 'w-5 h-5')} />
                    </div>

                    <div className={cn('mt-3', isLandscapeMobile && 'mt-2')}>
                      <StoreRankBadge cost={widgetSkin.cost} compact={isLandscapeMobile} />
                    </div>

                    <div className="mt-3 rounded-[1.75rem] border border-white/10 p-4" style={{ background: widgetSkin.panel }}>
                      <div className={cn('rounded-[1.5rem] border p-3', tone.frame)}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className={cn('text-[10px] font-black', tone.label)}>Speed</div>
                            <div className={cn('mt-1 text-4xl font-black leading-none', tone.value)}>124</div>
                          </div>
                          <div className={cn('mt-1 text-[10px] font-black', tone.label)}>21:08</div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <div className="rounded-2xl border border-white/10 bg-black/20 px-2 py-2">
                            <div className={cn('text-[9px] font-black', tone.label)}>Battery</div>
                            <div className={cn('mt-1 text-sm font-black', tone.value)}>76%</div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/20 px-2 py-2">
                            <div className={cn('text-[9px] font-black', tone.label)}>Weather</div>
                            <div className={cn('mt-1 text-sm font-black', tone.value)}>72°</div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/20 px-2 py-2">
                            <div className={cn('text-[9px] font-black', tone.label)}>Trip</div>
                            <div className={cn('mt-1 text-sm font-black', tone.value)}>18.4</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className={cn('mt-3 text-white/70', isLandscapeMobile ? 'text-[10px] leading-snug' : 'text-xs')}>
                      {widgetSkin.description}
                    </p>

                    <div className={cn('mt-3 flex items-center justify-between gap-3', isLandscapeMobile ? 'mt-2' : 'mt-4')}>
                      <span className={cn('font-bold tabular-nums', isLandscapeMobile ? 'text-[10px]' : 'text-sm')}>
                        {unlocked ? 'Unlocked' : `${widgetSkin.cost} ${currencyName}`}
                      </span>
                      <StoreActionButton
                        active={isActive}
                        unlocked={unlocked}
                        activeLabel="Equipped"
                        unlockedLabel="Equip"
                        lockedLabel="Buy"
                        compact={isLandscapeMobile}
                        onClick={() => acquireOrApplyWidgetSkin(widgetSkin)}
                      />
                    </div>
                  </StoreItemCard>
                );
              })}
            </section>
          )}

          {category === 'themes' && (
            <section className={cn('grid', isLandscapeMobile ? 'grid-cols-2 gap-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4')}>
              {themes.map((theme) => {
                const unlocked = unlockedThemeIds.includes(theme.id);
                const isActive = activeThemeId === theme.id;

                return (
                  <StoreItemCard key={theme.id} cost={theme.cost} highlighted={isActive}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={cn('font-black', isLandscapeMobile ? 'text-xs' : 'text-lg')}>{theme.name}</div>
                        <div className={cn('text-muted-foreground', isLandscapeMobile ? 'text-[10px]' : 'text-xs')}>{theme.id}</div>
                      </div>
                      <Paintbrush2 className={cn('text-primary', isLandscapeMobile ? 'w-4 h-4' : 'w-5 h-5')} />
                    </div>

                    <div className={cn('mt-3', isLandscapeMobile && 'mt-2')}>
                      <StoreRankBadge cost={theme.cost} compact={isLandscapeMobile} />
                    </div>

                    <ThemePreviewCard theme={theme} compact={isLandscapeMobile} />

                    <div className={cn('mt-3 grid grid-cols-6 gap-2', isLandscapeMobile && 'mt-2 gap-1')}>
                      <div className="h-6 rounded-md border border-white/20" style={{ backgroundColor: `hsl(${theme.primary})` }} />
                      <div className="h-6 rounded-md border border-white/20" style={{ backgroundColor: `hsl(${theme.ring})` }} />
                      <div className="h-6 rounded-md border border-white/20" style={{ backgroundColor: `hsl(${theme.secondary})` }} />
                      <div className="h-6 rounded-md border border-white/20" style={{ backgroundColor: `hsl(${theme.accent})` }} />
                      <div className="h-6 rounded-md border border-white/20" style={{ backgroundColor: `hsl(${theme.background})` }} />
                      <div className="h-6 rounded-md border border-white/20" style={{ backgroundColor: `hsl(${theme.card})` }} />
                    </div>

                    <div className={cn('mt-3 flex items-center justify-between', isLandscapeMobile ? 'mt-2' : 'mt-4')}>
                      <span className={cn('font-bold tabular-nums', isLandscapeMobile ? 'text-[10px]' : 'text-sm')}>
                        {unlocked ? 'Unlocked' : `${theme.cost} ${currencyName}`}
                      </span>
                      <StoreActionButton
                        active={isActive}
                        unlocked={unlocked}
                        activeLabel="Active"
                        unlockedLabel="Apply"
                        lockedLabel="Buy"
                        compact={isLandscapeMobile}
                        onClick={() => acquireOrApplyTheme(theme)}
                      />
                    </div>
                  </StoreItemCard>
                );
              })}
            </section>
          )}

          {category === 'map-icons' && (
            <section className={cn('grid', isLandscapeMobile ? 'grid-cols-2 gap-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4')}>
              {mapIcons.map((icon) => {
                const unlocked = unlockedMapIconIds.includes(icon.id);
                const isActive = activeMapIconId === icon.id;

                return (
                  <StoreItemCard key={icon.id} cost={icon.cost} highlighted={isActive}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className={cn('font-black', isLandscapeMobile ? 'text-xs' : 'text-lg')}>{icon.name}</div>
                        <div className={cn('text-muted-foreground', isLandscapeMobile ? 'text-[10px]' : 'text-xs')}>{icon.id}</div>
                      </div>
                      <CarFront className={cn('text-primary shrink-0', isLandscapeMobile ? 'w-4 h-4' : 'w-5 h-5')} />
                    </div>

                    <div className={cn('mt-3', isLandscapeMobile && 'mt-2')}>
                      <StoreRankBadge cost={icon.cost} compact={isLandscapeMobile} />
                    </div>

                    <div
                      className={cn(
                        'mt-3 rounded-[1.75rem] border border-white/10 overflow-hidden relative',
                        isLandscapeMobile ? 'h-28' : 'h-36'
                      )}
                      style={{
                        background: `radial-gradient(circle at 50% 18%, ${icon.glowColor} 0%, rgba(0,0,0,0) 68%), linear-gradient(180deg, rgba(255,255,255,0.06), rgba(9,17,31,0.88))`,
                      }}
                    >
                      <div className="absolute inset-x-8 bottom-4 h-5 rounded-full bg-black/35 blur-xl" />
                      <div className="relative h-full flex items-center justify-center">
                        <MapCarIcon iconId={icon.id} size={isLandscapeMobile ? 78 : 104} animated />
                      </div>
                    </div>

                    <div className={cn('mt-3 flex flex-wrap gap-2', isLandscapeMobile ? 'mt-2 gap-1.5' : '')}>
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-primary">
                        {icon.familyLabel}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                        {icon.bodyLabel}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                        {icon.animationLabel}
                      </span>
                    </div>

                    <div className={cn('mt-3 flex items-center justify-between gap-3', isLandscapeMobile ? 'mt-2' : 'mt-4')}>
                      <span className={cn('font-bold tabular-nums', isLandscapeMobile ? 'text-[10px]' : 'text-sm')}>
                        {unlocked ? 'Unlocked' : `${icon.cost} ${currencyName}`}
                      </span>
                      <StoreActionButton
                        active={isActive}
                        unlocked={unlocked}
                        activeLabel="Active"
                        unlockedLabel="Equip"
                        lockedLabel="Buy"
                        compact={isLandscapeMobile}
                        onClick={() => acquireOrApplyMapIcon(icon)}
                      />
                    </div>
                  </StoreItemCard>
                );
              })}
            </section>
          )}
        </section>

        <section className="flex items-center justify-between">
          <button
            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
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
