import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './lib/env';
import { extractRoutes } from './routes/extract';
import { sbirRoutes } from './routes/sbir';

const app = new Hono<{ Bindings: Env }>();
app.use('*', cors({ origin: origin => origin, allowHeaders: ['Authorization', 'Content-Type'], allowMethods: ['GET', 'POST', 'OPTIONS'] }));
app.get('/health', c => c.json({ ok: true }));
app.route('/extract', extractRoutes);
app.route('/sbir', sbirRoutes);

export default app;
