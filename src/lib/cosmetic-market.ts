import { getStoreRankedPrice } from '@/lib/store-ranks';

export interface TripCosmeticDefinition {
  id: string;
  name: string;
  cost: number;
  badgeLabel: string;
  odometerLabel: string;
  frameLabel: string;
  description: string;
  accent: string;
  glow: string;
  surface: string;
  plate: string;
}

export type ScenePattern = 'grid' | 'horizon' | 'contour' | 'storm' | 'scan' | 'amber';

export interface ScenePackDefinition {
  id: string;
  name: string;
  cost: number;
  bootTitle: string;
  idleTitle: string;
  chargingTitle: string;
  description: string;
  accent: string;
  glow: string;
  background: string;
  overlay: string;
  pattern: ScenePattern;
  weatherReactive: boolean;
}

export type AmbientEffectKind =
  | 'none'
  | 'neon-tunnel'
  | 'sunrise-haze'
  | 'rain-runner'
  | 'snowfall'
  | 'desert-heat'
  | 'city-night';

export interface AmbientEffectDefinition {
  id: string;
  name: string;
  cost: number;
  kind: AmbientEffectKind;
  label: string;
  description: string;
  accent: string;
  secondary: string;
}

export type WidgetSkinStyle = 'core' | 'retro' | 'motorsport' | 'luxury' | 'cyber' | 'expedition';

export interface WidgetSkinDefinition {
  id: string;
  name: string;
  cost: number;
  style: WidgetSkinStyle;
  label: string;
  description: string;
  accent: string;
  panel: string;
}

export type BundleRewardCategory =
  | 'trip-cosmetics'
  | 'startup-scenes'
  | 'ambient-effects'
  | 'widget-skins'
  | 'themes'
  | 'map-icons';

export interface BundleRewardDescriptor {
  category: BundleRewardCategory;
  itemId: string;
}

export interface LimitedBundleDefinition {
  id: string;
  name: string;
  cost: number;
  seasonLabel: string;
  description: string;
  accent: string;
  rewards: BundleRewardDescriptor[];
}

function applyRankPricing<T extends { cost: number }>(items: readonly T[], seedOffset: number): T[] {
  return items.map((item, index) => ({
    ...item,
    cost: getStoreRankedPrice(seedOffset + index).cost,
  }));
}

const TRIP_COSMETIC_SEEDS: readonly TripCosmeticDefinition[] = [
  {
    id: 'trip-core-navigator',
    name: 'Navigator Plate',
    cost: 0,
    badgeLabel: 'Navigator',
    odometerLabel: 'Signal odometer plate',
    frameLabel: 'Signal frame',
    description: 'Clean trip plates with a cool-blue mileage frame and a lightweight driver badge.',
    accent: 'hsl(204 94% 62%)',
    glow: 'rgba(56, 189, 248, 0.32)',
    surface: 'linear-gradient(145deg, rgba(14,116,144,0.26), rgba(15,23,42,0.88))',
    plate: 'linear-gradient(180deg, rgba(12,74,110,0.72), rgba(15,23,42,0.95))',
  },
  {
    id: 'trip-apex-driver',
    name: 'Apex Driver',
    cost: 24,
    badgeLabel: 'Apex Driver',
    odometerLabel: 'Carbon sprint plate',
    frameLabel: 'Sprint frame',
    description: 'Carbon textures, hot orange accents, and a bolder finish for quick-attack runs.',
    accent: 'hsl(24 95% 58%)',
    glow: 'rgba(249, 115, 22, 0.34)',
    surface: 'linear-gradient(145deg, rgba(120,53,15,0.34), rgba(17,24,39,0.92))',
    plate: 'linear-gradient(180deg, rgba(82,38,9,0.78), rgba(15,23,42,0.96))',
  },
  {
    id: 'trip-night-runner',
    name: 'Night Runner',
    cost: 32,
    badgeLabel: 'Night Runner',
    odometerLabel: 'Midnight chrome plate',
    frameLabel: 'After-hours frame',
    description: 'Deep cobalt plating with neon outlines tuned for late-night city loops.',
    accent: 'hsl(221 83% 63%)',
    glow: 'rgba(99, 102, 241, 0.34)',
    surface: 'linear-gradient(145deg, rgba(30,41,59,0.98), rgba(15,23,42,0.84))',
    plate: 'linear-gradient(180deg, rgba(30,41,59,0.92), rgba(9,17,31,0.98))',
  },
  {
    id: 'trip-rally-ledger',
    name: 'Rally Ledger',
    cost: 38,
    badgeLabel: 'Rally Crew',
    odometerLabel: 'Dust-run plate',
    frameLabel: 'Checkpoint frame',
    description: 'Stage-inspired cards with rally yellow highlights and rugged trip framing.',
    accent: 'hsl(50 96% 58%)',
    glow: 'rgba(250, 204, 21, 0.3)',
    surface: 'linear-gradient(145deg, rgba(113,63,18,0.34), rgba(17,24,39,0.94))',
    plate: 'linear-gradient(180deg, rgba(120,53,15,0.68), rgba(17,24,39,0.98))',
  },
  {
    id: 'trip-luxe-odometer',
    name: 'Luxe Odometer',
    cost: 44,
    badgeLabel: 'Grand Tour',
    odometerLabel: 'Brushed metal plate',
    frameLabel: 'Executive frame',
    description: 'Soft metallic panels, long-run prestige framing, and restrained gold cues.',
    accent: 'hsl(42 74% 67%)',
    glow: 'rgba(250, 204, 21, 0.24)',
    surface: 'linear-gradient(145deg, rgba(64,64,72,0.82), rgba(15,23,42,0.92))',
    plate: 'linear-gradient(180deg, rgba(82,82,91,0.82), rgba(24,24,27,0.96))',
  },
  {
    id: 'trip-founders-grid',
    name: 'Founders Grid',
    cost: 48,
    badgeLabel: 'Founders Grid',
    odometerLabel: 'Retro serial plate',
    frameLabel: 'Launch frame',
    description: 'Warm amber numerals and gridline framing for a retro instrument-panel look.',
    accent: 'hsl(37 94% 61%)',
    glow: 'rgba(251, 146, 60, 0.32)',
    surface: 'linear-gradient(145deg, rgba(120,53,15,0.24), rgba(15,23,42,0.96))',
    plate: 'linear-gradient(180deg, rgba(120,53,15,0.7), rgba(17,24,39,0.97))',
  },
  {
    id: 'trip-canyon-scout',
    name: 'Canyon Scout',
    cost: 40,
    badgeLabel: 'Trail Scout',
    odometerLabel: 'Terrain plate',
    frameLabel: 'Overland frame',
    description: 'Earth-tone odometer plates and expedition-ready frames for route logs and off-road runs.',
    accent: 'hsl(142 50% 58%)',
    glow: 'rgba(74, 222, 128, 0.26)',
    surface: 'linear-gradient(145deg, rgba(22,101,52,0.26), rgba(23,23,23,0.94))',
    plate: 'linear-gradient(180deg, rgba(21,128,61,0.45), rgba(17,24,39,0.98))',
  },
];

