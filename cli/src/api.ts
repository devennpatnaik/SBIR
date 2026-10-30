import { readSession } from './session.ts';

export class CliError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CliError';
  }
}

export function apiBase(): string {
  const fromEnv = process.env.LTM_API || readSession().api || 'http://127.0.0.1:8787';
  return fromEnv.replace(/\/+$/, '');
}

function errorMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (typeof record.error === 'string' && record.error) return record.error;
    if (typeof record.message === 'string' && record.message) return record.message;
  }
  if (typeof body === 'string' && body.trim()) return body.trim().slice(0, 300);
  if (status === 401) return 'Your session has expired. Sign in again.';
  return `Request failed (${status}).`;
}

export async function api<T>(path: string, opts: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const method = opts.method ?? (opts.body !== undefined ? 'POST' : 'GET');
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.auth !== false) {
    const token = readSession().token;
    if (!token) throw new CliError('Sign in first: ./lab-to-market signin --email you@example.com');
    headers.Authorization = `Bearer ${token}`;
  }
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (method === 'POST' || method === 'PATCH' || method === 'DELETE') headers.Prefer = 'return=representation';

  let response: Response;
  try {
    response = await fetch(`${apiBase()}${path}`, {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
  } catch (error) {
    const why = error instanceof Error ? error.message : 'network error';
    throw new CliError(`Cannot reach the API at ${apiBase()} (${why}). Start it with ./lab-to-market up`);
  }

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try { parsed = JSON.parse(text); } catch { parsed = text; }
  }
  if (!response.ok) throw new CliError(errorMessage(parsed, response.status));
  return parsed as T;
}

export async function rest<T>(table: string, query = '', opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const qs = query ? (query.startsWith('?') ? query : `?${query}`) : '';
  return api<T>(`/data/rest/${table}${qs}`, opts);
}

export async function rows<T>(table: string, query = ''): Promise<T[]> {
  const data = await rest<unknown>(table, query);
  if (!Array.isArray(data)) throw new CliError('The database returned something other than a list.');
  return data as T[];
}

export async function ping(): Promise<boolean> {
  try {
    await api('/health', { auth: false });
    return true;
  } catch {
    return false;
  }
}
