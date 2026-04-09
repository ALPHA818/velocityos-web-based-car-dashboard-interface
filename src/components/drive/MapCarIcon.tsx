import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getMapIconById, getMapIconByIndex, type MapCarAnimation, type MapCarIconDefinition, type MapCarLampStyle } from '@/lib/map-icon-market';

interface MapCarIconProps {
  iconId?: string | null;
  size?: number;
  heading?: number | null;
  animated?: boolean;
  showPulse?: boolean;
  className?: string;
}

interface BodyTraits {
  noseFlat: number;
  tailFlat: number;
  shoulderWidth: number;
  hipWidth: number;
  greenhouseFront: number;
  greenhouseMid: number;
  greenhouseRear: number;
  roofBridge: number;
  waistInset: number;
  rockerDepth: number;
  highlightDepth: number;
}

const ICON_MOTION: Record<MapCarAnimation, { animate: Record<string, number[]>; duration: number }> = {
  hover: { animate: { y: [0, -2, 0], scale: [1, 1.02, 1] }, duration: 2.8 },
  cruise: { animate: { x: [0, 1.5, 0, -1.5, 0], y: [0, -1, 0, 1, 0] }, duration: 3.2 },
  pulse: { animate: { scale: [1, 1.03, 1], opacity: [1, 0.97, 1] }, duration: 2.6 },
  tilt: { animate: { rotate: [0, -1.5, 0, 1.5, 0], y: [0, -1.5, 0] }, duration: 3 },
  drift: { animate: { rotate: [0, -2, 0, 2, 0], x: [0, -1, 0, 1, 0] }, duration: 3.4 },
};

function getBodyTraits(icon: MapCarIconDefinition): BodyTraits {
  switch (icon.bodyStyle) {
    case 'suv':
      return { noseFlat: 0.34, tailFlat: 0.4, shoulderWidth: 0.9, hipWidth: 0.92, greenhouseFront: 0.48, greenhouseMid: 0.58, greenhouseRear: 0.52, roofBridge: 0.46, waistInset: 1.4, rockerDepth: 10, highlightDepth: 21 };
    case 'sedan':
      return { noseFlat: 0.3, tailFlat: 0.34, shoulderWidth: 0.88, hipWidth: 0.9, greenhouseFront: 0.46, greenhouseMid: 0.54, greenhouseRear: 0.44, roofBridge: 0.42, waistInset: 2.1, rockerDepth: 8, highlightDepth: 19 };
    case 'roadster':
      return { noseFlat: 0.28, tailFlat: 0.3, shoulderWidth: 0.9, hipWidth: 0.84, greenhouseFront: 0.4, greenhouseMid: 0.44, greenhouseRear: 0.34, roofBridge: 0.32, waistInset: 2.6, rockerDepth: 7, highlightDepth: 17 };
    case 'hyper':
      return { noseFlat: 0.24, tailFlat: 0.28, shoulderWidth: 0.92, hipWidth: 0.84, greenhouseFront: 0.38, greenhouseMid: 0.42, greenhouseRear: 0.32, roofBridge: 0.28, waistInset: 3, rockerDepth: 8, highlightDepth: 17 };
    case 'rally':
      return { noseFlat: 0.34, tailFlat: 0.36, shoulderWidth: 0.92, hipWidth: 0.9, greenhouseFront: 0.46, greenhouseMid: 0.52, greenhouseRear: 0.46, roofBridge: 0.4, waistInset: 1.8, rockerDepth: 9, highlightDepth: 19 };
    case 'coupe':
    default:
      return { noseFlat: 0.28, tailFlat: 0.32, shoulderWidth: 0.9, hipWidth: 0.86, greenhouseFront: 0.42, greenhouseMid: 0.48, greenhouseRear: 0.36, roofBridge: 0.36, waistInset: 2.4, rockerDepth: 7, highlightDepth: 18 };
  }
}