const SCENE_PACK_SEEDS: readonly ScenePackDefinition[] = [
  {
    id: 'scene-garage-grid',
    name: 'Garage Grid',
    cost: 0,
    bootTitle: 'Ignition grid online',
    idleTitle: 'Parked in the bay',
    chargingTitle: 'Charge rails engaged',
    description: 'A cool garage startup sequence with scanlines, parking prompts, and soft grid lighting.',
    accent: 'rgba(56, 189, 248, 0.42)',
    glow: 'rgba(59, 130, 246, 0.28)',
    background: 'radial-gradient(circle at 18% 18%, rgba(56,189,248,0.18), transparent 42%), linear-gradient(145deg, rgba(2,6,23,0.98), rgba(15,23,42,0.94))',
    overlay: 'linear-gradient(180deg, rgba(59,130,246,0.08), rgba(2,6,23,0.12))',
    pattern: 'grid',
    weatherReactive: true,
  },
  {
    id: 'scene-midnight-drive',
    name: 'Midnight Drive',
    cost: 30,
    bootTitle: 'After-hours route loaded',
    idleTitle: 'Curbside standby',
    chargingTitle: 'Night charge pulse',
    description: 'Deep nocturnal gradients with a cinematic boot fade and parked-mode street glow.',
    accent: 'rgba(99, 102, 241, 0.38)',
    glow: 'rgba(59, 130, 246, 0.24)',
    background: 'radial-gradient(circle at 82% 18%, rgba(96,165,250,0.14), transparent 36%), linear-gradient(160deg, rgba(2,6,23,1), rgba(15,23,42,0.95), rgba(17,24,39,0.98))',
    overlay: 'linear-gradient(180deg, rgba(15,23,42,0.12), rgba(30,41,59,0.2))',
    pattern: 'horizon',
    weatherReactive: true,
  },
  {
    id: 'scene-aurora-dock',
    name: 'Aurora Dock',
    cost: 34,
    bootTitle: 'Aurora systems aligned',
    idleTitle: 'Docked and waiting',
    chargingTitle: 'Aurora current flowing',
    description: 'Soft teal and green ribbons with a quiet idle atmosphere and charging accents.',
    accent: 'rgba(45, 212, 191, 0.42)',
    glow: 'rgba(16, 185, 129, 0.28)',
    background: 'radial-gradient(circle at 22% 18%, rgba(45,212,191,0.18), transparent 40%), linear-gradient(145deg, rgba(3,22,31,1), rgba(15,23,42,0.92), rgba(6,78,59,0.36))',
    overlay: 'linear-gradient(180deg, rgba(45,212,191,0.08), rgba(6,78,59,0.16))',
    pattern: 'contour',
    weatherReactive: true,
  },
  {
    id: 'scene-desert-dawn',
    name: 'Desert Dawn',
    cost: 36,
    bootTitle: 'Sunline startup engaged',
    idleTitle: 'Resting at sunrise',
    chargingTitle: 'Solar charge lattice',
    description: 'Sand-glow startup visuals with warm idle gradients and sunrise-reactive lighting.',
    accent: 'rgba(251, 146, 60, 0.4)',
    glow: 'rgba(245, 158, 11, 0.28)',
    background: 'radial-gradient(circle at 18% 28%, rgba(251,146,60,0.18), transparent 38%), linear-gradient(145deg, rgba(67,20,7,0.9), rgba(24,24,27,0.96), rgba(120,53,15,0.36))',
    overlay: 'linear-gradient(180deg, rgba(251,146,60,0.1), rgba(120,53,15,0.18))',
    pattern: 'amber',
    weatherReactive: false,
  },
  {
    id: 'scene-storm-harbor',
    name: 'Storm Harbor',
    cost: 40,
    bootTitle: 'Storm route armed',
    idleTitle: 'Sheltered in harbor mode',
    chargingTitle: 'Current surge charging',
    description: 'Steel-blue storm lighting with reactive rain tones and a stronger charging pulse.',
    accent: 'rgba(125, 211, 252, 0.42)',
    glow: 'rgba(14, 165, 233, 0.26)',
    background: 'radial-gradient(circle at 80% 12%, rgba(125,211,252,0.16), transparent 36%), linear-gradient(155deg, rgba(2,6,23,1), rgba(30,41,59,0.94), rgba(8,47,73,0.7))',
    overlay: 'linear-gradient(180deg, rgba(56,189,248,0.08), rgba(15,23,42,0.22))',
    pattern: 'storm',
    weatherReactive: true,
  },
  {
    id: 'scene-amber-circuit',
    name: 'Amber Circuit',
    cost: 32,
    bootTitle: 'Circuit wake sequence',
    idleTitle: 'Retro standby active',
    chargingTitle: 'Amber charge lane',
    description: 'Warm amber startup flashes and subtle analog-style idle lighting for retro builds.',
    accent: 'rgba(251, 146, 60, 0.4)',
    glow: 'rgba(245, 158, 11, 0.24)',
    background: 'radial-gradient(circle at 52% 16%, rgba(251,146,60,0.14), transparent 34%), linear-gradient(145deg, rgba(41,21,4,0.94), rgba(17,24,39,0.98))',
    overlay: 'linear-gradient(180deg, rgba(251,146,60,0.08), rgba(120,53,15,0.2))',
    pattern: 'scan',
    weatherReactive: false,
  },
];

