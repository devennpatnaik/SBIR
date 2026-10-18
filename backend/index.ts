import { pathwayRoutes } from './routes/pathways';
import { grantsRoutes } from './routes/grants';
import { patentRoutes } from './routes/patents';
import { learningRoutes } from './routes/learning';
import { assistantRoutes } from './routes/assistant';
import { fileRoutes } from './routes/files';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './lib/env';
import { extractRoutes } from './routes/extract';
import { sbirRoutes } from './routes/sbir';
import { dataRoutes } from './routes/data';
import { bourneRoutes } from './lib/bourne';
import { demoRoutes } from './routes/demo';
import { actionRoutes } from './lib/actions';
import { localAuthRoutes } from './routes/local-auth';
import { llmStatus } from './lib/llm';
import { rateLimit, securityHeaders } from './lib/security';

const app = new Hono<{ Bindings: Env }>();
app.use('*', securityHeaders);

const apiCors = cors({
  origin: origin => origin,
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
});
app.use('/auth/*', apiCors);
app.use('/auth/sign-up', rateLimit(20, 60_000));
app.use('/auth/sign-in', rateLimit(40, 60_000));
app.route('/auth', localAuthRoutes);
app.use('/pathways/*', apiCors);
app.route('/pathways', pathwayRoutes);
app.use('/grants/*', apiCors);
app.route('/grants', grantsRoutes);
app.use('/patents/*', apiCors);
app.route('/patents', patentRoutes);
app.use('/learning/*', apiCors);
app.route('/learning', learningRoutes);
app.use('/assistant/*', apiCors);
app.route('/assistant', assistantRoutes);
app.use('/files/*', cors({
  origin: origin => origin,
  allowMethods: ['GET', 'HEAD', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Authorization', 'Content-Type'],
}));
app.route('/files', fileRoutes);
app.use('/demo', apiCors);
app.use('/demo/*', apiCors);
app.route('/demo', demoRoutes);
app.use('/extract/*', apiCors);
app.use('/extract', apiCors);
app.use('/sbir/*', apiCors);
app.use('/data/*', cors({
  origin: origin => origin,
  allowMethods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Range', 'Preference-Applied'],
  maxAge: 600,
}));
app.use('/bourne/*', cors({
  origin: origin => origin,
  allowMethods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.route('/bourne', bourneRoutes);
app.get('/health', c => {
  const llm = llmStatus(c.env);
  return c.json({
    ok: true,
    authMode: c.env.AUTH_MODE || 'unknown',
    assistant: llm.offline ? 'offline-guide' : llm.provider,
    model: llm.model || null,
    offline: llm.offline,
  });
});
app.get('/live', c => c.json({ message: 'Live updates are not enabled for this app.' }, 501));
app.route('/extract', extractRoutes);
app.route('/sbir', sbirRoutes);
app.route('/data', dataRoutes);
app.use('/actions/*', cors({ origin: origin => origin }));
app.route('/actions', actionRoutes);

export { Live } from './lib/live';
export default app;