function buildBodyPath(icon: MapCarIconDefinition, traits: BodyTraits): string {
  const center = 60;
  const bodyTop = icon.bodyTop;
  const bodyBottom = icon.bodyTop + icon.bodyLength;
  const frontAxleY = bodyTop + icon.hoodLength + 9;
  const rearAxleY = bodyBottom - icon.rearDeckLength - 4;
  const frontHalf = icon.frontWidth / 2;
  const midHalf = icon.midWidth / 2;
  const rearHalf = icon.rearWidth / 2;
  const noseFlat = Math.max(5.4, frontHalf * traits.noseFlat);
  const tailFlat = Math.max(6.4, rearHalf * traits.tailFlat);
  const frontCornerHalf = Math.max(frontHalf * 0.78, frontHalf + icon.fenderBulge * 0.12);
  const tailCornerHalf = Math.max(rearHalf * 0.82, rearHalf + icon.fenderBulge * 0.12);
  const frontArchHalf = Math.max(frontHalf + icon.fenderBulge * 0.62, midHalf * traits.shoulderWidth);
  const rearArchHalf = Math.max(rearHalf + icon.fenderBulge * 0.56, midHalf * traits.hipWidth);
  const midSectionHalf = Math.max(midHalf - traits.waistInset, Math.min(frontArchHalf, rearArchHalf) - 2.4);
  const noseY = bodyTop + 1.4;
  const frontCornerY = bodyTop + icon.hoodLength * 0.36 + 2.2;
  const shoulderY = bodyTop + icon.hoodLength * 0.78 + 2;
  const frontArchY = frontAxleY - 4.2;
  const waistStartY = frontAxleY + 7;
  const waistEndY = rearAxleY - 8.5;
  const rearArchY = rearAxleY + 2.4;
  const tailCornerY = bodyBottom - 6;
  const tailY = bodyBottom - 0.8;

  return [
    `M ${center - noseFlat} ${noseY}`,
    `L ${center + noseFlat} ${noseY}`,
    `L ${center + frontCornerHalf} ${frontCornerY}`,
    `Q ${center + frontHalf + 0.8} ${shoulderY - 0.8} ${center + frontArchHalf} ${frontArchY}`,
    `L ${center + midSectionHalf + 1} ${waistStartY + 6.4}`,
    `L ${center + midSectionHalf} ${waistEndY}`,
    `L ${center + rearArchHalf} ${rearArchY}`,
    `L ${center + tailCornerHalf} ${tailCornerY}`,
    `L ${center + tailFlat} ${tailY}`,
    `L ${center - tailFlat} ${tailY}`,
    `L ${center - tailCornerHalf} ${tailCornerY}`,
    `L ${center - rearArchHalf} ${rearArchY}`,
    `L ${center - midSectionHalf} ${waistEndY}`,
    `L ${center - midSectionHalf - 1} ${waistStartY + 6.4}`,
    `Q ${center - midHalf - 0.8} ${waistStartY} ${center - frontArchHalf} ${frontArchY}`,
    `Q ${center - frontHalf - 1.8} ${shoulderY - 1.4} ${center - frontCornerHalf} ${frontCornerY}`,
    'Z',
  ].join(' ');
}

function buildWindowPath(icon: MapCarIconDefinition, traits: BodyTraits): string {
  const center = 60 + icon.cabinShift;
  const roofTop = icon.bodyTop + 18;
  const shoulderY = roofTop + 10;
  const rearY = roofTop + icon.roofLength + 9;
  const frontHalf = Math.max(9.6, (icon.midWidth / 2) * traits.greenhouseFront - icon.roofInset * 0.22);
  const roofHalf = Math.max(11.2, (icon.midWidth / 2) * traits.greenhouseMid - icon.roofInset * 0.18);
  const rearHalf = Math.max(8.8, (icon.midWidth / 2) * traits.greenhouseRear - icon.roofInset * 0.2);

  return [
    `M ${center - frontHalf * 0.56} ${roofTop + 1.1}`,
    `Q ${center} ${roofTop - 1.8} ${center + frontHalf * 0.56} ${roofTop + 1.1}`,
    `L ${center + roofHalf} ${shoulderY + 1.2}`,
    `L ${center + rearHalf} ${rearY}`,
    `Q ${center} ${rearY + 4.1} ${center - rearHalf} ${rearY}`,
    `L ${center - roofHalf} ${shoulderY + 1.2}`,
    'Z',
  ].join(' ');
}

function buildWindshieldPath(icon: MapCarIconDefinition, traits: BodyTraits): string {
  const center = 60 + icon.cabinShift;
  const roofTop = icon.bodyTop + 18;
  const topY = roofTop + 1.8;
  const baseY = roofTop + 14.2;
  const topHalf = Math.max(5.8, (icon.midWidth / 2) * traits.roofBridge - icon.roofInset * 0.2);
  const baseHalf = Math.max(10.2, (icon.midWidth / 2) * traits.greenhouseFront - icon.roofInset * 0.12);

  return [
    `M ${center - topHalf} ${topY}`,
    `Q ${center} ${topY - 2.2} ${center + topHalf} ${topY}`,
    `L ${center + baseHalf} ${baseY}`,
    `Q ${center} ${baseY + 2.2} ${center - baseHalf} ${baseY}`,
    'Z',
  ].join(' ');
}

function buildRearGlassPath(icon: MapCarIconDefinition, traits: BodyTraits): string {
  const center = 60 + icon.cabinShift;
  const roofTop = icon.bodyTop + 18;
  const topY = roofTop + icon.roofLength - 4.8;
  const bottomY = roofTop + icon.roofLength + 10.2;
  const topHalf = Math.max(9.4, (icon.midWidth / 2) * traits.greenhouseRear - icon.roofInset * 0.12);
  const bottomHalf = Math.max(6.2, (icon.midWidth / 2) * traits.roofBridge - icon.roofInset * 0.18);

  return [
    `M ${center - topHalf} ${topY}`,
    `Q ${center} ${topY - 1.6} ${center + topHalf} ${topY}`,
    `L ${center + bottomHalf} ${bottomY}`,
    `Q ${center} ${bottomY + 1.4} ${center - bottomHalf} ${bottomY}`,
    'Z',
  ].join(' ');
}