const AMBIENT_EFFECT_SEEDS: readonly AmbientEffectDefinition[] = [
  {
    id: 'effect-clear-air',
    name: 'Clear Air',
    cost: 0,
    kind: 'none',
    label: 'No extra atmosphere',
    description: 'Keep the scene clean with only the selected startup and idle visuals.',
    accent: 'rgba(125, 211, 252, 0.22)',
    secondary: 'rgba(15, 23, 42, 0.18)',
  },
  {
    id: 'effect-neon-tunnel',
    name: 'Neon Tunnel',
    cost: 18,
    kind: 'neon-tunnel',
    label: 'Tunnel rings',
    description: 'Animated light rings that add forward motion behind the dashboard without obstructing content.',
    accent: 'rgba(56, 189, 248, 0.34)',
    secondary: 'rgba(99, 102, 241, 0.26)',
  },
  {
    id: 'effect-sunrise-haze',
    name: 'Sunrise Haze',
    cost: 20,
    kind: 'sunrise-haze',
    label: 'Warm atmospheric bloom',
    description: 'Soft dawn haze and drifting warmth to color parked mode and relaxed morning drives.',
    accent: 'rgba(251, 146, 60, 0.34)',
    secondary: 'rgba(253, 224, 71, 0.2)',
  },
  {
    id: 'effect-rain-runner',
    name: 'Rain Runner',
    cost: 22,
    kind: 'rain-runner',
    label: 'Diagonal rain light',
    description: 'Fast rain streaks that read as motion and weather without covering the widgets.',
    accent: 'rgba(125, 211, 252, 0.34)',
    secondary: 'rgba(59, 130, 246, 0.22)',
  },
  {
    id: 'effect-snowfall',
    name: 'Snowfall',
    cost: 24,
    kind: 'snowfall',
    label: 'Drifting flakes',
    description: 'Low-density snowfall particles suited to idle scenes and cold-weather routes.',
    accent: 'rgba(226, 232, 240, 0.4)',
    secondary: 'rgba(148, 163, 184, 0.18)',
  },
  {
    id: 'effect-desert-heat',
    name: 'Desert Heat',
    cost: 26,
    kind: 'desert-heat',
    label: 'Heat shimmer',
    description: 'Subtle refracted bands that make warm scenes feel like a sunbaked highway.',
    accent: 'rgba(251, 146, 60, 0.28)',
    secondary: 'rgba(245, 158, 11, 0.16)',
  },
  {
    id: 'effect-city-night',
    name: 'City Night Passes',
    cost: 28,
    kind: 'city-night',
    label: 'Passing light trails',
    description: 'Low, fast-moving light sweeps that mimic traffic reflections at night.',
    accent: 'rgba(96, 165, 250, 0.28)',
    secondary: 'rgba(244, 114, 182, 0.18)',
  },
];

