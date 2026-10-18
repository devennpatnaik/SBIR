import { createMiddleware } from 'hono/factory';
import type { Env } from './env';

const hits = new Map<string, { count: number; reset: number }>();

/** Cheap per-IP rate limit for auth and AI routes. */
export const rateLimit = (limit: number, windowMs: number) =>
  createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('cf-connecting-ip') || 'local';
    const key = `${c.req.path}:${ip}`;
    const now = Date.now();
    const row = hits.get(key);
    if (!row || row.reset < now) {
      hits.set(key, { count: 1, reset: now + windowMs });
    } else {
      row.count += 1;
      if (row.count > limit) {
        return c.json({ error: 'Too many requests. Please wait a moment and try again.' }, 429);
      }
    }
    await next();
  });

export const securityHeaders = createMiddleware(async (c, next) => {
  await next();
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('X-Frame-Options', 'DENY');
  c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if ((c.env as Env).NODE_ENV === 'production') {
    c.res.headers.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
});

export function assertJwtSecret(env: Env): string | null {
  const secret = env.JWT_SECRET || '';
  if (env.AUTH_MODE !== 'local') return null;
  if (!secret || secret.length < 32) {
    return 'JWT_SECRET must be at least 32 characters for local auth.';
  }
  if (env.NODE_ENV === 'production' && /dev-change-me|labtomarket|change-me/i.test(secret)) {
    return 'JWT_SECRET still looks like a development placeholder. Set a strong random secret before production use.';
  }
  return null;
}
