import { Hono } from 'hono';
import type { Env } from './env';

/**
 * Legacy Bourne runtime proxy. On self-host (no BOURNE_RUNTIME_URL) every path
 * returns 501 so the product UI can show a clear "assistant unavailable" state.
 */
export const bourneRoutes = new Hono<{ Bindings: Env }>().all('*', async c => {
  if (!c.env.BOURNE_RUNTIME_URL) {
    return c.json({
      error: 'Research assistant runtime is not configured on this self-hosted deployment. Core product features work without it.',
      code: 'assistant_unavailable',
    }, 501);
  }
  const url = new URL(c.req.url);
  const path = url.pathname.replace(/^\/bourne/, '') || '/';
  const response = await fetch(`${c.env.BOURNE_RUNTIME_URL.replace(/\/$/, '')}${path}${url.search}`, {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: ['GET', 'HEAD'].includes(c.req.method) ? undefined : await c.req.arrayBuffer(),
  });
  return new Response(response.body, { status: response.status, headers: response.headers });
});
