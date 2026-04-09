import { getStoreRankedPrice } from '@/lib/store-ranks';

export type MapCarAnimation = 'hover' | 'cruise' | 'pulse' | 'tilt' | 'drift';
export type MapCarBodyStyle = 'coupe' | 'sedan' | 'suv' | 'roadster' | 'rally' | 'hyper';
export type MapCarAccentStyle = 'center-stripe' | 'double-stripe' | 'split-tone' | 'sweep' | 'bolt' | 'halo';
export type MapCarRoofStyle = 'glass' | 'sunroof' | 'rack' | 'solid' | 'split';
export type MapCarWheelStyle = 'street' | 'classic' | 'turbine' | 'rally' | 'glow';
export type MapCarLampStyle = 'round' | 'thin' | 'blade' | 'stacked';
export type MapCarFamilyId =
  | 'rear-engine-coupe'
  | 'grand-tour-roadster'
  | 'rally-hatch'
  | 'executive-sedan'
  | 'sport-liftback'
  | 'box-trail-suv'
  | 'luxury-performance-suv'
  | 'mid-engine-supercar'
  | 'hyper-ev'
  | 'track-coupe';

export interface MapCarIconDefinition {
  id: string;
  name: string;
  cost: number;
  animation: MapCarAnimation;
  animationLabel: string;
  familyId: MapCarFamilyId;
  familyLabel: string;
  bodyStyle: MapCarBodyStyle;
  bodyLabel: string;
  accentStyle: MapCarAccentStyle;
  roofStyle: MapCarRoofStyle;
  wheelStyle: MapCarWheelStyle;
  lampStyle: MapCarLampStyle;
  bodyColor: string;
  accentColor: string;
  glassColor: string;
  wheelColor: string;
  glowColor: string;
  shadowColor: string;
  frontWidth: number;
  midWidth: number;
  rearWidth: number;
  bodyTop: number;
  bodyLength: number;
  roofInset: number;
  roofLength: number;
  wheelInset: number;
  wheelLength: number;
  hoodLength: number;
  rearDeckLength: number;
  cabinShift: number;
  fenderBulge: number;
  mirrorOffset: number;
  mirrorSize: number;
  splitter: boolean;
  diffuser: boolean;
  sideVent: boolean;
  spoiler: boolean;
}

interface MapCarFamilyPreset {
  id: MapCarFamilyId;
  label: string;
  bodyStyle: MapCarBodyStyle;
  frontWidth: number;
  midWidth: number;
  rearWidth: number;
  bodyLength: number;
  roofLength: number;
  hoodLength: number;
  rearDeckLength: number;
  cabinShift: number;
  fenderBulge: number;
  mirrorOffset: number;
  mirrorSize: number;
  lampStyle: MapCarLampStyle;
  splitter: boolean;
  diffuser: boolean;
  sideVent: boolean;
  accentStyles: readonly MapCarAccentStyle[];
  roofStyles: readonly MapCarRoofStyle[];
  wheelStyles: readonly MapCarWheelStyle[];
}

interface BodyPaintPreset {
  body: string;
  accent: string;
  glass: string;
  wheel: string;
  glow: string;
  shadow: string;
}

export const MAP_ICON_COUNT = 1000;

const ANIMATION_LABELS: Record<MapCarAnimation, string> = {
  hover: 'Soft hover',
  cruise: 'Cruise glide',
  pulse: 'Neon pulse',
  tilt: 'Corner tilt',
  drift: 'Drift sway',
};

const BODY_LABELS: Record<MapCarBodyStyle, string> = {
  coupe: 'Coupe',
  sedan: 'Sedan',
  suv: 'SUV',
  roadster: 'Roadster',
  rally: 'Rally',
  hyper: 'Hypercar',
};

const ANIMATIONS: readonly MapCarAnimation[] = ['hover', 'cruise', 'pulse', 'tilt', 'drift'];