function buildRoofPanelPath(icon: MapCarIconDefinition, traits: BodyTraits): string {
  const center = 60 + icon.cabinShift;
  const roofTop = icon.bodyTop + 18;
  const styleScale = icon.roofStyle === 'glass' ? 0.76 : icon.roofStyle === 'split' ? 0.64 : 1;
  const topY = roofTop + 8.6;
  const midY = roofTop + icon.roofLength * 0.48 + 8;
  const bottomY = roofTop + icon.roofLength + 4.6;
  const topHalf = Math.max(6.2, ((icon.midWidth / 2) * traits.roofBridge - icon.roofInset * 0.12) * styleScale);
  const midHalf = Math.max(topHalf + 1.4, ((icon.midWidth / 2) * (traits.roofBridge + 0.04) - icon.roofInset * 0.1) * styleScale);
  const bottomHalf = Math.max(5.8, ((icon.midWidth / 2) * (traits.roofBridge - 0.02) - icon.roofInset * 0.16) * styleScale);

  return [
    `M ${center - topHalf} ${topY}`,
    `Q ${center} ${topY - 2.4} ${center + topHalf} ${topY}`,
    `L ${center + midHalf} ${midY}`,
    `L ${center + bottomHalf} ${bottomY}`,
    `Q ${center} ${bottomY + 2.2} ${center - bottomHalf} ${bottomY}`,
    `L ${center - midHalf} ${midY}`,
    'Z',
  ].join(' ');
}

function buildHighlightPath(icon: MapCarIconDefinition, traits: BodyTraits): string {
  const top = icon.bodyTop + 4;
  const bottom = icon.bodyTop + traits.highlightDepth;
  const topHalf = Math.max(8, icon.frontWidth * 0.16);
  const midHalf = Math.max(13, icon.midWidth * 0.28);
  return [
    `M ${60 - topHalf} ${top + 1.2}`,
    `L ${60 + topHalf} ${top + 1.2}`,
    `L ${60 + midHalf} ${bottom}`,
    `L ${60 + midHalf - 5.5} ${bottom + 8.6}`,
    `L ${60 - midHalf + 5.5} ${bottom + 8.6}`,
    `L ${60 - midHalf} ${bottom}`,
    'Z',
  ].join(' ');
}

function buildHoodPath(icon: MapCarIconDefinition): string {
  const center = 60;
  const top = icon.bodyTop + 2.5;
  const bottom = icon.bodyTop + icon.hoodLength + 14;
  const topHalf = Math.max(5.5, icon.frontWidth * 0.14);
  const shoulderHalf = Math.max(13, icon.midWidth * 0.21);

  return [
    `M ${center - topHalf} ${top + 1.2}`,
    `L ${center + topHalf} ${top + 1.2}`,
    `L ${center + shoulderHalf} ${bottom - 2}`,
    `L ${center - shoulderHalf} ${bottom - 2}`,
    'Z',
  ].join(' ');
}

function buildRearDeckPath(icon: MapCarIconDefinition): string {
  const center = 60;
  const bodyBottom = icon.bodyTop + icon.bodyLength;
  const top = bodyBottom - icon.rearDeckLength - 7;
  const bottom = bodyBottom - 2.5;
  const shoulderHalf = Math.max(13, icon.midWidth * 0.19);
  const tailHalf = Math.max(7.5, icon.rearWidth * 0.16);

  return [
    `M ${center - shoulderHalf + 2.2} ${top}`,
    `L ${center + shoulderHalf - 2.2} ${top}`,
    `L ${center + tailHalf} ${bottom}`,
    `L ${center - tailHalf} ${bottom}`,
    'Z',
  ].join(' ');
}

