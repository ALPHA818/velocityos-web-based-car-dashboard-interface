export type TelemetryLevel = 'info' | 'warning' | 'error';

export type TelemetryEventType =
  | 'cold-start'
  | 'route-change'
  | 'route-failure'
  | 'screen-ready'
  | 'screen-slow'
  | 'permission-denied'
  | 'integration-launch'
  | 'integration-launch-failure'
  | 'bookmark-save'
  | 'bookmark-promote'
  | 'diagnostic';

export interface TelemetryEvent {
  id: string;
  type: TelemetryEventType;
  level: TelemetryLevel;
  message: string;
  route?: string;
  durationMs?: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface TelemetrySnapshot {
  total: number;
  errorCount: number;
  warningCount: number;
  recent: TelemetryEvent[];
  recentFailures: TelemetryEvent[];
  lastSlowScreen: TelemetryEvent | null;
  averageColdStartMs: number | null;
}

interface TimedTelemetryDetails {
  message: string;
  route?: string;
  metadata?: Record<string, unknown>;
  slowThresholdMs?: number;
  defaultType?: TelemetryEventType;
}

const TELEMETRY_STORAGE_KEY = 'velocityos_diagnostics_v1';
const TELEMETRY_UPDATE_EVENT = 'velocityos:telemetry-updated';
const MAX_TELEMETRY_EVENTS = 180;
const activeTimers = new Map<string, number>();

let coldStartReported = false;

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function emitTelemetryUpdate() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(TELEMETRY_UPDATE_EVENT));
}

function sanitizeMetadata(metadata?: Record<string, unknown>) {
  if (!metadata) return undefined;

  try {
    return JSON.parse(JSON.stringify(metadata)) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function writeTelemetryEvents(events: TelemetryEvent[]) {
  if (!canUseBrowserStorage()) return;
  window.localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(events));
}

export function readTelemetryEvents(): TelemetryEvent[] {
  if (!canUseBrowserStorage()) return [];

  try {
    const raw = window.localStorage.getItem(TELEMETRY_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as TelemetryEvent[];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((event) => typeof event?.id === 'string' && typeof event?.message === 'string');
  } catch {
    return [];
  }
}

export function clearTelemetryEvents() {
  if (!canUseBrowserStorage()) return;
  writeTelemetryEvents([]);
  emitTelemetryUpdate();
}

export function subscribeToTelemetryUpdates(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = () => callback();
  window.addEventListener(TELEMETRY_UPDATE_EVENT, handler as EventListener);

  return () => {
    window.removeEventListener(TELEMETRY_UPDATE_EVENT, handler as EventListener);
  };
}

export function recordTelemetryEvent(
  event: Omit<TelemetryEvent, 'id' | 'timestamp'> & { metadata?: Record<string, unknown> }
) {
  const nextEvent: TelemetryEvent = {
    ...event,
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    timestamp: Date.now(),
    metadata: sanitizeMetadata(event.metadata),
  };

  if (!canUseBrowserStorage()) {
    return nextEvent;
  }

  const existing = readTelemetryEvents();
  const nextEvents = [...existing, nextEvent].slice(-MAX_TELEMETRY_EVENTS);
  writeTelemetryEvents(nextEvents);
  emitTelemetryUpdate();
  return nextEvent;
}

export function startTelemetryTimer(key: string) {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  activeTimers.set(key, now);
}

export function finishTelemetryTimer(key: string, details: TimedTelemetryDetails) {
  const startedAt = activeTimers.get(key);
  if (startedAt == null) return null;

  const endedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
  activeTimers.delete(key);

  const durationMs = Math.max(0, Math.round(endedAt - startedAt));
  const slowThresholdMs = details.slowThresholdMs ?? 1200;
  const type = durationMs >= slowThresholdMs ? 'screen-slow' : (details.defaultType ?? 'screen-ready');
  const level: TelemetryLevel = type === 'screen-slow' ? 'warning' : 'info';

  recordTelemetryEvent({
    type,
    level,
    message: details.message,
    route: details.route,
    durationMs,
    metadata: details.metadata,
  });

  return durationMs;
}

export function reportColdStart(route?: string) {
  if (coldStartReported || typeof window === 'undefined') {
    return null;
  }

  coldStartReported = true;

  const navigationEntry = performance
    .getEntriesByType('navigation')
    .find((entry): entry is PerformanceNavigationTiming => entry instanceof PerformanceNavigationTiming);

  const durationMs = navigationEntry
    ? Math.round(navigationEntry.domInteractive || navigationEntry.responseEnd || performance.now())
    : Math.round(performance.now());

  recordTelemetryEvent({
    type: 'cold-start',
    level: 'info',
    message: 'Cold start completed',
    route,
    durationMs,
    metadata: navigationEntry
      ? {
          transferSize: navigationEntry.transferSize,
          encodedBodySize: navigationEntry.encodedBodySize,
          decodedBodySize: navigationEntry.decodedBodySize,
        }
      : undefined,
  });

  return durationMs;
}

export function getTelemetrySnapshot(limit = 6): TelemetrySnapshot {
  const events = readTelemetryEvents();
  const coldStarts = events.filter((event) => event.type === 'cold-start' && typeof event.durationMs === 'number');
  const averageColdStartMs = coldStarts.length
    ? Math.round(coldStarts.reduce((total, event) => total + (event.durationMs ?? 0), 0) / coldStarts.length)
    : null;

  return {
    total: events.length,
    errorCount: events.filter((event) => event.level === 'error').length,
    warningCount: events.filter((event) => event.level === 'warning').length,
    recent: events.slice(-limit).reverse(),
    recentFailures: events
      .filter((event) => event.level !== 'info' || event.type === 'route-failure' || event.type === 'integration-launch-failure')
      .slice(-limit)
      .reverse(),
    lastSlowScreen: [...events].reverse().find((event) => event.type === 'screen-slow') ?? null,
    averageColdStartMs,
  };
}