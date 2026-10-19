import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { appUser } from '../lib/auth';
import type { Env } from '../lib/env';
import { llmStatus, missingKeyMessage, streamChat, type LlmMessage } from '../lib/llm';
import { rateLimit } from '../lib/security';

const SYSTEM = `You are Lab to Market's research guide for inventors and commercializers.
The product has two tracks. Respect the active track from [App context: track=sbir|patents]:
- track=sbir: SBIR-eligible government R&D; hand-hold through SBIR/STTR process, licensing follow-ups, funding, Layer 4 outcomes.
- track=patents: worldwide patent discovery/shortlisting only; may not be SBIR-eligible; do NOT push SBIR process or commercialization coaching.
Label claims as verified, sourced, estimate, or hypothesis. Prefer official sources and clear uncertainty.
Never claim to submit applications, sign agreements, or spend money for the user.
Keep answers concise and actionable. Plain language first.`;

const app = new Hono<{ Bindings: Env }>();

app.get('/status', async c => {
  const status = llmStatus(c.env);
  return c.json({
    configured: status.configured,
    provider: status.provider,
    model: status.model,
    offline: status.offline,
    fallback: status.offline,
    message: status.configured
      ? 'Live model ready.'
      : 'Offline guide active — structured checklists without an API key. ' + missingKeyMessage(),
  });
});

app.use('/chat', rateLimit(30, 60_000));
app.post('/chat', async c => {
  if (!(await appUser(c.env, c.req.raw))) return c.json({ error: 'Sign in required.' }, 401);

  const body = await c.req.json().catch(() => null) as {
    messages?: { role?: string; content?: string }[];
    message?: string;
  } | null;

  const incoming = Array.isArray(body?.messages) ? body!.messages! : [];
  const single = typeof body?.message === 'string' ? body.message.trim() : '';
  const history: LlmMessage[] = [{ role: 'system', content: SYSTEM }];
  for (const m of incoming.slice(-20)) {
    if ((m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim()) {
      history.push({ role: m.role, content: m.content.slice(0, 12_000) });
    }
  }
  if (single) history.push({ role: 'user', content: single.slice(0, 12_000) });
  if (history.length < 2) return c.json({ error: 'Send a message.' }, 400);

  return streamSSE(c, async stream => {
    try {
      let full = '';
      await streamChat(c.env, history, async text => {
        full += text;
        await stream.writeSSE({ event: 'delta', data: JSON.stringify({ text }) });
      });
      await stream.writeSSE({ event: 'done', data: JSON.stringify({ content: full }) });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Assistant failed.';
      await stream.writeSSE({ event: 'error', data: JSON.stringify({ error: msg }) });
    }
  });
});

export const assistantRoutes = app;