function renderAccent(icon: MapCarIconDefinition): React.ReactNode {
  const bodyBottom = icon.bodyTop + icon.bodyLength;

  switch (icon.accentStyle) {
    case 'center-stripe':
      return <rect x="55" y={icon.bodyTop + 8} width="10" height={icon.bodyLength - 16} rx="5" fill={icon.accentColor} opacity="0.26" />;
    case 'double-stripe':
      return (
        <>
          <rect x="48" y={icon.bodyTop + 8} width="6" height={icon.bodyLength - 16} rx="3" fill={icon.accentColor} opacity="0.28" />
          <rect x="66" y={icon.bodyTop + 8} width="6" height={icon.bodyLength - 16} rx="3" fill={icon.accentColor} opacity="0.28" />
        </>
      );
    case 'split-tone':
      return <path d={`M 60 ${icon.bodyTop + 2} L 86 ${icon.bodyTop + 18} L 86 ${bodyBottom - 10} L 60 ${bodyBottom - 4} Z`} fill={icon.accentColor} opacity="0.18" />;
    case 'sweep':
      return <path d={`M 34 ${bodyBottom - 18} C 52 ${bodyBottom - 34}, 68 ${icon.bodyTop + 30}, 84 ${icon.bodyTop + 18} L 89 ${icon.bodyTop + 20} C 74 ${icon.bodyTop + 36}, 58 ${bodyBottom - 14}, 40 ${bodyBottom - 6} Z`} fill={icon.accentColor} opacity="0.2" />;
    case 'bolt':
      return <path d={`M 49 ${icon.bodyTop + 18} L 65 ${icon.bodyTop + 32} L 58 ${icon.bodyTop + 32} L 70 ${bodyBottom - 24} L 51 ${bodyBottom - 40} L 58 ${bodyBottom - 40} Z`} fill={icon.accentColor} opacity="0.24" />;
    case 'halo':
      return (
        <>
          <rect x="40" y={icon.bodyTop + 10} width="40" height="6" rx="3" fill={icon.accentColor} opacity="0.2" />
          <rect x="38" y={bodyBottom - 16} width="44" height="6" rx="3" fill={icon.accentColor} opacity="0.18" />
        </>
      );
  }
}

