import { Hono } from 'hono';
import type { Env } from '../lib/env';

/**
 * Conversational assistant UI was removed in favor of list → pursue.
 * Endpoints remain as stubs so old clients get a clear message (no chat chrome).
 */
const app = new Hono<{ Bindings: Env }>();

app.get('/status', c =>
  c.json({
    configured: false,
    provider: null,
    model: '',
    offline: true,
    fallback: true,
    retired: true,
    message: 'Chat guide retired. Use Pursue — select from a ranked list, then open the next step. No API key required.',
  }),
);

app.post('/chat', c =>
  c.json(
    {
      error: 'Chat guide retired. Open Pursue in the app (select → pursue). No conversational assistant.',
      retired: true,
    },
    410,
  ),
);

export const assistantRoutes = app;