const BODY_PAINTS: readonly BodyPaintPreset[] = [
  { body: 'hsl(210 18% 94%)', accent: 'hsl(220 16% 24%)', glass: 'hsl(214 30% 22%)', wheel: 'hsl(220 10% 16%)', glow: 'hsl(210 88% 66%)', shadow: 'hsl(220 18% 11%)' },
  { body: 'hsl(210 10% 78%)', accent: 'hsl(220 10% 20%)', glass: 'hsl(214 26% 21%)', wheel: 'hsl(220 10% 15%)', glow: 'hsl(210 72% 62%)', shadow: 'hsl(220 16% 10%)' },
  { body: 'hsl(210 8% 60%)', accent: 'hsl(220 10% 18%)', glass: 'hsl(214 24% 20%)', wheel: 'hsl(220 8% 14%)', glow: 'hsl(208 68% 58%)', shadow: 'hsl(220 14% 10%)' },
  { body: 'hsl(220 10% 22%)', accent: 'hsl(0 0% 88%)', glass: 'hsl(214 24% 18%)', wheel: 'hsl(220 8% 10%)', glow: 'hsl(220 86% 62%)', shadow: 'hsl(220 20% 8%)' },
  { body: 'hsl(222 58% 34%)', accent: 'hsl(0 0% 92%)', glass: 'hsl(214 28% 20%)', wheel: 'hsl(220 10% 14%)', glow: 'hsl(224 88% 62%)', shadow: 'hsl(226 22% 10%)' },
  { body: 'hsl(209 80% 42%)', accent: 'hsl(0 0% 92%)', glass: 'hsl(214 30% 22%)', wheel: 'hsl(220 10% 15%)', glow: 'hsl(208 90% 62%)', shadow: 'hsl(212 24% 11%)' },
  { body: 'hsl(356 66% 42%)', accent: 'hsl(0 0% 96%)', glass: 'hsl(214 30% 20%)', wheel: 'hsl(220 10% 14%)', glow: 'hsl(356 90% 64%)', shadow: 'hsl(356 22% 11%)' },
  { body: 'hsl(343 44% 30%)', accent: 'hsl(0 0% 92%)', glass: 'hsl(214 28% 20%)', wheel: 'hsl(220 10% 14%)', glow: 'hsl(340 82% 62%)', shadow: 'hsl(342 24% 10%)' },
  { body: 'hsl(145 38% 24%)', accent: 'hsl(42 72% 66%)', glass: 'hsl(214 24% 20%)', wheel: 'hsl(220 10% 13%)', glow: 'hsl(146 68% 56%)', shadow: 'hsl(146 24% 9%)' },
  { body: 'hsl(38 34% 62%)', accent: 'hsl(220 10% 20%)', glass: 'hsl(214 24% 22%)', wheel: 'hsl(220 10% 15%)', glow: 'hsl(38 84% 60%)', shadow: 'hsl(34 20% 12%)' },
  { body: 'hsl(24 78% 46%)', accent: 'hsl(0 0% 96%)', glass: 'hsl(214 28% 20%)', wheel: 'hsl(220 10% 14%)', glow: 'hsl(24 92% 60%)', shadow: 'hsl(24 24% 11%)' },
  { body: 'hsl(50 88% 54%)', accent: 'hsl(220 10% 16%)', glass: 'hsl(214 26% 22%)', wheel: 'hsl(220 10% 15%)', glow: 'hsl(48 94% 62%)', shadow: 'hsl(42 22% 12%)' },
  { body: 'hsl(185 56% 36%)', accent: 'hsl(0 0% 94%)', glass: 'hsl(214 30% 20%)', wheel: 'hsl(220 10% 14%)', glow: 'hsl(186 86% 60%)', shadow: 'hsl(188 22% 11%)' },
  { body: 'hsl(275 22% 34%)', accent: 'hsl(0 0% 92%)', glass: 'hsl(214 26% 20%)', wheel: 'hsl(220 10% 13%)', glow: 'hsl(274 80% 64%)', shadow: 'hsl(274 22% 10%)' },
];

