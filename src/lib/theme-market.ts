export interface MarketTheme {
  id: string;
  name: string;
  cost: number;
  primary: string;
  ring: string;
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
  const hue = (i * 47) % 360;
  const sat = 58 + (i % 32);
  const light = 44 + ((i * 7) % 22);

  const primary = `${hue} ${sat}% ${light}%`;
  const ring = `${hue} ${Math.min(95, sat + 4)}% ${Math.min(70, light + 4)}%`;
  const background = `${(hue + 8) % 360} 24% 5%`;
  const card = `${(hue + 18) % 360} 20% 11%`;

  return {
    id: toThemeId(i),
    name: `Drive Theme ${String(i + 1).padStart(4, '0')}`,
    cost: 12 + (i % 45),
    primary,
    ring,
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
    root.style.removeProperty('--background');
    root.style.removeProperty('--card');
    return;
  }

  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--ring', theme.ring);
  root.style.setProperty('--background', theme.background);
  root.style.setProperty('--card', theme.card);
}