const WIDGET_SKIN_SEEDS: readonly WidgetSkinDefinition[] = [
  {
    id: 'widget-core-digital',
    name: 'Core Digital',
    cost: 0,
    style: 'core',
    label: 'Balanced digital cluster',
    description: 'The default VelocityOS skin with bright digital gauges and compact utility widgets.',
    accent: 'hsl(204 94% 62%)',
    panel: 'linear-gradient(145deg, rgba(15,23,42,0.92), rgba(17,24,39,0.82))',
  },
  {
    id: 'widget-retro-digital',
    name: 'Retro Digital',
    cost: 28,
    style: 'retro',
    label: 'Amber instrument stack',
    description: 'Retro numerals, amber readouts, and panel scanlines for a vintage digital dash.',
    accent: 'hsl(37 94% 61%)',
    panel: 'linear-gradient(145deg, rgba(41,21,4,0.9), rgba(17,24,39,0.94))',
  },
  {
    id: 'widget-motorsport',
    name: 'Motorsport',
    cost: 34,
    style: 'motorsport',
    label: 'Track telemetry',
    description: 'Sharper edges, louder accents, and race-inspired telemetry framing for gauges and stats.',
    accent: 'hsl(0 84% 63%)',
    panel: 'linear-gradient(145deg, rgba(69,10,10,0.54), rgba(15,23,42,0.94))',
  },
  {
    id: 'widget-luxury',
    name: 'Luxury',
    cost: 40,
    style: 'luxury',
    label: 'Grand touring finish',
    description: 'Warm metallic details, softer gradients, and premium panel framing across widgets.',
    accent: 'hsl(42 74% 67%)',
    panel: 'linear-gradient(145deg, rgba(63,63,70,0.76), rgba(17,24,39,0.94))',
  },
  {
    id: 'widget-cyber-hud',
    name: 'Cyber HUD',
    cost: 44,
    style: 'cyber',
    label: 'Projected interface',
    description: 'Projected numerals, high-contrast outlines, and holographic chips for a futuristic dash.',
    accent: 'hsl(169 90% 48%)',
    panel: 'linear-gradient(145deg, rgba(6,78,59,0.32), rgba(2,6,23,0.98))',
  },
  {
    id: 'widget-expedition',
    name: 'Expedition',
    cost: 36,
    style: 'expedition',
    label: 'Terrain utility stack',
    description: 'Rugged gauges and weather/trip widgets tuned for overland and route-tracking setups.',
    accent: 'hsl(142 50% 58%)',
    panel: 'linear-gradient(145deg, rgba(22,101,52,0.3), rgba(23,23,23,0.96))',
  },
];

const LIMITED_BUNDLE_SEEDS: readonly LimitedBundleDefinition[] = [
  {
    id: 'bundle-rally-pack',
    name: 'Rally Pack',
    cost: 82,
    seasonLabel: 'Season Drop 01',
    description: 'A stage-inspired drop with rally trip framing, weather-heavy scenes, and track telemetry.',
    accent: 'rgba(250, 204, 21, 0.34)',
    rewards: [
      { category: 'trip-cosmetics', itemId: 'trip-rally-ledger' },
      { category: 'startup-scenes', itemId: 'scene-storm-harbor' },
      { category: 'ambient-effects', itemId: 'effect-rain-runner' },
      { category: 'widget-skins', itemId: 'widget-motorsport' },
      { category: 'themes', itemId: 'theme-0042' },
      { category: 'map-icons', itemId: 'car-icon-0048' },
    ],
  },
  {
    id: 'bundle-retro-analog-pack',
    name: 'Retro Analog Pack',
    cost: 88,
    seasonLabel: 'Archive Series',
    description: 'Warm amber tones, retro trip plates, and classic dashboard styling with a catalog theme bonus.',
    accent: 'rgba(251, 146, 60, 0.34)',
    rewards: [
      { category: 'trip-cosmetics', itemId: 'trip-founders-grid' },
      { category: 'startup-scenes', itemId: 'scene-amber-circuit' },
      { category: 'ambient-effects', itemId: 'effect-sunrise-haze' },
      { category: 'widget-skins', itemId: 'widget-retro-digital' },
      { category: 'themes', itemId: 'theme-0018' },
      { category: 'map-icons', itemId: 'car-icon-0012' },
    ],
  },
  {
    id: 'bundle-midnight-drive-pack',
    name: 'Midnight Drive Pack',
    cost: 96,
    seasonLabel: 'Night Mode Series',
    description: 'After-hours scene work, premium widgets, and night-run trip cosmetics built around city driving.',
    accent: 'rgba(96, 165, 250, 0.34)',
    rewards: [
      { category: 'trip-cosmetics', itemId: 'trip-night-runner' },
      { category: 'startup-scenes', itemId: 'scene-midnight-drive' },
      { category: 'ambient-effects', itemId: 'effect-city-night' },
      { category: 'widget-skins', itemId: 'widget-luxury' },
      { category: 'themes', itemId: 'theme-0077' },
      { category: 'map-icons', itemId: 'car-icon-0091' },
    ],
  },
  {
    id: 'bundle-off-road-pack',
    name: 'Off-Road Pack',
    cost: 90,
    seasonLabel: 'Terrain Series',
    description: 'A rugged bundle for overland dashboards, including terrain trip plates and heat shimmer effects.',
    accent: 'rgba(74, 222, 128, 0.3)',
    rewards: [
      { category: 'trip-cosmetics', itemId: 'trip-canyon-scout' },
      { category: 'startup-scenes', itemId: 'scene-desert-dawn' },
      { category: 'ambient-effects', itemId: 'effect-desert-heat' },
      { category: 'widget-skins', itemId: 'widget-expedition' },
      { category: 'themes', itemId: 'theme-0128' },
      { category: 'map-icons', itemId: 'car-icon-0130' },
    ],
  },
];

