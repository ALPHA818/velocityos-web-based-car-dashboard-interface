import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ChatBoardEntity, SettingsEntity, LocationEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
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
  // LEGACY ROUTES
  app.get('/api/test', (c) => c.json({ success: true, data: { name: 'VelocityOS Backend' }}));
}