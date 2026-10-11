import { client } from './client';

export function runtimeUrl(path: string): string {
  const base = import.meta.env.VITE_BOURNE_BACKEND_URL;
  if (!base) throw new Error('Uploads, artifacts and agents work only in a built app');
  return `${base}/bourne${path}`;
}

export function dataUrl(path: string): string {
  const base = import.meta.env.VITE_BOURNE_BACKEND_URL;
  if (!base) throw new Error('App data works only in a built app');
  return `${base}${path}`;
}

export async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await client.auth.getSession();
  const token = data?.session?.token;
  if (!token) throw new Error('Sign in first');
  return { Authorization: `Bearer ${token}` };
}

export async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error ?? `Request failed with status ${response.status}`);
  }
  return body as T;
}

export type SseEvent = { event: string; data: string; id?: string };

export function parseSseFrame(frame: string): SseEvent | null {
  let event = 'message';
  let id: string | undefined;
  const data: string[] = [];
  for (const line of frame.split('\n')) {
    if (!line || line.startsWith(':')) continue;
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    if (field === 'event') event = value;
    else if (field === 'data') data.push(value);
    else if (field === 'id') id = value;
  }
  return data.length ? { event, data: data.join('\n'), id } : null;
}

export async function* readSseEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<SseEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      buffer += decoder.decode(value, { stream: true });
      for (let end = buffer.indexOf('\n\n'); end !== -1; end = buffer.indexOf('\n\n')) {
        const parsed = parseSseFrame(buffer.slice(0, end));
        buffer = buffer.slice(end + 2);
        if (parsed) yield parsed;
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
