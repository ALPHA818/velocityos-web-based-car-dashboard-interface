import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AmbientEffectDefinition, ScenePackDefinition } from '@/lib/cosmetic-market';
import { cn } from '@/lib/utils';

interface DashboardBackdropProps {
  scene: ScenePackDefinition | null;
  effect: AmbientEffectDefinition | null;
  weatherCode?: number | null;
  charging?: boolean;
  parked?: boolean;
  compact?: boolean;
  showIdleLabel?: boolean;
  className?: string;
}

interface SceneBootOverlayProps {
  scene: ScenePackDefinition | null;
  visible: boolean;
}

function getWeatherTint(code: number | null | undefined) {
  if (typeof code !== 'number') return null;
  if (code === 0) {
    return 'radial-gradient(circle at 24% 18%, rgba(251,191,36,0.16), transparent 30%), linear-gradient(180deg, rgba(251,191,36,0.06), transparent 46%)';
  }
  if (code < 4) {
    return 'linear-gradient(180deg, rgba(148,163,184,0.06), transparent 55%)';
  }
  if (code < 70) {
    return 'linear-gradient(180deg, rgba(56,189,248,0.08), rgba(15,23,42,0.02))';
  }
  return 'linear-gradient(180deg, rgba(125,211,252,0.08), rgba(99,102,241,0.06))';
}

function getPatternBackground(scene: ScenePackDefinition | null) {
  if (!scene) return null;

  switch (scene.pattern) {
    case 'grid':
      return 'linear-gradient(transparent 0%, rgba(255,255,255,0.02) 100%), repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 56px), repeating-linear-gradient(180deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 56px)';
    case 'horizon':
      return 'linear-gradient(180deg, rgba(255,255,255,0.02), transparent 28%), repeating-linear-gradient(180deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 44px)';
    case 'contour':
      return 'repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 48px)';
    case 'storm':
      return 'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 72px), linear-gradient(180deg, rgba(255,255,255,0.05), transparent 34%)';
    case 'scan':
      return 'repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 20px)';
    case 'amber':
      return 'repeating-linear-gradient(90deg, rgba(251,146,60,0.06) 0 1px, transparent 1px 60px), repeating-linear-gradient(180deg, rgba(251,191,36,0.05) 0 1px, transparent 1px 32px)';
    default:
      return null;
  }
}

