import { Capacitor, registerPlugin } from '@capacitor/core';

export interface NativeMonitorConfig {
  enabled: boolean;
  thresholdKph: number;
  cooldownSeconds: number;
  strictAutoOpen: boolean;
  isDeviceOwner: boolean;
  isDefaultLauncher: boolean;
}

export interface NativeMonitorStatusSummary {
  label: string;
  detail: string;
  tone: 'healthy' | 'warning' | 'inactive';
}

interface NativeMonitorPlugin {
  getConfig(): Promise<NativeMonitorConfig>;
  setConfig(config: Partial<NativeMonitorConfig>): Promise<NativeMonitorConfig>;
  requestPermissions(): Promise<void>;
  openHomeSettings(): Promise<void>;
  openAppSettings(): Promise<void>;
}

const NativeMonitor = registerPlugin<NativeMonitorPlugin>('NativeMonitor');

const WEB_STORAGE_KEY = 'velocityos_native_monitor_web_config';
const IS_ANDROID_NATIVE = Capacitor.getPlatform() === 'android';

export const NATIVE_MONITOR_LIMITS = {
  threshold: { min: 10, max: 240 },
  cooldown: { min: 3, max: 900 },
};

const DEFAULT_CONFIG: NativeMonitorConfig = {
  enabled: false,
  thresholdKph: 40,
  cooldownSeconds: 15,
  strictAutoOpen: false,
  isDeviceOwner: false,
  isDefaultLauncher: false,
};

function clampThreshold(value: number): number {
  return Math.max(NATIVE_MONITOR_LIMITS.threshold.min, Math.min(NATIVE_MONITOR_LIMITS.threshold.max, value));
}

function clampCooldown(value: number): number {
  return Math.max(NATIVE_MONITOR_LIMITS.cooldown.min, Math.min(NATIVE_MONITOR_LIMITS.cooldown.max, value));
}

function normalizeConfig(config: Partial<NativeMonitorConfig> | null | undefined): NativeMonitorConfig {
  const threshold = Number(config?.thresholdKph);
  const cooldown = Number(config?.cooldownSeconds);

  return {
    enabled: typeof config?.enabled === 'boolean' ? config.enabled : DEFAULT_CONFIG.enabled,
    thresholdKph: Number.isFinite(threshold) ? clampThreshold(threshold) : DEFAULT_CONFIG.thresholdKph,
    cooldownSeconds: Number.isFinite(cooldown) ? clampCooldown(Math.round(cooldown)) : DEFAULT_CONFIG.cooldownSeconds,
    strictAutoOpen: typeof config?.strictAutoOpen === 'boolean' ? config.strictAutoOpen : DEFAULT_CONFIG.strictAutoOpen,
    isDeviceOwner: Boolean(config?.isDeviceOwner),
    isDefaultLauncher: Boolean(config?.isDefaultLauncher),
  };
}

function readWebFallbackConfig(): NativeMonitorConfig {
  try {
    const raw = localStorage.getItem(WEB_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_CONFIG;
    }

    const parsed = JSON.parse(raw) as Partial<NativeMonitorConfig>;
    return normalizeConfig(parsed);
  } catch {
    return DEFAULT_CONFIG;
  }
}

function writeWebFallbackConfig(config: NativeMonitorConfig): void {
  localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(config));
}

export function isNativeMonitorPluginAvailable(): boolean {
  return IS_ANDROID_NATIVE;
}

export async function getNativeMonitorConfig(): Promise<NativeMonitorConfig> {
  if (!IS_ANDROID_NATIVE) {
    return readWebFallbackConfig();
  }

  try {
    const config = await NativeMonitor.getConfig();
    return normalizeConfig(config);
  } catch {
    return readWebFallbackConfig();
  }
}

export async function setNativeMonitorConfig(nextConfig: Partial<NativeMonitorConfig>): Promise<NativeMonitorConfig> {
  const payload: Partial<NativeMonitorConfig> = {};

  if (typeof nextConfig.enabled === 'boolean') {
    payload.enabled = nextConfig.enabled;
  }

  if (typeof nextConfig.strictAutoOpen === 'boolean') {
    payload.strictAutoOpen = nextConfig.strictAutoOpen;
  }

  if (typeof nextConfig.thresholdKph === 'number' && Number.isFinite(nextConfig.thresholdKph)) {
    payload.thresholdKph = clampThreshold(nextConfig.thresholdKph);
  }

  if (typeof nextConfig.cooldownSeconds === 'number' && Number.isFinite(nextConfig.cooldownSeconds)) {
    payload.cooldownSeconds = clampCooldown(Math.round(nextConfig.cooldownSeconds));
  }

  if (!IS_ANDROID_NATIVE) {
    const merged = normalizeConfig({ ...readWebFallbackConfig(), ...payload });
    writeWebFallbackConfig(merged);
    return merged;
  }

  try {
    const updated = await NativeMonitor.setConfig(payload);
    return normalizeConfig(updated);
  } catch {
    const merged = normalizeConfig({ ...readWebFallbackConfig(), ...payload });
    writeWebFallbackConfig(merged);
    return merged;
  }
}

export async function requestNativeMonitorPermissions(): Promise<boolean> {
  if (!IS_ANDROID_NATIVE) {
    return true;
  }

  try {
    await NativeMonitor.requestPermissions();
    return true;
  } catch {
    return false;
  }
}

export async function openNativeMonitorHomeSettings(): Promise<boolean> {
  if (!IS_ANDROID_NATIVE) {
    return false;
  }

  try {
    await NativeMonitor.openHomeSettings();
    return true;
  } catch {
    return false;
  }
}

export async function openNativeMonitorAppSettings(): Promise<boolean> {
  if (!IS_ANDROID_NATIVE) {
    return false;
  }

  try {
    await NativeMonitor.openAppSettings();
    return true;
  } catch {
    return false;
  }
}

export function summarizeNativeMonitorStatus(config: NativeMonitorConfig | null | undefined): NativeMonitorStatusSummary {
  if (!config) {
    return {
      label: 'Unavailable',
      detail: 'Background reminder configuration is unavailable right now.',
      tone: 'warning',
    };
  }

  if (!config.enabled) {
    return {
      label: 'Disabled',
      detail: 'Background speed reminders are turned off for this device.',
      tone: 'inactive',
    };
  }

  return {
    label: 'Ready',
    detail: `Background speed reminders are armed at ${Math.round(config.thresholdKph)} km/h with a ${config.cooldownSeconds}s cooldown.`,
    tone: 'healthy',
  };
}
