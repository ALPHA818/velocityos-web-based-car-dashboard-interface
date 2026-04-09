import { getStoreRankedPrice } from '@/lib/store-ranks';

const MYTHIC_THEME_PREFIXES = ['Apex', 'Halo', 'Monarch', 'Solar', 'Vector', 'Obsidian', 'Cascade', 'Signal'] as const;
const MYTHIC_THEME_SUFFIXES = ['Noir', 'Prism', 'Surge', 'Crest', 'Bloom', 'Afterburn', 'Flux', 'Crown'] as const;

export interface MarketTheme {
  id: string;
  name: string;
  cost: number;
  primary: string;
  ring: string;
  secondary: string;
  accent: string;
  background: string;
  card: string;
}

export const THEME_COUNT = 1000;

function toThemeId(index: number): string {
  return `theme-${String(index + 1).padStart(4, '0')}`;
}

function fromThemeId(themeId: string): number | null {
  const match = /^theme-(\d{4})$/.exec(themeId);
  if (!match) return null;
  const value = Number(match[1]) - 1;
  if (value < 0 || value >= THEME_COUNT) return null;
  return value;
}

export function getThemeByIndex(index: number): MarketTheme {
  const i = Math.max(0, Math.min(THEME_COUNT - 1, index));
  const { rank, cost } = getStoreRankedPrice(i * 5 + 1);
  const isMythic = rank.id === 'mythic';
  const hue = isMythic ? (i * 61 + 17) % 360 : (i * 47) % 360;
  const sat = isMythic ? 74 + (i % 18) : 58 + (i % 32);
  const light = isMythic ? 50 + ((i * 9) % 12) : 44 + ((i * 7) % 22);

  const primary = `${hue} ${sat}% ${light}%`;
  const ring = `${(hue + (isMythic ? 14 : 0)) % 360} ${Math.min(98, sat + (isMythic ? 8 : 4))}% ${Math.min(78, light + (isMythic ? 10 : 4))}%`;
  const secondary = `${(hue + (isMythic ? 138 : 28)) % 360} ${Math.max(isMythic ? 46 : 24, sat - (isMythic ? 20 : 28))}% ${Math.max(isMythic ? 18 : 15, light - (isMythic ? 28 : 24))}%`;
  const accent = `${(hue + (isMythic ? 192 : 76)) % 360} ${Math.max(isMythic ? 60 : 30, sat - (isMythic ? 10 : 12))}% ${Math.max(isMythic ? 44 : 20, light + (isMythic ? 4 : -8))}%`;
  const background = `${(hue + 8) % 360} ${isMythic ? 30 : 24}% 5%`;
  const card = `${(hue + (isMythic ? 22 : 18)) % 360} ${isMythic ? 26 : 20}% ${isMythic ? 12 : 11}%`;
  const mythicName = `${MYTHIC_THEME_PREFIXES[i % MYTHIC_THEME_PREFIXES.length]} ${MYTHIC_THEME_SUFFIXES[Math.floor(i / MYTHIC_THEME_PREFIXES.length) % MYTHIC_THEME_SUFFIXES.length]} ${String(i + 1).padStart(4, '0')}`;

  return {
    id: toThemeId(i),
    name: isMythic ? mythicName : `Drive Theme ${String(i + 1).padStart(4, '0')}`,
    cost,
    primary,
    ring,
    secondary,
    accent,
    background,
    card,
  };
}

export function getThemeById(themeId: string | null | undefined): MarketTheme | null {
  if (!themeId) return null;
  const index = fromThemeId(themeId);
  if (index === null) return null;
  return getThemeByIndex(index);
}

export function getThemePage(page: number, pageSize: number): MarketTheme[] {
  const safePage = Math.max(1, page);
  const safeSize = Math.max(1, pageSize);
  const start = (safePage - 1) * safeSize;
  if (start >= THEME_COUNT) return [];
  const end = Math.min(THEME_COUNT, start + safeSize);
  const list: MarketTheme[] = [];
  for (let i = start; i < end; i += 1) {
    list.push(getThemeByIndex(i));
  }
  return list;
}

export function applyMarketTheme(theme: MarketTheme | null) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (!theme) {
    root.style.removeProperty('--primary');
    root.style.removeProperty('--ring');
    root.style.removeProperty('--secondary');
    root.style.removeProperty('--accent');
    root.style.removeProperty('--background');
    root.style.removeProperty('--card');
    return;
  }

  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--ring', theme.ring);
  root.style.setProperty('--secondary', theme.secondary);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--background', theme.background);
  root.style.setProperty('--card', theme.card);
}
