import { Hono } from 'hono';
import { appUser } from './auth';
import type { Env } from './env';

/** Preserve the native runtime protocol and streams, authenticated as the caller. */
export const bourneRoutes = new Hono<{ Bindings: Env }>().all('*', async c => {
  if (!await appUser(c.env, c.req.raw)) return c.json({ error: 'Sign in first' }, 401);
  const url = new URL(c.req.url);
  const path = url.pathname.replace(/^\/bourne/, '');
  if (!/^\/(agent-sessions|uploads|artifacts)(\/|$)/.test(path)) return c.json({ error: 'Unknown runtime route' }, 404);
  try {
    if (path.split('/').some(s => { const v = decodeURIComponent(s); return v === '..' || v === '.' || v.includes('/') || v.includes('\\'); })) return c.json({ error: 'Invalid path' }, 400);
  } catch { return c.json({ error: 'Invalid path' }, 400); }
  if (!c.env.BOURNE_RUNTIME_URL) return c.json({ error: 'Runtime is not configured for this deployment' }, 503);
  const headers = new Headers();
  for (const name of ['Authorization', 'Content-Type', 'Accept', 'Last-Event-ID']) {
    const value = c.req.header(name); if (value) headers.set(name, value);
  }
  const response = await fetch(`${c.env.BOURNE_RUNTIME_URL.replace(/\/$/, '')}${path}${url.search}`, {
    method: c.req.method, headers,
    body: ['GET', 'HEAD'].includes(c.req.method) ? undefined : c.req.raw.body,
    redirect: 'manual',
  });
  const out = new Headers(response.headers);
  out.set('Cache-Control', 'no-store');
  out.delete('Set-Cookie');
  return new Response(response.body, { status: response.status, headers: out });
});
