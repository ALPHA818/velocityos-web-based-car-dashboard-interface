import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, SettingsEntity, LocationEntity, TrackingEntity, RecentHistoryEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { UserSettings, SavedLocation } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // SETTINGS
  app.get('/api/settings', async (c) => {
    const entity = new SettingsEntity(c.env, 'default');
    const settings = await entity.getState();
    return ok(c, settings);
  });
  app.post('/api/settings', async (c) => {
    const data = await c.req.json<Partial<UserSettings>>();
    const entity = new SettingsEntity(c.env, 'default');
    const current = await entity.getState();
    const updated = { ...current, ...data, id: 'default' };
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
    if (!data.label || !data.lat || !data.lon) return bad(c, 'Invalid location data');
    const id = data.id || crypto.randomUUID();
    const location = await LocationEntity.create(c.env, { ...data, id });
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
  // TRACKING
  app.get('/api/tracking/:id', async (c) => {
    const entity = new TrackingEntity(c.env, c.req.param('id'));
    if (!await entity.exists()) return notFound(c, 'Tracking session not found');
    const state = await entity.getState();
    return ok(c, state);
  });
  app.post('/api/tracking/:id', async (c) => {
    const data = await c.req.json<any>();
    const entity = new TrackingEntity(c.env, c.req.param('id'));
    await entity.save({ ...data, lastUpdate: Date.now() });
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
    return ok(c, { reset: true });
  });
  app.get('/api/test', (c) => c.json({ success: true, data: { name: 'VelocityOS Backend' }}));
}