const CAR_FAMILIES: readonly MapCarFamilyPreset[] = [
  {
    id: 'rear-engine-coupe',
    label: 'Rear-Engine Coupe',
    bodyStyle: 'coupe',
    frontWidth: 38,
    midWidth: 56,
    rearWidth: 48,
    bodyLength: 84,
    roofLength: 34,
    hoodLength: 18,
    rearDeckLength: 24,
    cabinShift: 2,
    fenderBulge: 4,
    mirrorOffset: 7,
    mirrorSize: 3.4,
    lampStyle: 'round',
    splitter: false,
    diffuser: false,
    sideVent: false,
    accentStyles: ['double-stripe', 'center-stripe', 'halo'],
    roofStyles: ['glass', 'sunroof', 'split'],
    wheelStyles: ['classic', 'street', 'turbine'],
  },
  {
    id: 'grand-tour-roadster',
    label: 'Grand Tour Roadster',
    bodyStyle: 'roadster',
    frontWidth: 40,
    midWidth: 58,
    rearWidth: 46,
    bodyLength: 82,
    roofLength: 30,
    hoodLength: 24,
    rearDeckLength: 18,
    cabinShift: -3,
    fenderBulge: 5,
    mirrorOffset: 8,
    mirrorSize: 3.6,
    lampStyle: 'blade',
    splitter: true,
    diffuser: false,
    sideVent: true,
    accentStyles: ['sweep', 'center-stripe', 'bolt'],
    roofStyles: ['glass', 'split', 'solid'],
    wheelStyles: ['street', 'classic', 'turbine'],
  },
  {
    id: 'rally-hatch',
    label: 'Rally Hatch',
    bodyStyle: 'rally',
    frontWidth: 44,
    midWidth: 62,
    rearWidth: 52,
    bodyLength: 86,
    roofLength: 36,
    hoodLength: 19,
    rearDeckLength: 17,
    cabinShift: -1,
    fenderBulge: 6,
    mirrorOffset: 7,
    mirrorSize: 3.5,
    lampStyle: 'stacked',
    splitter: true,
    diffuser: true,
    sideVent: true,
    accentStyles: ['bolt', 'double-stripe', 'split-tone'],
    roofStyles: ['solid', 'sunroof', 'split'],
    wheelStyles: ['rally', 'street', 'glow'],
  },
  {
    id: 'executive-sedan',
    label: 'Executive Sedan',
    bodyStyle: 'sedan',
    frontWidth: 42,
    midWidth: 60,
    rearWidth: 50,
    bodyLength: 90,
    roofLength: 40,
    hoodLength: 22,
    rearDeckLength: 20,
    cabinShift: 0,
    fenderBulge: 3,
    mirrorOffset: 7,
    mirrorSize: 3.1,
    lampStyle: 'thin',
    splitter: false,
    diffuser: false,
    sideVent: false,
    accentStyles: ['split-tone', 'halo', 'center-stripe'],
    roofStyles: ['glass', 'sunroof', 'solid'],
    wheelStyles: ['turbine', 'street', 'classic'],
  },
  {
    id: 'sport-liftback',
    label: 'Sport Liftback',
    bodyStyle: 'sedan',
    frontWidth: 41,
    midWidth: 60,
    rearWidth: 52,
    bodyLength: 88,
    roofLength: 38,
    hoodLength: 20,
    rearDeckLength: 16,
    cabinShift: 1,
    fenderBulge: 4,
    mirrorOffset: 7,
    mirrorSize: 3.2,
    lampStyle: 'blade',
    splitter: true,
    diffuser: true,
    sideVent: false,
    accentStyles: ['sweep', 'split-tone', 'double-stripe'],
    roofStyles: ['glass', 'sunroof', 'split'],
    wheelStyles: ['turbine', 'street', 'glow'],
  },
  {
    id: 'box-trail-suv',
    label: 'Box Trail SUV',
    bodyStyle: 'suv',
    frontWidth: 46,
    midWidth: 66,
    rearWidth: 58,
    bodyLength: 94,
    roofLength: 44,
    hoodLength: 24,
    rearDeckLength: 20,
    cabinShift: -2,
    fenderBulge: 4,
    mirrorOffset: 9,
    mirrorSize: 3.8,
    lampStyle: 'stacked',
    splitter: false,
    diffuser: false,
    sideVent: false,
    accentStyles: ['halo', 'split-tone', 'center-stripe'],
    roofStyles: ['rack', 'solid', 'sunroof'],
    wheelStyles: ['rally', 'street', 'classic'],
  },
  {
    id: 'luxury-performance-suv',
    label: 'Luxury Performance SUV',
    bodyStyle: 'suv',
    frontWidth: 44,
    midWidth: 64,
    rearWidth: 56,
    bodyLength: 92,
    roofLength: 40,
    hoodLength: 22,
    rearDeckLength: 18,
    cabinShift: 0,
    fenderBulge: 5,
    mirrorOffset: 8,
    mirrorSize: 3.5,
    lampStyle: 'thin',
    splitter: true,
    diffuser: true,
    sideVent: true,
    accentStyles: ['sweep', 'halo', 'split-tone'],
    roofStyles: ['glass', 'sunroof', 'solid'],
    wheelStyles: ['turbine', 'glow', 'street'],
  },
  {
    id: 'mid-engine-supercar',
    label: 'Mid-Engine Supercar',
    bodyStyle: 'hyper',
    frontWidth: 40,
    midWidth: 58,
    rearWidth: 50,
    bodyLength: 84,
    roofLength: 30,
    hoodLength: 17,
    rearDeckLength: 19,
    cabinShift: 1,
    fenderBulge: 7,
    mirrorOffset: 7,
    mirrorSize: 3.2,
    lampStyle: 'blade',
    splitter: true,
    diffuser: true,
    sideVent: true,
    accentStyles: ['bolt', 'sweep', 'double-stripe'],
    roofStyles: ['glass', 'split', 'solid'],
    wheelStyles: ['glow', 'turbine', 'street'],
  },
  {
    id: 'hyper-ev',
    label: 'Hyper EV',
    bodyStyle: 'hyper',
    frontWidth: 42,
    midWidth: 60,
    rearWidth: 52,
    bodyLength: 86,
    roofLength: 32,
    hoodLength: 18,
    rearDeckLength: 18,
    cabinShift: 0,
    fenderBulge: 6,
    mirrorOffset: 7,
    mirrorSize: 3,
    lampStyle: 'thin',
    splitter: true,
    diffuser: true,
    sideVent: false,
    accentStyles: ['halo', 'bolt', 'center-stripe'],
    roofStyles: ['glass', 'split', 'sunroof'],
    wheelStyles: ['glow', 'turbine', 'street'],
  },
  {
    id: 'track-coupe',
    label: 'Track Coupe',
    bodyStyle: 'coupe',
    frontWidth: 40,
    midWidth: 58,
    rearWidth: 48,
    bodyLength: 85,
    roofLength: 33,
    hoodLength: 20,
    rearDeckLength: 18,
    cabinShift: -1,
    fenderBulge: 6,
    mirrorOffset: 7,
    mirrorSize: 3.2,
    lampStyle: 'round',
    splitter: true,
    diffuser: true,
    sideVent: true,
    accentStyles: ['double-stripe', 'bolt', 'center-stripe'],
    roofStyles: ['glass', 'solid', 'split'],
    wheelStyles: ['rally', 'street', 'turbine'],
  },
];

