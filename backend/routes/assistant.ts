import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { appUser } from '../lib/auth';
import type { Env } from '../lib/env';
import { llmStatus, missingKeyMessage, streamChat, type LlmMessage } from '../lib/llm';
import { rateLimit } from '../lib/security';

const SYSTEM = `You are Lab to Market's research guide for inventors and commercializers.
Help with technology discovery, licensing, SBIR/STTR, patents, customer discovery, and next steps.
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
    fallback: c.env.ASSISTANT_DEV_FALLBACK === '1',
    message: status.configured
      ? 'Assistant ready.'
      : missingKeyMessage() + (c.env.ASSISTANT_DEV_FALLBACK === '1' ? ' Dev fallback is on.' : ''),
  });
});

app.use('/chat', rateLimit(30, 60_000));
app.post('/chat', async c => {
  if (!(await appUser(c.env, c.req.raw))) return c.json({ error: 'Sign in required.' }, 401);

  const status = llmStatus(c.env);
  if (!status.configured && c.env.ASSISTANT_DEV_FALLBACK !== '1') {
    return c.json({ error: missingKeyMessage(), code: 'llm_unconfigured' }, 503);
  }

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