const TRIP_COSMETICS = applyRankPricing(TRIP_COSMETIC_SEEDS, 0);
const SCENE_PACKS = applyRankPricing(SCENE_PACK_SEEDS, TRIP_COSMETIC_SEEDS.length);
const AMBIENT_EFFECTS = applyRankPricing(AMBIENT_EFFECT_SEEDS, TRIP_COSMETIC_SEEDS.length + SCENE_PACK_SEEDS.length);
const WIDGET_SKINS = applyRankPricing(
  WIDGET_SKIN_SEEDS,
  TRIP_COSMETIC_SEEDS.length + SCENE_PACK_SEEDS.length + AMBIENT_EFFECT_SEEDS.length,
);
const LIMITED_BUNDLES = applyRankPricing(
  LIMITED_BUNDLE_SEEDS,
  TRIP_COSMETIC_SEEDS.length + SCENE_PACK_SEEDS.length + AMBIENT_EFFECT_SEEDS.length + WIDGET_SKIN_SEEDS.length,
);

const MIN_COSMETIC_ENTRY_COUNT = 1000;

const TRIP_SERIES = ['Atlas', 'Vector', 'Summit', 'Pulse', 'Aero', 'Drift', 'Pioneer', 'Signal', 'Monarch', 'Orbit'] as const;
const TRIP_PROFILES = ['Runbook', 'Plate', 'Ledger', 'Script', 'Registry', 'Frame', 'Passport', 'Badge', 'Finish', 'Trim'] as const;
const TRIP_BADGES = ['Pilot', 'Driver', 'Navigator', 'Scout', 'Courier', 'Pacer', 'Voyager', 'Sentinel'] as const;
const TRIP_ODOMETER_FINISHES = ['Signal', 'Sprint', 'Titan', 'Carbon', 'Apex', 'Touring', 'Night', 'Executive'] as const;
const TRIP_FRAME_FINISHES = ['Vector', 'Circuit', 'Aero', 'Halo', 'Roadbook', 'Gridline', 'Heritage', 'Launch'] as const;
const DRIVE_CONTEXTS = ['city commuting', 'night highway runs', 'spirited backroad drives', 'overland check-ins', 'grand touring mileage logs', 'weather-heavy route tracking'] as const;

const SCENE_PREFIXES = ['Aurora', 'Velocity', 'Halo', 'Summit', 'Nightfall', 'Vector', 'Static', 'Cascade', 'Signal', 'Mirage'] as const;
const SCENE_SUFFIXES = ['Grid', 'Dock', 'Bay', 'Circuit', 'Harbor', 'Pass', 'Horizon', 'Plaza', 'Lattice', 'Terminal'] as const;
const IDLE_CONTEXTS = ['Parked', 'Curbside', 'Charge-bay', 'Garage', 'Service-lane', 'Checkpoint'] as const;
const CHARGE_CONTEXTS = ['Rapid', 'Pulse', 'Reserve', 'Thermal', 'Harbor', 'Current'] as const;
const SCENE_PATTERNS: readonly ScenePattern[] = ['grid', 'horizon', 'contour', 'storm', 'scan', 'amber'];

const AMBIENT_TITLES = ['Slipstream', 'Halo', 'Echo', 'Ribbon', 'Mirage', 'Prism', 'Velocity', 'Afterglow', 'Haze', 'Tunnel'] as const;
const AMBIENT_SUFFIXES = ['Drift', 'Sweep', 'Pass', 'Bloom', 'Trace', 'Glide', 'Runner', 'Pulse', 'Wake', 'Flow'] as const;
const AMBIENT_LABELS = ['Low atmospheric pass', 'Motion-tuned backdrop', 'Night-drive accent', 'Weather-rich overlay', 'Parking-scene enhancement', 'Highway mood layer'] as const;
const AMBIENT_CONTEXTS = ['dense city traffic', 'late-evening cruising', 'quiet parked scenes', 'stormfront commutes', 'cold-weather loops', 'sunrise departures'] as const;
const AMBIENT_VARIANT_KINDS: readonly AmbientEffectKind[] = ['neon-tunnel', 'sunrise-haze', 'rain-runner', 'snowfall', 'desert-heat', 'city-night'];

const WIDGET_TITLES = ['Command', 'Telemetry', 'Atlas', 'Circuit', 'Summit', 'Aurora', 'Drift', 'Monarch', 'Vector', 'Pioneer'] as const;
const WIDGET_SUFFIXES = ['Cluster', 'Panel', 'Suite', 'Stack', 'Grid', 'Layer', 'Console', 'Deck', 'Display', 'Array'] as const;
const WIDGET_LABELS = ['Balanced widget cluster', 'Telemetry-focused stack', 'Premium touring panel', 'Projected HUD finish', 'Terrain-ready utility stack', 'Night-drive data suite'] as const;
const WIDGET_CONTEXTS = ['dense dashboard telemetry', 'minimal commuting layouts', 'grand touring instrument clusters', 'track-oriented readouts', 'expedition overlays', 'futuristic HUD treatments'] as const;
const WIDGET_VARIANT_STYLES: readonly WidgetSkinStyle[] = ['core', 'retro', 'motorsport', 'luxury', 'cyber', 'expedition'];