const SERIES = [
  'Monaco',
  'Silvercrest',
  'Nordline',
  'Highline',
  'Apex',
  'Stratos',
  'Canyon',
  'Orbit',
  'Summit',
  'Vector',
];

const TRIMS = ['GT', 'RS', 'R', 'Club', 'Sport', 'Track', 'S', 'Touring', 'Aero', 'EV'];

const MYTHIC_SERIES = ['Afterburn', 'Crownline', 'Nightspire', 'Solaris', 'Voltaris', 'Monarch', 'Apexion', 'Halcyon'] as const;
const MYTHIC_TRIMS = ['Halo', 'Prime', 'Signature', 'Flux', 'GT-R', 'Zero'] as const;

const MYTHIC_BODY_PAINTS: readonly BodyPaintPreset[] = [
  { body: 'hsl(356 82% 58%)', accent: 'hsl(42 94% 72%)', glass: 'hsl(218 38% 18%)', wheel: 'hsl(36 18% 68%)', glow: 'hsl(355 100% 70%)', shadow: 'hsl(344 34% 10%)' },
  { body: 'hsl(214 74% 52%)', accent: 'hsl(188 92% 72%)', glass: 'hsl(218 44% 18%)', wheel: 'hsl(190 28% 70%)', glow: 'hsl(194 100% 72%)', shadow: 'hsl(216 34% 10%)' },
  { body: 'hsl(166 82% 34%)', accent: 'hsl(52 94% 70%)', glass: 'hsl(184 34% 16%)', wheel: 'hsl(52 16% 68%)', glow: 'hsl(160 98% 64%)', shadow: 'hsl(170 34% 9%)' },
  { body: 'hsl(278 42% 34%)', accent: 'hsl(18 96% 72%)', glass: 'hsl(260 32% 18%)', wheel: 'hsl(16 18% 66%)', glow: 'hsl(14 100% 72%)', shadow: 'hsl(276 30% 9%)' },
  { body: 'hsl(220 14% 18%)', accent: 'hsl(332 92% 70%)', glass: 'hsl(220 24% 16%)', wheel: 'hsl(332 20% 68%)', glow: 'hsl(334 100% 72%)', shadow: 'hsl(220 24% 8%)' },
  { body: 'hsl(34 72% 54%)', accent: 'hsl(12 94% 70%)', glass: 'hsl(26 28% 16%)', wheel: 'hsl(34 18% 62%)', glow: 'hsl(20 100% 68%)', shadow: 'hsl(26 26% 9%)' },
];

