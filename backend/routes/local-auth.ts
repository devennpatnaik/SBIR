import { Hono } from 'hono';
import { SignJWT } from 'jose';
import postgres from 'postgres';
import type { Env } from '../lib/env';
import { appUser } from '../lib/auth';

const encoder = new TextEncoder();

async function hashPassword(password: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`pw:${password}`));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function signToken(env: Env, user: { id: string; email: string }): Promise<string> {
  const secret = env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return new SignJWT({ role: 'authenticated', email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(encoder.encode(secret));
}

function sql(env: Env) {
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  return postgres(env.DATABASE_URL, { max: 4, connect_timeout: 15, idle_timeout: 20 });
}

function newId(): string {
  return crypto.randomUUID();
}

export const localAuthRoutes = new Hono<{ Bindings: Env }>();

localAuthRoutes.post('/sign-up', async c => {
  const body = await c.req.json().catch(() => null) as { email?: string; password?: string; name?: string } | null;
  const email = String(body?.email ?? '').trim().toLowerCase();
  const password = String(body?.password ?? '');
  const name = String(body?.name ?? email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return c.json({ error: 'Enter a valid email address.' }, 400);
  if (password.length < 8) return c.json({ error: 'Password must be at least 8 characters.' }, 400);
  if (!c.env.JWT_SECRET) return c.json({ error: 'Local auth is not configured.' }, 503);

  const db = sql(c.env);
  try {
    const hash = await hashPassword(password, c.env.JWT_SECRET);
    const id = newId();
    await db`INSERT INTO app_users (id, email, password_hash, name) VALUES (${id}, ${email}, ${hash}, ${name})`;
    const token = await signToken(c.env, { id, email });
    return c.json({ token, user: { id, email, name } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('unique') || msg.includes('duplicate') || msg.includes('app_users_email')) {
      return c.json({ error: 'An account with this email already exists.' }, 409);
    }
    console.error(e);
    return c.json({ error: 'Could not create the account.' }, 500);
  } finally {
    await db.end({ timeout: 2 });
  }
});

localAuthRoutes.post('/sign-in', async c => {
  const body = await c.req.json().catch(() => null) as { email?: string; password?: string } | null;
  const email = String(body?.email ?? '').trim().toLowerCase();
  const password = String(body?.password ?? '');
  if (!email || !password) return c.json({ error: 'Email or password is incorrect.' }, 401);
  if (!c.env.JWT_SECRET) return c.json({ error: 'Local auth is not configured.' }, 503);

  const db = sql(c.env);
  try {
    const rows = await db<{ id: string; email: string; name: string; password_hash: string }[]>`
      SELECT id, email, name, password_hash FROM app_users WHERE email = ${email}`;
    const user = rows[0];
    if (!user) return c.json({ error: 'Email or password is incorrect.' }, 401);
    const hash = await hashPassword(password, c.env.JWT_SECRET);
    if (hash !== user.password_hash) return c.json({ error: 'Email or password is incorrect.' }, 401);
    const token = await signToken(c.env, user);
    return c.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } finally {
    await db.end({ timeout: 2 });
  }
});

localAuthRoutes.get('/session', async c => {
  const user = await appUser(c.env, c.req.raw);
  if (!user) return c.json({ session: null }, 401);
  const token = (c.req.header('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  return c.json({
    session: {
      token,
      user: { id: user.userId, email: user.email ?? user.userId },
    },
  });
});
