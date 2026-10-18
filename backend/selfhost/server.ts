/**
 * Bourne-free API entrypoint for Docker / local Bun.
 * Loads process env as Hono Bindings and serves the same app routes.
 */
import app from '../index';
import { loadProcessEnv } from '../lib/env';

const env = loadProcessEnv();
const port = Number(process.env.PORT || 8787);

console.log(`[selfhost] listening on :${port} auth=${env.AUTH_MODE} data=${env.NEON_DATA_API_URL}`);

Bun.serve({
  port,
  hostname: '0.0.0.0',
  fetch: (request) => app.fetch(request, env),
});