const MYTHIC_FAMILY_PRESETS: readonly MapCarFamilyPreset[] = CAR_FAMILIES.filter((family) =>
  family.id === 'mid-engine-supercar'
  || family.id === 'hyper-ev'
  || family.id === 'track-coupe'
  || family.id === 'grand-tour-roadster'
);

function toMapIconId(index: number): string {
  return `car-icon-${String(index + 1).padStart(4, '0')}`;
}

function fromMapIconId(iconId: string | null | undefined): number | null {
  if (!iconId) return null;
  const match = /^car-icon-(\d{4})$/.exec(iconId);
  if (!match) return null;
  const value = Number(match[1]) - 1;
  if (value < 0 || value >= MAP_ICON_COUNT) return null;
  return value;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hsl(hue: number, sat: number, light: number): string {
  const normalizedHue = ((hue % 360) + 360) % 360;
  return `hsl(${normalizedHue} ${clamp(sat, 0, 100)}% ${clamp(light, 0, 100)}%)`;
}

function pickFromList<T>(list: readonly T[], seed: number): T {
  return list[seed % list.length];
}

export function getMapIconByIndex(index: number): MapCarIconDefinition {
  const safeIndex = clamp(index, 0, MAP_ICON_COUNT - 1);
  const seed = safeIndex + 1;
  const { rank, cost } = getStoreRankedPrice(safeIndex * 7 + 2);
  const isMythic = rank.id === 'mythic';
  const familyPool = isMythic ? MYTHIC_FAMILY_PRESETS : CAR_FAMILIES;
  const family = familyPool[safeIndex % familyPool.length];
  const animationPool = isMythic ? (['pulse', 'drift', 'tilt'] as const) : ANIMATIONS;
  const animation = animationPool[Math.floor(safeIndex / 4) % animationPool.length];
  const accentPool = isMythic ? family.accentStyles.filter((style) => style !== 'split-tone') : family.accentStyles;
  const roofPool = isMythic ? family.roofStyles.filter((style) => style !== 'rack') : family.roofStyles;
  const wheelPool = isMythic
    ? family.wheelStyles.filter((style) => style === 'glow' || style === 'turbine' || style === 'street')
    : family.wheelStyles;
  const accentStyle = pickFromList(accentPool.length > 0 ? accentPool : family.accentStyles, Math.floor(seed / 3));
  const roofStyle = pickFromList(roofPool.length > 0 ? roofPool : family.roofStyles, Math.floor(seed / 5));
  const wheelStyle = pickFromList(wheelPool.length > 0 ? wheelPool : family.wheelStyles, Math.floor(seed / 7));
  const paint = pickFromList(isMythic ? MYTHIC_BODY_PAINTS : BODY_PAINTS, Math.floor(seed / 2));

  return {
    id: toMapIconId(safeIndex),
    name: isMythic
      ? `${MYTHIC_SERIES[safeIndex % MYTHIC_SERIES.length]} ${MYTHIC_TRIMS[Math.floor(safeIndex / MYTHIC_SERIES.length) % MYTHIC_TRIMS.length]} ${String(safeIndex + 1).padStart(4, '0')}`
      : `${SERIES[safeIndex % SERIES.length]} ${TRIMS[Math.floor(safeIndex / SERIES.length) % TRIMS.length]} ${String(safeIndex + 1).padStart(4, '0')}`,
    cost,
    animation,
    animationLabel: ANIMATION_LABELS[animation],
    familyId: family.id,
    familyLabel: family.label,
    bodyStyle: family.bodyStyle,
    bodyLabel: BODY_LABELS[family.bodyStyle],
    accentStyle,
    roofStyle,
    wheelStyle,
    lampStyle: family.lampStyle,
    bodyColor: paint.body,
    accentColor: paint.accent,
    glassColor: paint.glass,
    wheelColor: paint.wheel,
    glowColor: paint.glow,
    shadowColor: paint.shadow,
    frontWidth: family.frontWidth + ((seed * 7) % 5) - 2 + (isMythic ? 1 : 0),
    midWidth: family.midWidth + ((seed * 11) % 7) - 3 + (isMythic ? 2 : 0),
    rearWidth: family.rearWidth + ((seed * 13) % 5) - 2 + (isMythic ? 1 : 0),
    bodyTop: 14 + (safeIndex % 4) - (isMythic ? 1 : 0),
    bodyLength: family.bodyLength + ((seed * 5) % 5) - 2 + (isMythic ? 2 : 0),
    roofInset: 8 + (safeIndex % 5),
    roofLength: family.roofLength + ((seed * 3) % 5) - 2 + (isMythic ? 1 : 0),
    wheelInset: 11 + (safeIndex % 4),
    wheelLength: 13 + (safeIndex % 5) + (isMythic ? 1 : 0),
    hoodLength: family.hoodLength + ((seed * 2) % 3) - 1,
    rearDeckLength: family.rearDeckLength + ((seed * 3) % 3) - 1,
    cabinShift: family.cabinShift + ((seed % 3) - 1),
    fenderBulge: family.fenderBulge + ((seed * 5) % 3) - 1 + (isMythic ? 1 : 0),
    mirrorOffset: family.mirrorOffset + ((seed * 7) % 3) - 1,
    mirrorSize: family.mirrorSize + (((seed * 11) % 3) - 1) * 0.18 + (isMythic ? 0.16 : 0),
    splitter: isMythic || family.splitter,
    diffuser: isMythic || family.diffuser,
    sideVent: isMythic || family.sideVent,
    spoiler: isMythic || family.diffuser || family.id === 'rally-hatch' || family.id === 'track-coupe' || family.id === 'mid-engine-supercar',
  };
}

export function getMapIconById(iconId: string | null | undefined): MapCarIconDefinition | null {
  const mapIconIndex = fromMapIconId(iconId);
  if (mapIconIndex === null) return null;
  return getMapIconByIndex(mapIconIndex);
}

export function getMapIconPage(page: number, pageSize: number): MapCarIconDefinition[] {
  const safePage = Math.max(1, page);
  const safeSize = Math.max(1, pageSize);
  const start = (safePage - 1) * safeSize;
  if (start >= MAP_ICON_COUNT) return [];

  const end = Math.min(MAP_ICON_COUNT, start + safeSize);
  const icons: MapCarIconDefinition[] = [];
  for (let index = start; index < end; index += 1) {
    icons.push(getMapIconByIndex(index));
  }
  return icons;
}
