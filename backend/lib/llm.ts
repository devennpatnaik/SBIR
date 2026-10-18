import type { Env } from './env';

export type LlmMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type LlmProvider = 'openai' | 'anthropic' | null;

export function llmStatus(env: Env): { configured: boolean; provider: LlmProvider; model: string } {
  if (env.OPENAI_API_KEY) {
    return { configured: true, provider: 'openai', model: env.OPENAI_MODEL || 'gpt-4o-mini' };
  }
  if (env.ANTHROPIC_API_KEY) {
    return { configured: true, provider: 'anthropic', model: env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514' };
  }
  return { configured: false, provider: null, model: '' };
}

export function missingKeyMessage(): string {
  return 'No language-model API key is configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in the API environment (.env / Compose), then restart the API.';
}

/** Non-streaming completion for pathway jobs and mock/dev. */
export async function completeChat(env: Env, messages: LlmMessage[], opts?: { maxTokens?: number }): Promise<string> {
  const status = llmStatus(env);
  if (!status.configured) {
    if (env.ASSISTANT_DEV_FALLBACK === '1') {
      return devFallbackReply(messages);
    }
    throw new Error(missingKeyMessage());
  }
  if (status.provider === 'openai') return openaiComplete(env, messages, opts?.maxTokens ?? 2048);
  return anthropicComplete(env, messages, opts?.maxTokens ?? 2048);
}

/** Stream text deltas via callback. */
export async function streamChat(
  env: Env,
  messages: LlmMessage[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const status = llmStatus(env);
  if (!status.configured) {
    if (env.ASSISTANT_DEV_FALLBACK === '1') {
      const text = devFallbackReply(messages);
      for (const chunk of text.match(/.{1,24}/g) ?? [text]) {
        if (signal?.aborted) break;
        onDelta(chunk);
        await new Promise(r => setTimeout(r, 12));
      }
      return text;
    }
    throw new Error(missingKeyMessage());
  }
  if (status.provider === 'openai') return openaiStream(env, messages, onDelta, signal);
  return anthropicStream(env, messages, onDelta, signal);
}

function devFallbackReply(messages: LlmMessage[]): string {
  const last = [...messages].reverse().find(m => m.role === 'user')?.content ?? '';
  const clipped = last.replace(/^\[App context:[^\]]*\]\s*/i, '').slice(0, 280);
  return [
    '**(Dev fallback — no API key)**',
    '',
    'I can guide commercialization steps once `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is set on the API.',
    '',
    clipped ? `You asked about: ${clipped}` : 'Ask about licensing, SBIR/STTR, patents, or your next step.',
    '',
    'Facts should be labeled **verified**, **sourced**, **estimate**, or **hypothesis**. Nothing here is submitted on your behalf.',
  ].join('\n');
}

async function openaiComplete(env: Env, messages: LlmMessage[], maxTokens: number): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      max_tokens: maxTokens,
      temperature: 0.4,
    }),
  });
  const body = (await res.json().catch(() => null)) as {
    error?: { message?: string };
    choices?: { message?: { content?: string } }[];
  } | null;
  if (!res.ok) throw new Error(body?.error?.message || `OpenAI error (${res.status})`);
  return body?.choices?.[0]?.message?.content?.trim() || '';
}

async function openaiStream(
  env: Env,
  messages: LlmMessage[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      max_tokens: 2048,
      temperature: 0.4,
      stream: true,
    }),
    signal,
  });
  if (!res.ok || !res.body) {
    const err = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(err?.error?.message || `OpenAI error (${res.status})`);
  }
  let full = '';
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    for (let i = buffer.indexOf('\n'); i !== -1; i = buffer.indexOf('\n')) {
      const line = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') continue;
      try {
        const json = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
        const piece = json.choices?.[0]?.delta?.content;
        if (piece) {
          full += piece;
          onDelta(piece);
        }
      } catch {
        /* ignore partial frames */
      }
    }
  }
  return full;
}

async function anthropicComplete(env: Env, messages: LlmMessage[], maxTokens: number): Promise<string> {
  const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n');
  const rest = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }));
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: system || undefined,
      messages: rest,
    }),
  });
  const body = (await res.json().catch(() => null)) as {
    error?: { message?: string };
    content?: { type?: string; text?: string }[];
  } | null;
  if (!res.ok) throw new Error(body?.error?.message || `Anthropic error (${res.status})`);
  return (body?.content ?? []).filter(c => c.type === 'text').map(c => c.text ?? '').join('').trim();
}

async function anthropicStream(
  env: Env,
  messages: LlmMessage[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n');
  const rest = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }));
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      stream: true,
      system: system || undefined,
      messages: rest,
    }),
    signal,
  });
  if (!res.ok || !res.body) {
    const err = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(err?.error?.message || `Anthropic error (${res.status})`);
  }
  let full = '';
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    for (let i = buffer.indexOf('\n'); i !== -1; i = buffer.indexOf('\n')) {
      const line = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data) continue;
      try {
        const json = JSON.parse(data) as { type?: string; delta?: { text?: string } };
        if (json.type === 'content_block_delta' && json.delta?.text) {
          full += json.delta.text;
          onDelta(json.delta.text);
        }
      } catch {
        /* ignore */
      }
    }
  }
  return full;
}
