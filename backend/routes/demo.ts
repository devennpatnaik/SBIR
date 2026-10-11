import { Hono } from 'hono';
import { appUser } from '../lib/auth';
import type { Env } from '../lib/env';

/** Atomic demo setup/removal through the Data API, using the caller's token and RLS. */
export const demoRoutes = new Hono<{ Bindings: Env }>().post('/', async c => {
  try {
    const user = await appUser(c.env, c.req.raw);
    if (!user) return c.json({ error: 'Sign in to open your private demo.' }, 401);
    const body = await c.req.json().catch(() => null);
    if (!body || !['create', 'remove'].includes(body.operation)) return c.json({ error: 'Choose create or remove.' }, 400);
    const response = await fetch(`${c.env.NEON_DATA_API_URL.replace(/\/+$/, '')}/rpc/manage_demo`, {
      method: 'POST',
      headers: { Authorization: c.req.header('Authorization')!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: body.operation }),
    });
    const result = await response.json() as { message?: string };
    if (!response.ok) return c.json({ error: result.message || 'Demo setup failed. No partial demo was saved; try again.' }, 502);
    return c.json(result);
  } catch {
    return c.json({ error: 'Could not reach the demo service. Retry safely: an existing demo will be reopened, not duplicated.' }, 503);
  }
});