function renderAmbientEffect(effect: AmbientEffectDefinition | null, compact: boolean) {
  if (!effect || effect.kind === 'none') return null;

  switch (effect.kind) {
    case 'rain-runner':
      return Array.from({ length: compact ? 10 : 18 }).map((_, index) => (
        <motion.div
          key={`rain-${index}`}
          className="absolute top-[-20%] w-px rounded-full"
          style={{
            left: `${(index * 11) % 100}%`,
            height: compact ? 42 : 86,
            opacity: 0.42,
            background: `linear-gradient(180deg, transparent, ${effect.accent}, transparent)`,
            rotate: '10deg',
          }}
          animate={{ y: [-(compact ? 24 : 40), compact ? 148 : 360] }}
          transition={{
            duration: 0.9 + (index % 5) * 0.16,
            delay: (index % 6) * 0.12,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ));
    case 'snowfall':
      return Array.from({ length: compact ? 12 : 22 }).map((_, index) => (
        <motion.div
          key={`snow-${index}`}
          className="absolute rounded-full"
          style={{
            left: `${(index * 9 + 7) % 100}%`,
            top: compact ? -8 : -16,
            width: compact ? 3 : 5,
            height: compact ? 3 : 5,
            opacity: 0.55,
            backgroundColor: effect.accent,
          }}
          animate={{
            y: [0, compact ? 136 : 320],
            x: [0, index % 2 === 0 ? 8 : -8, 0],
          }}
          transition={{
            duration: 1.8 + (index % 4) * 0.28,
            delay: (index % 7) * 0.1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ));
    case 'neon-tunnel':
      return Array.from({ length: compact ? 3 : 5 }).map((_, index) => (
        <motion.div
          key={`ring-${index}`}
          className="absolute inset-1/2 rounded-full border"
          style={{
            width: compact ? 52 : 140,
            height: compact ? 52 : 140,
            marginLeft: compact ? -26 : -70,
            marginTop: compact ? -26 : -70,
            borderColor: index % 2 === 0 ? effect.accent : effect.secondary,
            opacity: 0.2,
          }}
          animate={{ scale: [0.72 + index * 0.14, 1.22 + index * 0.16], opacity: [0.32, 0] }}
          transition={{ duration: 2.4, delay: index * 0.34, repeat: Infinity, ease: 'easeOut' }}
        />
      ));
    case 'sunrise-haze':
      return (
        <>
          <motion.div
            className="absolute -left-10 top-8 rounded-full blur-3xl"
            style={{ width: compact ? 80 : 220, height: compact ? 80 : 220, backgroundColor: effect.accent, opacity: 0.24 }}
            animate={{ x: [0, compact ? 14 : 36, 0], y: [0, -8, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute right-0 bottom-0 rounded-full blur-3xl"
            style={{ width: compact ? 70 : 180, height: compact ? 70 : 180, backgroundColor: effect.secondary, opacity: 0.18 }}
            animate={{ x: [0, compact ? -12 : -28, 0], y: [0, 6, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      );
    case 'desert-heat':
      return Array.from({ length: compact ? 4 : 6 }).map((_, index) => (
        <motion.div
          key={`heat-${index}`}
          className="absolute inset-x-0 rounded-full blur-md"
          style={{
            top: `${22 + index * 12}%`,
            height: compact ? 8 : 14,
            opacity: 0.12,
            background: `linear-gradient(90deg, transparent, ${effect.accent}, transparent)`,
          }}
          animate={{ x: [0, index % 2 === 0 ? 10 : -10, 0], scaleX: [1, 1.04, 1] }}
          transition={{ duration: 2.2 + index * 0.18, repeat: Infinity, ease: 'easeInOut' }}
        />
      ));
    case 'city-night':
      return Array.from({ length: compact ? 3 : 5 }).map((_, index) => (
        <motion.div
          key={`city-${index}`}
          className="absolute bottom-5 rounded-full blur-sm"
          style={{
            left: compact ? -24 : -60,
            width: compact ? 36 : 120,
            height: compact ? 4 : 8,
            opacity: 0.2,
            background: `linear-gradient(90deg, transparent, ${index % 2 === 0 ? effect.accent : effect.secondary}, transparent)`,
          }}
          animate={{ x: [0, compact ? 170 : 520] }}
          transition={{ duration: 2.6 + index * 0.2, delay: index * 0.4, repeat: Infinity, ease: 'linear' }}
        />
      ));
    default:
      return null;
  }
}

export function DashboardBackdrop({
  scene,
  effect,
  weatherCode,
  charging = false,
  parked = false,
  compact = false,
  showIdleLabel = false,
  className,
}: DashboardBackdropProps) {
  const weatherTint = scene?.weatherReactive ? getWeatherTint(weatherCode) : null;
  const patternBackground = getPatternBackground(scene);

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div className="absolute inset-0" style={{ background: scene?.background ?? 'linear-gradient(145deg, rgba(2,6,23,0.98), rgba(15,23,42,0.96))' }} />
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background: `radial-gradient(circle at 18% 18%, ${scene?.accent ?? 'rgba(56,189,248,0.24)'} 0%, transparent 34%), radial-gradient(circle at 82% 82%, ${scene?.glow ?? 'rgba(59,130,246,0.16)'} 0%, transparent 42%)`,
        }}
      />
      {scene?.overlay && <div className="absolute inset-0 opacity-80" style={{ background: scene.overlay }} />}
      {patternBackground && <div className="absolute inset-0 opacity-40" style={{ background: patternBackground }} />}
      {weatherTint && <div className="absolute inset-0 opacity-50" style={{ background: weatherTint }} />}
      {renderAmbientEffect(effect, compact)}
      {charging && (
        <motion.div
          className="absolute inset-x-0 bottom-0 h-1/3"
          style={{
            background: `linear-gradient(180deg, transparent, ${scene?.accent ?? 'rgba(56,189,248,0.18)'})`,
            opacity: 0.16,
          }}
          animate={{ opacity: [0.1, 0.24, 0.1], y: [0, compact ? -3 : -6, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {parked && showIdleLabel && scene?.idleTitle && (
        <div
          className={cn(
            'absolute rounded-full border px-3 py-1 font-black uppercase tracking-[0.2em] text-white/80 backdrop-blur-xl',
            compact ? 'bottom-3 right-3 text-[8px]' : 'bottom-5 right-5 text-[10px]'
          )}
          style={{ borderColor: scene.accent, backgroundColor: 'rgba(2, 6, 23, 0.34)' }}
        >
          {scene.idleTitle}
        </div>
      )}
    </div>
  );
}

export function SceneBootOverlay({ scene, visible }: SceneBootOverlayProps) {
  return (
    <AnimatePresence>
      {visible && scene && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-hidden bg-black/72 backdrop-blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24 }}
        >
          <motion.div
            className="relative flex w-full max-w-xl flex-col items-center gap-3 rounded-[2rem] border px-8 py-10 text-center"
            style={{ borderColor: scene.accent, background: 'linear-gradient(145deg, rgba(2,6,23,0.88), rgba(15,23,42,0.7))' }}
            initial={{ scale: 0.95, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.98, y: 16 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            <div className="absolute inset-x-12 top-0 h-px" style={{ background: scene.accent }} />
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">Startup Scene</div>
            <div className="text-3xl font-black tracking-tight text-white">{scene.bootTitle}</div>
            <div className="max-w-md text-sm text-white/70">{scene.description}</div>
            <div className="grid w-full gap-2 pt-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Idle</div>
                <div className="mt-1 text-sm font-semibold text-white/80">{scene.idleTitle}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Charging</div>
                <div className="mt-1 text-sm font-semibold text-white/80">{scene.chargingTitle}</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}