function wrapHue(value: number): number {
  const normalized = Math.round(value) % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function hslColor(hue: number, saturation: number, lightness: number): string {
  return `hsl(${wrapHue(hue)} ${saturation}% ${lightness}%)`;
}

function hslaColor(hue: number, saturation: number, lightness: number, alpha: number): string {
  return `hsla(${wrapHue(hue)}, ${saturation}%, ${lightness}%, ${alpha})`;
}

function trimSentence(text: string): string {
  return text.replace(/\.$/, '');
}

function buildCatalog<T>(
  seeds: readonly T[],
  minimumCount: number,
  buildVariant: (seed: T, absoluteIndex: number, variantIndex: number) => T,
): T[] {
  const targetCount = Math.max(minimumCount, seeds.length);
  const items = [...seeds];

  for (let absoluteIndex = items.length; absoluteIndex < targetCount; absoluteIndex += 1) {
    const seed = seeds[absoluteIndex % seeds.length];
    const variantIndex = absoluteIndex - seeds.length;
    items.push(buildVariant(seed, absoluteIndex, variantIndex));
  }

  return items;
}

function buildTripCosmeticsCatalog(): TripCosmeticDefinition[] {
  return buildCatalog(TRIP_COSMETICS, MIN_COSMETIC_ENTRY_COUNT, (seed, absoluteIndex, variantIndex) => {
    const hue = 18 + absoluteIndex * 23;
    const tier = String(absoluteIndex + 1).padStart(4, '0');
    const series = TRIP_SERIES[absoluteIndex % TRIP_SERIES.length];
    const profile = TRIP_PROFILES[(absoluteIndex + variantIndex) % TRIP_PROFILES.length];
    const driveContext = DRIVE_CONTEXTS[(absoluteIndex * 3 + variantIndex) % DRIVE_CONTEXTS.length];
    const { rank, cost } = getStoreRankedPrice(absoluteIndex * 5 + 1);
    const isMythic = rank.id === 'mythic';

    return {
      id: `trip-pack-${tier}`,
      name: isMythic ? `${series} ${profile} Signature` : `${series} ${profile}`,
      cost,
      badgeLabel: isMythic
        ? `${TRIP_BADGES[(absoluteIndex * 3) % TRIP_BADGES.length]} Prime`
        : `${TRIP_BADGES[(absoluteIndex * 3) % TRIP_BADGES.length]} ${String.fromCharCode(65 + (absoluteIndex % 26))}`,
      odometerLabel: isMythic
        ? `${TRIP_ODOMETER_FINISHES[(absoluteIndex + 2) % TRIP_ODOMETER_FINISHES.length]} signature plate`
        : `${TRIP_ODOMETER_FINISHES[(absoluteIndex + 2) % TRIP_ODOMETER_FINISHES.length]} odometer plate`,
      frameLabel: isMythic
        ? `${TRIP_FRAME_FINISHES[(absoluteIndex + 4) % TRIP_FRAME_FINISHES.length]} halo frame`
        : `${TRIP_FRAME_FINISHES[(absoluteIndex + 4) % TRIP_FRAME_FINISHES.length]} frame`,
      description: isMythic
        ? `${trimSentence(seed.description)} Finished with layered alloy highlights, deeper glow channels, and collector-grade detailing for ${driveContext}.`
        : `${trimSentence(seed.description)} Reworked for ${driveContext}.`,
      accent: hslColor(hue, isMythic ? 92 : 82, isMythic ? 64 : 56 + (absoluteIndex % 6)),
      glow: hslaColor(hue + (isMythic ? 18 : 0), isMythic ? 96 : 88, isMythic ? 70 : 62, isMythic ? 0.44 : 0.32),
      surface: isMythic
        ? `radial-gradient(circle at top right, ${hslaColor(hue + 18, 96, 68, 0.2)} 0%, transparent 42%), linear-gradient(145deg, ${hslaColor(hue, 84, 30 + (absoluteIndex % 8), 0.46)}, rgba(15,23,42,0.96))`
        : `linear-gradient(145deg, ${hslaColor(hue, 78, 24 + (absoluteIndex % 10), 0.34)}, rgba(15,23,42,0.92))`,
      plate: isMythic
        ? `linear-gradient(180deg, ${hslaColor(hue + 10, 88, 22 + (absoluteIndex % 8), 0.82)}, ${hslaColor(hue + 28, 92, 42, 0.38)}, rgba(15,23,42,0.97))`
        : `linear-gradient(180deg, ${hslaColor(hue + 9, 76, 16 + (absoluteIndex % 8), 0.76)}, rgba(15,23,42,0.97))`,
    };
  });
}

function buildScenePacksCatalog(): ScenePackDefinition[] {
  return buildCatalog(SCENE_PACKS, MIN_COSMETIC_ENTRY_COUNT, (seed, absoluteIndex, variantIndex) => {
    const hue = 192 + absoluteIndex * 19;
    const glowHue = hue + 24;
    const tier = String(absoluteIndex + 1).padStart(4, '0');
    const name = `${SCENE_PREFIXES[absoluteIndex % SCENE_PREFIXES.length]} ${SCENE_SUFFIXES[(absoluteIndex + variantIndex) % SCENE_SUFFIXES.length]}`;
    const idleContext = IDLE_CONTEXTS[(absoluteIndex * 2 + 1) % IDLE_CONTEXTS.length];
    const chargeContext = CHARGE_CONTEXTS[(absoluteIndex * 5 + 2) % CHARGE_CONTEXTS.length];
    const { rank, cost } = getStoreRankedPrice(absoluteIndex * 5 + 2);
    const isMythic = rank.id === 'mythic';
    const accent = hslaColor(hue, isMythic ? 94 : 88, isMythic ? 70 : 64, isMythic ? 0.52 : 0.42);
    const glow = hslaColor(glowHue, isMythic ? 90 : 82, isMythic ? 66 : 58, isMythic ? 0.38 : 0.28);
    const pattern = SCENE_PATTERNS[absoluteIndex % SCENE_PATTERNS.length];

    return {
      id: `scene-pack-${tier}`,
      name: isMythic ? `${name} Halo` : name,
      cost,
      bootTitle: isMythic ? `${name} signature online` : `${name} online`,
      idleTitle: isMythic ? `${idleContext} halo standby` : `${idleContext} standby`,
      chargingTitle: isMythic ? `${chargeContext} flux charging` : `${chargeContext} charging`,
      description: isMythic
        ? `${trimSentence(seed.description)} Layered with deeper emissive rails, cinematic sky detail, and flagship weather response for ${idleContext.toLowerCase()} atmospheres and ${chargeContext.toLowerCase()} cues.`
        : `${trimSentence(seed.description)} Tuned for ${idleContext.toLowerCase()} atmospheres and ${chargeContext.toLowerCase()} cues.`,
      accent,
      glow,
      background: isMythic
        ? `radial-gradient(circle at ${12 + ((absoluteIndex * 13) % 70)}% ${10 + ((absoluteIndex * 17) % 50)}%, ${hslaColor(hue, 96, 68, 0.26)}, transparent 36%), radial-gradient(circle at 78% 18%, ${hslaColor(glowHue + 38, 92, 70, 0.16)}, transparent 32%), linear-gradient(${145 + (absoluteIndex % 25)}deg, rgba(2,6,23,1), ${hslaColor(glowHue, 74, 18 + (absoluteIndex % 10), 0.72)}, ${hslaColor(hue, 82, 24 + (absoluteIndex % 8), 0.42)})`
        : `radial-gradient(circle at ${12 + ((absoluteIndex * 13) % 70)}% ${10 + ((absoluteIndex * 17) % 50)}%, ${hslaColor(hue, 88, 60, 0.18)}, transparent 38%), linear-gradient(${145 + (absoluteIndex % 25)}deg, rgba(2,6,23,0.98), ${hslaColor(glowHue, 68, 14 + (absoluteIndex % 10), 0.62)}, ${hslaColor(hue, 72, 18 + (absoluteIndex % 8), 0.34)})`,
      overlay: isMythic
        ? `linear-gradient(180deg, ${hslaColor(hue, 96, 68, 0.14)}, ${hslaColor(glowHue, 82, 24, 0.24)})`
        : `linear-gradient(180deg, ${hslaColor(hue, 92, 62, 0.09)}, ${hslaColor(glowHue, 80, 20, 0.18)})`,
      pattern,
      weatherReactive: isMythic ? true : pattern !== 'amber' || absoluteIndex % 2 === 0,
    };
  });
}

function buildAmbientEffectsCatalog(): AmbientEffectDefinition[] {
  return buildCatalog(AMBIENT_EFFECTS, MIN_COSMETIC_ENTRY_COUNT, (seed, absoluteIndex, variantIndex) => {
    const hue = 160 + absoluteIndex * 31;
    const tier = String(absoluteIndex + 1).padStart(4, '0');
    const name = `${AMBIENT_TITLES[absoluteIndex % AMBIENT_TITLES.length]} ${AMBIENT_SUFFIXES[(absoluteIndex + variantIndex) % AMBIENT_SUFFIXES.length]}`;
    const { rank, cost } = getStoreRankedPrice(absoluteIndex * 5 + 3);
    const isMythic = rank.id === 'mythic';

    return {
      id: `ambient-effect-${tier}`,
      name: isMythic ? `${name} Prime` : name,
      cost,
      kind: AMBIENT_VARIANT_KINDS[absoluteIndex % AMBIENT_VARIANT_KINDS.length],
      label: isMythic ? 'Collector-grade motion layer' : AMBIENT_LABELS[(absoluteIndex + 1) % AMBIENT_LABELS.length],
      description: isMythic
        ? `${trimSentence(seed.description)} Layered with cleaner parallax, denser light trails, and refined bloom for ${AMBIENT_CONTEXTS[(absoluteIndex * 2 + variantIndex) % AMBIENT_CONTEXTS.length]}.`
        : `${trimSentence(seed.description)} Tuned for ${AMBIENT_CONTEXTS[(absoluteIndex * 2 + variantIndex) % AMBIENT_CONTEXTS.length]}.`,
      accent: hslaColor(hue, isMythic ? 94 : 88, isMythic ? 68 : 64, isMythic ? 0.42 : 0.34),
      secondary: hslaColor(hue + 32, isMythic ? 82 : 72, isMythic ? 62 : 56, isMythic ? 0.3 : 0.22),
    };
  });
}

function buildWidgetSkinsCatalog(): WidgetSkinDefinition[] {
  return buildCatalog(WIDGET_SKINS, MIN_COSMETIC_ENTRY_COUNT, (seed, absoluteIndex, variantIndex) => {
    const hue = 24 + absoluteIndex * 27;
    const tier = String(absoluteIndex + 1).padStart(4, '0');
    const { rank, cost } = getStoreRankedPrice(absoluteIndex * 5 + 4);
    const isMythic = rank.id === 'mythic';
    const name = `${WIDGET_TITLES[absoluteIndex % WIDGET_TITLES.length]} ${WIDGET_SUFFIXES[(absoluteIndex + variantIndex) % WIDGET_SUFFIXES.length]}`;

    return {
      id: `widget-skin-${tier}`,
      name: isMythic ? `${name} Atelier` : name,
      cost,
      style: WIDGET_VARIANT_STYLES[absoluteIndex % WIDGET_VARIANT_STYLES.length],
      label: isMythic ? 'Flagship telemetry array' : WIDGET_LABELS[(absoluteIndex + 1) % WIDGET_LABELS.length],
      description: isMythic
        ? `${trimSentence(seed.description)} Rebuilt with layered micro-contrast, sharper numerals, and premium panel depth for ${WIDGET_CONTEXTS[(absoluteIndex * 2 + variantIndex) % WIDGET_CONTEXTS.length]}.`
        : `${trimSentence(seed.description)} Reframed for ${WIDGET_CONTEXTS[(absoluteIndex * 2 + variantIndex) % WIDGET_CONTEXTS.length]}.`,
      accent: hslColor(hue, isMythic ? 92 : 84, isMythic ? 66 : 60),
      panel: isMythic
        ? `radial-gradient(circle at top right, ${hslaColor(hue + 20, 96, 72, 0.18)} 0%, transparent 40%), linear-gradient(145deg, ${hslaColor(hue, 82, 22 + (absoluteIndex % 8), 0.44)}, rgba(15,23,42,0.98))`
        : `linear-gradient(145deg, ${hslaColor(hue, 74, 18 + (absoluteIndex % 10), 0.36)}, rgba(15,23,42,0.96))`,
    };
  });
}

const FULL_TRIP_COSMETICS = buildTripCosmeticsCatalog();
const FULL_SCENE_PACKS = buildScenePacksCatalog();
const FULL_AMBIENT_EFFECTS = buildAmbientEffectsCatalog();
const FULL_WIDGET_SKINS = buildWidgetSkinsCatalog();

function paginate<T>(items: readonly T[], page: number, pageSize: number): T[] {
  const safePage = Math.max(1, page);
  const safeSize = Math.max(1, pageSize);
  const start = (safePage - 1) * safeSize;
  if (start >= items.length) return [];
  return items.slice(start, start + safeSize);
}

function getById<T extends { id: string }>(items: readonly T[], itemId: string | null | undefined): T | null {
  if (!itemId) return null;
  return items.find((item) => item.id === itemId) ?? null;
}

export const TRIP_COSMETIC_COUNT = FULL_TRIP_COSMETICS.length;
export const SCENE_PACK_COUNT = FULL_SCENE_PACKS.length;
export const AMBIENT_EFFECT_COUNT = FULL_AMBIENT_EFFECTS.length;
export const WIDGET_SKIN_COUNT = FULL_WIDGET_SKINS.length;
export const LIMITED_BUNDLE_COUNT = LIMITED_BUNDLES.length;

export function getTripCosmeticById(itemId: string | null | undefined): TripCosmeticDefinition | null {
  return getById(FULL_TRIP_COSMETICS, itemId);
}

export function getTripCosmeticPage(page: number, pageSize: number): TripCosmeticDefinition[] {
  return paginate(FULL_TRIP_COSMETICS, page, pageSize);
}

export function getScenePackById(itemId: string | null | undefined): ScenePackDefinition | null {
  return getById(FULL_SCENE_PACKS, itemId);
}

export function getScenePackPage(page: number, pageSize: number): ScenePackDefinition[] {
  return paginate(FULL_SCENE_PACKS, page, pageSize);
}

export function getAmbientEffectById(itemId: string | null | undefined): AmbientEffectDefinition | null {
  return getById(FULL_AMBIENT_EFFECTS, itemId);
}

export function getAmbientEffectPage(page: number, pageSize: number): AmbientEffectDefinition[] {
  return paginate(FULL_AMBIENT_EFFECTS, page, pageSize);
}

export function getWidgetSkinById(itemId: string | null | undefined): WidgetSkinDefinition | null {
  return getById(FULL_WIDGET_SKINS, itemId);
}

export function getWidgetSkinPage(page: number, pageSize: number): WidgetSkinDefinition[] {
  return paginate(FULL_WIDGET_SKINS, page, pageSize);
}

export function getLimitedBundleById(itemId: string | null | undefined): LimitedBundleDefinition | null {
  return getById(LIMITED_BUNDLES, itemId);
}

export function getLimitedBundlePage(page: number, pageSize: number): LimitedBundleDefinition[] {
  return paginate(LIMITED_BUNDLES, page, pageSize);
}

export function getBundleRewardCategoryLabel(category: BundleRewardCategory): string {
  switch (category) {
    case 'trip-cosmetics':
      return 'Trip cosmetics';
    case 'startup-scenes':
      return 'Startup scene';
    case 'ambient-effects':
      return 'Ambient effect';
    case 'widget-skins':
      return 'Widget skin';
    case 'themes':
      return 'Theme';
    case 'map-icons':
      return 'Map icon';
    default:
      return 'Reward';
  }
}