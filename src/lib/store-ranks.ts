export type StoreRankId = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface StoreRankDefinition {
  id: StoreRankId;
  label: string;
  color: string;
  borderColor: string;
  backgroundColor: string;
  glowColor: string;
  order: number;
}

export const STORE_COMMON_PRICE = 5;

export const STORE_RANKS: readonly StoreRankDefinition[] = [
  {
    id: 'common',
    label: 'Common',
    color: '#f5f7fb',
    borderColor: 'rgba(255,255,255,0.26)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    glowColor: 'rgba(255,255,255,0.14)',
    order: 0,
  },
  {
    id: 'uncommon',
    label: 'Uncommon',
    color: '#4ade80',
    borderColor: 'rgba(74,222,128,0.34)',
    backgroundColor: 'rgba(34,197,94,0.14)',
    glowColor: 'rgba(74,222,128,0.16)',
    order: 1,
  },
  {
    id: 'rare',
    label: 'Rare',
    color: '#60a5fa',
    borderColor: 'rgba(96,165,250,0.34)',
    backgroundColor: 'rgba(59,130,246,0.14)',
    glowColor: 'rgba(96,165,250,0.18)',
    order: 2,
  },
  {
    id: 'epic',
    label: 'Epic',
    color: '#c084fc',
    borderColor: 'rgba(192,132,252,0.34)',
    backgroundColor: 'rgba(147,51,234,0.16)',
    glowColor: 'rgba(192,132,252,0.2)',
    order: 3,
  },
  {
    id: 'legendary',
    label: 'Legendary',
    color: '#fbbf24',
    borderColor: 'rgba(251,191,36,0.36)',
    backgroundColor: 'rgba(217,119,6,0.18)',
    glowColor: 'rgba(251,191,36,0.22)',
    order: 4,
  },
  {
    id: 'mythic',
    label: 'Mythic',
    color: '#f87171',
    borderColor: 'rgba(248,113,113,0.38)',
    backgroundColor: 'rgba(220,38,38,0.18)',
    glowColor: 'rgba(248,113,113,0.24)',
    order: 5,
  },
] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getStoreRankById(rankId: StoreRankId): StoreRankDefinition {
  return STORE_RANKS.find((rank) => rank.id === rankId) ?? STORE_RANKS[0];
}

export function getStoreRankBySeed(seed: number): StoreRankDefinition {
  const normalizedSeed = Math.abs(Math.trunc(seed));
  return STORE_RANKS[normalizedSeed % STORE_RANKS.length];
}

export function getStoreRankCost(rankId: StoreRankId, basePrice = STORE_COMMON_PRICE): number {
  const rank = getStoreRankById(rankId);
  return basePrice * 2 ** rank.order;
}

export function getStoreRankedPrice(seed: number, basePrice = STORE_COMMON_PRICE): { rank: StoreRankDefinition; cost: number } {
  const rank = getStoreRankBySeed(seed);
  return {
    rank,
    cost: getStoreRankCost(rank.id, basePrice),
  };
}

export function getStoreRankByCost(cost: number, basePrice = STORE_COMMON_PRICE): StoreRankDefinition {
  if (cost <= 0) {
    return STORE_RANKS[0];
  }

  const normalizedOrder = Math.log2(cost / basePrice);
  const order = clamp(Math.round(Number.isFinite(normalizedOrder) ? normalizedOrder : 0), 0, STORE_RANKS.length - 1);
  return STORE_RANKS[order];
}