function renderRoof(
  icon: MapCarIconDefinition,
  windowPath: string,
  windshieldPath: string,
  rearGlassPath: string,
  roofPanelPath: string,
  glassFill: string,
): React.ReactNode {
  const roofTop = icon.bodyTop + 21;
  const roofPanelFill = icon.roofStyle === 'glass' ? 'rgba(255,255,255,0.12)' : icon.bodyColor;
  const roofPanelOpacity = icon.roofStyle === 'glass' ? 0.5 : icon.roofStyle === 'split' ? 0.88 : 0.94;

  switch (icon.roofStyle) {
    case 'glass':
      return (
        <>
          <path d={windowPath} fill="rgba(5,8,14,0.22)" opacity="0.72" />
          <path d={windshieldPath} fill={glassFill} opacity="0.98" />
          <path d={rearGlassPath} fill={glassFill} opacity="0.88" />
          <path d={roofPanelPath} fill={roofPanelFill} opacity={roofPanelOpacity} stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
          <path d={roofPanelPath} fill="none" stroke="rgba(0,0,0,0.16)" strokeWidth="0.85" />
        </>
      );
    case 'sunroof':
      return (
        <>
          <path d={windowPath} fill="rgba(5,8,14,0.22)" opacity="0.72" />
          <path d={windshieldPath} fill={glassFill} opacity="0.98" />
          <path d={rearGlassPath} fill={glassFill} opacity="0.86" />
          <path d={roofPanelPath} fill={roofPanelFill} opacity={roofPanelOpacity} stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
          <path d={roofPanelPath} fill="none" stroke="rgba(0,0,0,0.16)" strokeWidth="0.85" />
          <rect x={60 + icon.cabinShift - 9.5} y={roofTop + 10} width="19" height="13" rx="6.5" fill="rgba(8,12,22,0.52)" stroke="rgba(255,255,255,0.14)" strokeWidth="1.1" />
        </>
      );
    case 'rack':
      return (
        <>
          <path d={windowPath} fill="rgba(5,8,14,0.22)" opacity="0.72" />
          <path d={windshieldPath} fill={glassFill} opacity="0.98" />
          <path d={rearGlassPath} fill={glassFill} opacity="0.86" />
          <path d={roofPanelPath} fill={roofPanelFill} opacity={roofPanelOpacity} stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
          <path d={roofPanelPath} fill="none" stroke="rgba(0,0,0,0.16)" strokeWidth="0.85" />
          <path d={`M ${60 + icon.cabinShift - 18} ${roofTop + 8} H ${60 + icon.cabinShift + 18}`} stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
          <path d={`M ${60 + icon.cabinShift - 18} ${roofTop + 23} H ${60 + icon.cabinShift + 18}`} stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case 'solid':
      return (
        <>
          <path d={windowPath} fill="rgba(5,8,14,0.22)" opacity="0.72" />
          <path d={windshieldPath} fill={glassFill} opacity="0.98" />
          <path d={rearGlassPath} fill={glassFill} opacity="0.84" />
          <path d={roofPanelPath} fill={roofPanelFill} opacity={roofPanelOpacity} stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
          <path d={roofPanelPath} fill="none" stroke="rgba(0,0,0,0.16)" strokeWidth="0.85" />
          <path d={roofPanelPath} fill="rgba(255,255,255,0.04)" opacity="0.45" />
        </>
      );
    case 'split':
      return (
        <>
          <path d={windowPath} fill="rgba(5,8,14,0.22)" opacity="0.72" />
          <path d={windshieldPath} fill={glassFill} opacity="0.98" />
          <path d={rearGlassPath} fill={glassFill} opacity="0.86" />
          <path d={roofPanelPath} fill={roofPanelFill} opacity={roofPanelOpacity} stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
          <path d={roofPanelPath} fill="none" stroke="rgba(0,0,0,0.16)" strokeWidth="0.85" />
          <path d={`M ${60 + icon.cabinShift} ${roofTop + 6} V ${roofTop + icon.roofLength + 5}`} stroke="rgba(255,255,255,0.2)" strokeWidth="1.8" strokeLinecap="round" />
        </>
      );
  }
}

function renderWheel(x: number, y: number, width: number, height: number, icon: MapCarIconDefinition): React.ReactNode {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const rimColor = icon.wheelStyle === 'glow' ? icon.accentColor : 'rgba(255,255,255,0.44)';
  return (
    <g>
      <rect x={x - 0.7} y={y - 0.7} width={width + 1.4} height={height + 1.4} rx={(width + 1.4) / 2} fill="rgba(0,0,0,0.18)" />
      <rect x={x} y={y} width={width} height={height} rx={width / 2} fill={icon.wheelColor} />
      <rect x={x + 1.2} y={y + 1.6} width={width - 2.4} height={height - 3.2} rx={(width - 2.4) / 2} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
      <rect x={x + 2.1} y={y + 3} width={width - 4.2} height={height - 6} rx={(width - 4.2) / 2} fill="rgba(18,22,30,0.92)" stroke={rimColor} strokeWidth="1" />
      {icon.wheelStyle === 'turbine' && (
        <>
          <path d={`M ${centerX} ${y + 3.5} V ${y + height - 3.5}`} stroke={rimColor} strokeWidth="1" strokeLinecap="round" />
          <path d={`M ${x + 3.1} ${centerY} H ${x + width - 3.1}`} stroke={rimColor} strokeWidth="1" strokeLinecap="round" />
        </>
      )}
      {icon.wheelStyle === 'classic' && <circle cx={centerX} cy={centerY} r="1.9" fill={rimColor} />}
      {icon.wheelStyle === 'rally' && (
        <>
          <path d={`M ${x + 2.5} ${centerY} H ${x + width - 2.5}`} stroke={rimColor} strokeWidth="1.1" strokeLinecap="round" />
          <path d={`M ${centerX} ${y + 3.2} V ${y + height - 3.2}`} stroke={rimColor} strokeWidth="0.9" strokeLinecap="round" opacity="0.8" />
        </>
      )}
      {icon.wheelStyle === 'street' && <path d={`M ${x + 3.1} ${centerY} H ${x + width - 3.1}`} stroke={rimColor} strokeWidth="0.95" strokeLinecap="round" opacity="0.75" />}
      <circle cx={centerX} cy={centerY} r="1.15" fill={rimColor} opacity="0.92" />
      {icon.wheelStyle === 'glow' && <rect x={x - 1.1} y={y - 1.1} width={width + 2.2} height={height + 2.2} rx={(width + 2.2) / 2} fill="none" stroke={icon.glowColor} strokeWidth="1.1" opacity="0.55" />}
    </g>
  );
}

function renderLamps(lampStyle: MapCarLampStyle, color: string, y: number): React.ReactNode {
  const coreColor = color === '#ff6470' ? '#ffe5e9' : '#ffffff';
  const glowOpacity = color === '#ff6470' ? 0.34 : 0.22;

  switch (lampStyle) {
    case 'round':
      return (
        <>
          <circle cx="49" cy={y} r="4.2" fill={color} opacity={glowOpacity} />
          <circle cx="71" cy={y} r="4.2" fill={color} opacity={glowOpacity} />
          <circle cx="49" cy={y} r="2.5" fill={color} />
          <circle cx="71" cy={y} r="2.5" fill={color} />
          <circle cx="49" cy={y} r="0.9" fill={coreColor} opacity="0.95" />
          <circle cx="71" cy={y} r="0.9" fill={coreColor} opacity="0.95" />
        </>
      );
    case 'thin':
      return (
        <>
          <rect x="42" y={y - 2.4} width="15" height="4.8" rx="2.4" fill={color} opacity={glowOpacity} />
          <rect x="63" y={y - 2.4} width="15" height="4.8" rx="2.4" fill={color} opacity={glowOpacity} />
          <rect x="44" y={y - 1.1} width="11" height="2.2" rx="1.1" fill={color} />
          <rect x="65" y={y - 1.1} width="11" height="2.2" rx="1.1" fill={color} />
          <rect x="47" y={y - 0.5} width="5" height="1" rx="0.5" fill={coreColor} opacity="0.9" />
          <rect x="68" y={y - 0.5} width="5" height="1" rx="0.5" fill={coreColor} opacity="0.9" />
        </>
      );
    case 'blade':
      return (
        <>
          <path d={`M 41 ${y} Q 48 ${y - 4.1} 57 ${y - 0.9} L 57 ${y + 1.8} Q 48 ${y + 0.8} 41 ${y + 3.1} Z`} fill={color} opacity={glowOpacity} />
          <path d={`M 79 ${y} Q 72 ${y - 4.1} 63 ${y - 0.9} L 63 ${y + 1.8} Q 72 ${y + 0.8} 79 ${y + 3.1} Z`} fill={color} opacity={glowOpacity} />
          <path d={`M 43 ${y} Q 48 ${y - 2.8} 55.5 ${y - 0.7} L 55.5 ${y + 1} Q 48 ${y + 0.4} 43 ${y + 1.9} Z`} fill={color} />
          <path d={`M 77 ${y} Q 72 ${y - 2.8} 64.5 ${y - 0.7} L 64.5 ${y + 1} Q 72 ${y + 0.4} 77 ${y + 1.9} Z`} fill={color} />
        </>
      );
    case 'stacked':
      return (
        <>
          <rect x="43" y={y - 4.8} width="11" height="3.8" rx="1.9" fill={color} opacity={glowOpacity} />
          <rect x="43" y={y + 0.2} width="11" height="3.8" rx="1.9" fill={color} opacity={glowOpacity} />
          <rect x="66" y={y - 4.8} width="11" height="3.8" rx="1.9" fill={color} opacity={glowOpacity} />
          <rect x="66" y={y + 0.2} width="11" height="3.8" rx="1.9" fill={color} opacity={glowOpacity} />
          <rect x="44.5" y={y - 3.9} width="8" height="2.1" rx="1.05" fill={color} />
          <rect x="44.5" y={y + 1.1} width="8" height="2.1" rx="1.05" fill={color} />
          <rect x="67.5" y={y - 3.9} width="8" height="2.1" rx="1.05" fill={color} />
          <rect x="67.5" y={y + 1.1} width="8" height="2.1" rx="1.05" fill={color} />
        </>
      );
  }
}

function getWheelPairX(trackWidth: number, wheelWidth: number, wheelInset: number): { left: number; right: number } {
  const center = 60;
  const trackHalf = trackWidth / 2 + wheelInset * 0.14;
  const left = center - trackHalf - wheelWidth * 0.56;
  const right = center + trackHalf - wheelWidth * 0.44;
  return { left, right };
}

function renderMirrors(icon: MapCarIconDefinition, y: number): React.ReactNode {
  const offset = icon.midWidth / 2 + icon.mirrorOffset;
  const size = icon.mirrorSize;
  return (
    <>
      <path d={`M ${60 - offset} ${y} L ${60 - offset - size} ${y + 2.4} L ${60 - offset - size * 0.4} ${y + 4.1} Z`} fill="rgba(255,255,255,0.24)" stroke="rgba(0,0,0,0.2)" strokeWidth="0.9" />
      <path d={`M ${60 + offset} ${y} L ${60 + offset + size} ${y + 2.4} L ${60 + offset + size * 0.4} ${y + 4.1} Z`} fill="rgba(255,255,255,0.24)" stroke="rgba(0,0,0,0.2)" strokeWidth="0.9" />
    </>
  );
}

function renderWheelArchShadows(
  frontWheels: { left: number; right: number },
  rearWheels: { left: number; right: number },
  frontWheelY: number,
  rearWheelY: number,
  wheelWidth: number,
): React.ReactNode {
  const renderArch = (x: number, y: number, highlightOpacity: number) => (
    <>
      <path d={`M ${x + 0.8} ${y + 2.3} Q ${x + wheelWidth / 2} ${y - 4.1} ${x + wheelWidth - 0.8} ${y + 2.3}`} stroke="rgba(0,0,0,0.24)" strokeWidth="2.1" strokeLinecap="round" fill="none" />
      <path d={`M ${x + 1.5} ${y + 4.6} Q ${x + wheelWidth / 2} ${y - 1.2} ${x + wheelWidth - 1.5} ${y + 4.6}`} stroke="rgba(255,255,255,0.08)" strokeWidth="0.95" strokeLinecap="round" fill="none" opacity={highlightOpacity} />
    </>
  );

  return (
    <>
      {renderArch(frontWheels.left, frontWheelY, 0.42)}
      {renderArch(frontWheels.right, frontWheelY, 0.42)}
      {renderArch(rearWheels.left, rearWheelY, 0.5)}
      {renderArch(rearWheels.right, rearWheelY, 0.5)}
    </>
  );
}

export const MapCarIcon = React.memo(function MapCarIcon({
  iconId,
  size = 88,
  heading = 0,
  animated = true,
  showPulse = false,
  className,
}: MapCarIconProps) {
  const icon = React.useMemo(() => getMapIconById(iconId) ?? getMapIconByIndex(0), [iconId]);
  const clipPathId = React.useId();
  const bodySheenId = `${clipPathId}-body-sheen`;
  const bodyBloomId = `${clipPathId}-body-bloom`;
  const glassFillId = `${clipPathId}-glass-fill`;
  const traits = React.useMemo(() => getBodyTraits(icon), [icon]);
  const bodyPath = React.useMemo(() => buildBodyPath(icon, traits), [icon, traits]);
  const windowPath = React.useMemo(() => buildWindowPath(icon, traits), [icon, traits]);
  const windshieldPath = React.useMemo(() => buildWindshieldPath(icon, traits), [icon, traits]);
  const rearGlassPath = React.useMemo(() => buildRearGlassPath(icon, traits), [icon, traits]);
  const roofPanelPath = React.useMemo(() => buildRoofPanelPath(icon, traits), [icon, traits]);
  const highlightPath = React.useMemo(() => buildHighlightPath(icon, traits), [icon, traits]);
  const hoodPath = React.useMemo(() => buildHoodPath(icon), [icon]);
  const rearDeckPath = React.useMemo(() => buildRearDeckPath(icon), [icon]);
  const motionConfig = ICON_MOTION[icon.animation];
  const bodyBottom = icon.bodyTop + icon.bodyLength;
  const frontAxleY = icon.bodyTop + icon.hoodLength + 9;
  const rearAxleY = bodyBottom - icon.rearDeckLength - 4;
  const wheelWidth = icon.wheelStyle === 'rally' ? 12.5 : 10.5;
  const frontWheelY = frontAxleY - icon.wheelLength / 2;
  const rearWheelY = rearAxleY - icon.wheelLength / 2;
  const frontWheels = getWheelPairX(icon.frontWidth + icon.fenderBulge * 0.7, wheelWidth, icon.wheelInset);
  const rearWheels = getWheelPairX(icon.rearWidth + icon.fenderBulge * 0.65, wheelWidth, icon.wheelInset);
  const shoulderY = icon.bodyTop + icon.hoodLength * 0.82;
  const sillTopY = bodyBottom - traits.rockerDepth - 3;
  const rearLampY = bodyBottom - 6.5;
  const frontLampY = icon.bodyTop + 6.5;
  const sideWindowGuideStartHalf = icon.midWidth / 2 - icon.roofInset * 0.55;
  const sideWindowGuideEndHalf = icon.midWidth / 2 - icon.roofInset * 0.92;

  return (
    <div
      aria-label={icon.name}
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: size, height: size, transform: `rotate(${heading ?? 0}deg)` }}
    >
      {showPulse && (
        <motion.div
          animate={{ scale: [0.8, 1.3], opacity: [0.28, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut' }}
          className="absolute inset-[12%] rounded-full blur-xl"
          style={{ backgroundColor: icon.glowColor }}
        />
      )}

      <motion.div
        animate={animated ? motionConfig.animate : undefined}
        transition={animated ? { repeat: Infinity, duration: motionConfig.duration, ease: 'easeInOut' } : undefined}
        className="relative h-full w-full"
      >
        <svg
          viewBox="0 0 120 120"
          className="h-full w-full"
          style={{ filter: `drop-shadow(0 16px 18px ${icon.shadowColor})` }}
        >
          <defs>
            <clipPath id={clipPathId}>
              <path d={bodyPath} />
            </clipPath>
            <linearGradient id={bodySheenId} x1="28" y1={icon.bodyTop} x2="90" y2={bodyBottom} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.26" />
              <stop offset="26%" stopColor="#ffffff" stopOpacity="0.06" />
              <stop offset="60%" stopColor="#000000" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
            </linearGradient>
            <radialGradient id={bodyBloomId} cx="50%" cy="24%" r="64%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
              <stop offset="48%" stopColor="#ffffff" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.14" />
            </radialGradient>
            <linearGradient id={glassFillId} x1="60" y1={icon.bodyTop + 18} x2="60" y2={icon.bodyTop + icon.roofLength + 32} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
              <stop offset="15%" stopColor={icon.glassColor} stopOpacity="0.98" />
              <stop offset="72%" stopColor={icon.glassColor} stopOpacity="0.88" />
              <stop offset="100%" stopColor="#06080d" stopOpacity="0.64" />
            </linearGradient>
          </defs>

          <ellipse cx="60" cy="103" rx="23" ry="7" fill="rgba(0,0,0,0.26)" />
          <ellipse cx="60" cy="64" rx="31" ry="30" fill={icon.glowColor} opacity={icon.animation === 'pulse' ? 0.16 : 0.08} />

          {renderWheel(frontWheels.left, frontWheelY, wheelWidth, icon.wheelLength, icon)}
          {renderWheel(frontWheels.right, frontWheelY, wheelWidth, icon.wheelLength, icon)}
          {renderWheel(rearWheels.left, rearWheelY, wheelWidth, icon.wheelLength, icon)}
          {renderWheel(rearWheels.right, rearWheelY, wheelWidth, icon.wheelLength, icon)}

          <path d={bodyPath} fill={icon.bodyColor} stroke="rgba(255,255,255,0.16)" strokeWidth="2.1" />
          <path d={bodyPath} fill={`url(#${bodySheenId})`} opacity="0.95" />
          <path d={bodyPath} fill={`url(#${bodyBloomId})`} opacity="0.7" />

          <g clipPath={`url(#${clipPathId})`}>
            {renderAccent(icon)}
            <path d={hoodPath} fill="rgba(255,255,255,0.08)" />
            <path d={rearDeckPath} fill="rgba(255,255,255,0.06)" />
            <path d={highlightPath} fill="rgba(255,255,255,0.06)" />
            <path d={hoodPath} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.1" />
            <path d={rearDeckPath} fill="none" stroke="rgba(255,255,255,0.11)" strokeWidth="1.05" />
            {renderWheelArchShadows(frontWheels, rearWheels, frontWheelY, rearWheelY, wheelWidth)}
            <path d={`M 28 ${sillTopY} C 42 ${bodyBottom - 2}, 78 ${bodyBottom - 2}, 92 ${sillTopY} L 92 ${bodyBottom + 8} L 28 ${bodyBottom + 8} Z`} fill="rgba(0,0,0,0.12)" />
          </g>

          <path d={`M 60 ${icon.bodyTop + 9} V ${bodyBottom - 10}`} stroke="rgba(255,255,255,0.14)" strokeWidth="1.2" strokeLinecap="round" />
          <path d={`M 44 ${icon.bodyTop + icon.hoodLength * 0.74} Q 60 ${icon.bodyTop + icon.hoodLength * 0.52} 76 ${icon.bodyTop + icon.hoodLength * 0.74}`} stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" fill="none" />
          <path d={`M 45 ${bodyBottom - icon.rearDeckLength * 0.66} Q 60 ${bodyBottom - icon.rearDeckLength * 0.34} 75 ${bodyBottom - icon.rearDeckLength * 0.66}`} stroke="rgba(255,255,255,0.11)" strokeWidth="1.4" fill="none" />
          <path d={`M 42 ${frontAxleY} Q 30 ${frontAxleY} 30 ${frontAxleY + 7}`} stroke="rgba(255,255,255,0.12)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          <path d={`M 78 ${frontAxleY} Q 90 ${frontAxleY} 90 ${frontAxleY + 7}`} stroke="rgba(255,255,255,0.12)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          <path d={`M 42 ${rearAxleY - 7} Q 30 ${rearAxleY} 30 ${rearAxleY + 7}`} stroke="rgba(255,255,255,0.12)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          <path d={`M 78 ${rearAxleY - 7} Q 90 ${rearAxleY} 90 ${rearAxleY + 7}`} stroke="rgba(255,255,255,0.12)" strokeWidth="1.6" strokeLinecap="round" fill="none" />

          {icon.sideVent && (
            <>
              <path d={`M 34 ${shoulderY + 12} L 38 ${shoulderY + 18}`} stroke="rgba(0,0,0,0.26)" strokeWidth="1.8" strokeLinecap="round" />
              <path d={`M 86 ${shoulderY + 12} L 82 ${shoulderY + 18}`} stroke="rgba(0,0,0,0.26)" strokeWidth="1.8" strokeLinecap="round" />
            </>
          )}

          {icon.splitter && <rect x="48" y={icon.bodyTop + 2.2} width="24" height="3.1" rx="1.55" fill="rgba(0,0,0,0.22)" />}
          {icon.diffuser && <rect x="44.5" y={bodyBottom - 3.2} width="31" height="3.6" rx="1.8" fill="rgba(0,0,0,0.26)" />}

          {renderMirrors(icon, shoulderY - 0.5)}
          {renderRoof(icon, windowPath, windshieldPath, rearGlassPath, roofPanelPath, `url(#${glassFillId})`)}
          <path d={windowPath} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.1" />
          <path d={windshieldPath} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="0.95" />
          <path d={rearGlassPath} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.9" />
          <path d={roofPanelPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.75" />
          <path d={`M ${60 + icon.cabinShift - sideWindowGuideStartHalf} ${icon.bodyTop + 33} L ${60 + icon.cabinShift - sideWindowGuideEndHalf} ${icon.bodyTop + icon.roofLength + 22}`} stroke="rgba(255,255,255,0.08)" strokeWidth="0.9" strokeLinecap="round" />
          <path d={`M ${60 + icon.cabinShift + sideWindowGuideStartHalf} ${icon.bodyTop + 33} L ${60 + icon.cabinShift + sideWindowGuideEndHalf} ${icon.bodyTop + icon.roofLength + 22}`} stroke="rgba(255,255,255,0.08)" strokeWidth="0.9" strokeLinecap="round" />

          {renderLamps(icon.lampStyle, 'rgba(255,255,255,0.94)', frontLampY)}
          {renderLamps(icon.lampStyle, '#ff6470', rearLampY)}

          {icon.spoiler && (
            <path d={`M 44 ${bodyBottom - 2} Q 60 ${bodyBottom + 5} 76 ${bodyBottom - 2}`} stroke={icon.accentColor} strokeWidth="2.6" strokeLinecap="round" fill="none" opacity="0.75" />
          )}

          <path d={bodyPath} fill="none" stroke="rgba(0,0,0,0.14)" strokeWidth="1.8" />
        </svg>
      </motion.div>
    </div>
  );
});
