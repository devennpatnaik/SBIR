import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './lib/env';
import { extractRoutes } from './routes/extract';
import { sbirRoutes } from './routes/sbir';
import { dataRoutes } from './routes/data';

const app = new Hono<{ Bindings: Env }>();
const apiCors = cors({ origin: origin => origin, allowHeaders: ['Authorization', 'Content-Type'], allowMethods: ['GET', 'POST', 'OPTIONS'] });
app.use('/extract/*', apiCors);
app.use('/extract', apiCors);
app.use('/sbir/*', apiCors);
// Data API requests carry PostgREST headers (Prefer, Range…); reflect what the browser asks for.
app.use('/data/*', cors({ origin: origin => origin, allowMethods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], exposeHeaders: ['Content-Range', 'Preference-Applied'], maxAge: 600 }));
app.get('/health', c => c.json({ ok: true }));
app.route('/extract', extractRoutes);
app.route('/sbir', sbirRoutes);
app.route('/data', dataRoutes);

export default app;
