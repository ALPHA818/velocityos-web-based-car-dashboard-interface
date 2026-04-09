import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, SettingsEntity, LocationEntity, TrackingEntity, RecentHistoryEntity, SearchHistoryEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { TrackingBreadcrumb, UserSettings, SavedLocation } from "@shared/types";

function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusMeters = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

function normalizeSettings(settings: Partial<UserSettings> | null | undefined): UserSettings {
  return {
    ...SettingsEntity.initialState,
    ...(settings ?? {}),
    id: 'default',
  };
}

export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // SETTINGS
  app.get('/api/settings', async (c) => {
    const entity = new SettingsEntity(c.env, 'default');
    const settings = normalizeSettings(await entity.getState());
    return ok(c, settings);
  });
  app.post('/api/settings', async (c) => {
    const data = await c.req.json<Partial<UserSettings>>();
    const entity = new SettingsEntity(c.env, 'default');
    const current = normalizeSettings(await entity.getState());
    const updated = normalizeSettings({ ...current, ...data });
    await entity.save(updated);
    return ok(c, updated);
  });
  // LOCATIONS
  app.get('/api/locations', async (c) => {
    const page = await LocationEntity.list(c.env);
    return ok(c, page);
  });
  app.post('/api/locations', async (c) => {
    const data = await c.req.json<SavedLocation>();
    const hasValidLabel = typeof data.label === 'string' && data.label.trim().length > 0;
    const hasValidLat = Number.isFinite(data.lat) && Math.abs(data.lat) <= 90;
    const hasValidLon = Number.isFinite(data.lon) && Math.abs(data.lon) <= 180;

    if (!hasValidLabel || !hasValidLat || !hasValidLon) {
      return bad(c, 'Invalid location data');
    }

    const id = data.id || crypto.randomUUID();
    const location = await LocationEntity.create(c.env, {
      ...data,
      id,
      label: data.label.trim(),
      address: typeof data.address === 'string' ? data.address.trim() : '',
    });
    return ok(c, location);
  });
  app.delete('/api/locations/:id', async (c) => {
    const deleted = await LocationEntity.delete(c.env, c.req.param('id'));
    return ok(c, { deleted });
  });
  // RECENT LOCATIONS
  app.get('/api/locations/recent', async (c) => {
    const entity = new RecentHistoryEntity(c.env, 'default');
    const state = await entity.getState();
    return ok(c, state);
  });
  app.post('/api/locations/recent', async (c) => {
    const data = await c.req.json<SavedLocation>();
    const entity = new RecentHistoryEntity(c.env, 'default');
    await entity.mutate(s => {
      const filtered = s.items.filter(i => i.id !== data.id);
      return { items: [data, ...filtered].slice(0, 10) };
    });
    return ok(c, { success: true });
  });
  app.delete('/api/locations/recent', async (c) => {
    const entity = new RecentHistoryEntity(c.env, 'default');
    await entity.save({ items: [] });
    return ok(c, { success: true });
  });
  // SEARCH HISTORY
  app.get('/api/search/history', async (c) => {
    const entity = new SearchHistoryEntity(c.env, 'default');
    const state = await entity.getState();
    return ok(c, state);
  });
  app.post('/api/search/history', async (c) => {
    const data = await c.req.json<SavedLocation>();
    const entity = new SearchHistoryEntity(c.env, 'default');
    await entity.mutate(s => {
      const filtered = s.items.filter(i => i.id !== data.id);
      return { items: [data, ...filtered].slice(0, 20) };
    });
    return ok(c, { success: true });
  });
  app.delete('/api/search/history', async (c) => {
    const entity = new SearchHistoryEntity(c.env, 'default');
    await entity.save({ items: [] });
    return ok(c, { success: true });
  });
  // TRACKING
  app.get('/api/tracking/:id', async (c) => {
    const entity = new TrackingEntity(c.env, c.req.param('id'));
    if (!await entity.exists()) return notFound(c, 'Tracking session not found');
    const state = await entity.getState();
    return ok(c, state);
  });
  app.post('/api/tracking/:id', async (c) => {
    const data = await c.req.json<Partial<{ lat: number; lon: number; speed: number; heading: number }>>();
    const entity = new TrackingEntity(c.env, c.req.param('id'));
    const now = Date.now();

    await entity.mutate((current) => {
      const hasLat = typeof data.lat === 'number' && Number.isFinite(data.lat);
      const hasLon = typeof data.lon === 'number' && Number.isFinite(data.lon);
      const nextLat = hasLat ? data.lat! : current.lat;
      const nextLon = hasLon ? data.lon! : current.lon;
      const nextSpeed = typeof data.speed === 'number' && Number.isFinite(data.speed) ? data.speed : current.speed;
      const nextHeading = typeof data.heading === 'number' && Number.isFinite(data.heading) ? data.heading : current.heading;
      const nextPath = [...(current.path ?? [])];
      let nextDistanceKm = current.distanceKm ?? 0;

      if (hasLat && hasLon) {
        const nextPoint: TrackingBreadcrumb = [nextLat, nextLon, now];
        const lastPoint = nextPath[nextPath.length - 1];

        if (!lastPoint) {
          nextPath.push(nextPoint);
        } else if (lastPoint[0] !== nextLat || lastPoint[1] !== nextLon) {
          const segmentMeters = haversineDistanceMeters(lastPoint[0], lastPoint[1], nextLat, nextLon);
          if (segmentMeters > 1 && segmentMeters < 250) {
            nextDistanceKm = Number((nextDistanceKm + segmentMeters / 1000).toFixed(3));
            nextPath.push(nextPoint);
          }
        }
      }

      const startedAt = current.startedAt || now;

      return {
        ...current,
        lat: nextLat,
        lon: nextLon,
        speed: nextSpeed,
        heading: nextHeading,
        lastUpdate: now,
        startedAt,
        durationMs: Math.max(0, now - startedAt),
        distanceKm: nextDistanceKm,
        path: nextPath,
      };
    });

    return ok(c, { success: true });
  });
  // SYSTEM
  app.post('/api/system/reset', async (c) => {
    const settingsEntity = new SettingsEntity(c.env, 'default');
    await settingsEntity.save(SettingsEntity.initialState);
    const locations = await LocationEntity.list(c.env);
    const ids = locations.items.map(l => l.id);
    if (ids.length > 0) {
      await LocationEntity.deleteMany(c.env, ids);
    }
    const recentEntity = new RecentHistoryEntity(c.env, 'default');
    await recentEntity.save({ items: [] });
    const searchHistoryEntity = new SearchHistoryEntity(c.env, 'default');
    await searchHistoryEntity.save({ items: [] });
    return ok(c, { reset: true });
  });
  app.get('/api/test', (c) => c.json({ success: true, data: { name: 'VelocityOS Backend' }}));
}
