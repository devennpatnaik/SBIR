/**
 * Bourne-free API entrypoint for Docker / local Bun.
 * Loads process env as Hono Bindings and serves the same app routes.
 */
import app from '../index';
import { loadProcessEnv } from '../lib/env';
import { assertJwtSecret } from '../lib/security';
import { llmStatus } from '../lib/llm';
import { ensureDirs } from '../lib/storage';

const env = loadProcessEnv();
const port = Number(process.env.PORT || 8787);

const jwtWarn = assertJwtSecret(env);
if (jwtWarn) {
  if (env.NODE_ENV === 'production') {
    console.error(`[selfhost] refusing to start: ${jwtWarn}`);
    process.exit(1);
  }
  console.warn(`[selfhost] warning: ${jwtWarn}`);
}

await ensureDirs(env).catch(err => console.warn('[selfhost] data dir', err));

const llm = llmStatus(env);
console.log(
  `[selfhost] listening on :${port} auth=${env.AUTH_MODE} data=${env.NEON_DATA_API_URL} assistant=${llm.configured ? llm.provider : env.ASSISTANT_DEV_FALLBACK === '1' ? 'dev-fallback' : 'off'}`,
);

Bun.serve({
  port,
  hostname: '0.0.0.0',
  fetch: (request) => app.fetch(request, env),
});
