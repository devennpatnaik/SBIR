import { useCallback, useEffect, useState } from 'react';
import { client } from '../client';
import { authHeaders } from '../runtime';

/** Every successful write bumps this version; every query hook re-runs when it changes. */
let version = 0;
const listeners = new Set<() => void>();
export function invalidate() {
  version += 1;
  listeners.forEach(l => l());
}
if (typeof window !== 'undefined') window.addEventListener('focus', () => invalidate());

type Result<T> = { data: T[]; loading: boolean; error: string | null; reload: () => void };

/**
 * Reads rows through the Neon Data API (row level security applies) and re-reads after any write in the app.
 * `build` receives a fresh query on the table and returns the filtered/ordered builder.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useQuery<T>(table: string, build: (q: any) => any, deps: unknown[] = [], enabled = true): Result<T> {
  const [state, setState] = useState<{ data: T[]; loading: boolean; error: string | null }>({ data: [], loading: true, error: null });
  const [tick, setTick] = useState(version);
  useEffect(() => {
    const l = () => setTick(version);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(async () => {
    if (!enabled) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    const { data, error } = await build(client.from(table).select('*'));
    setState({ data: (data ?? []) as T[], loading: false, error: error?.message ?? null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, enabled, ...deps]);
  useEffect(() => {
    void run();
  }, [run, tick]);
  return { ...state, reload: () => void run() };
}

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export async function insertRow<T = Record<string, unknown>>(table: string, values: Record<string, unknown>): Promise<T> {
  const res = await client.from(table).insert(values).select().single();
  const row = check(res) as T;
  invalidate();
  return row;
}

export async function insertRows(table: string, values: Record<string, unknown>[]): Promise<void> {
  if (!values.length) return;
  // The Data API requires every row in one bulk insert to have the same keys, so group by key set.
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const v of values) {
    const k = Object.keys(v).sort().join(',');
    groups.set(k, [...(groups.get(k) ?? []), v]);
  }
  for (const rows of groups.values()) check(await client.from(table).insert(rows));
  invalidate();
}

export async function updateRow(table: string, id: string, values: Record<string, unknown>): Promise<void> {
  const res = await client.from(table).update(values).eq('id', id);
  check(res);
  invalidate();
}

export async function deleteRow(table: string, id: string): Promise<void> {
  const res = await client.from(table).delete().eq('id', id);
  check(res);
  invalidate();
}

/** Calls the project backend as the signed-in user. */
export async function backend<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = import.meta.env.VITE_BOURNE_BACKEND_URL;
  if (!base) throw new Error('The backend URL is not configured for this environment.');
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`);
  return body as T;
}

export const nowIso = () => new Date().toISOString();
export const today = () => new Date().toISOString().slice(0, 10);
export function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  const dt = d.length === 10 ? new Date(`${d}T12:00:00`) : new Date(d);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
export function daysUntil(d: string | null | undefined): number | null {
  if (!d) return null;
  const dt = new Date(`${d.slice(0, 10)}T23:59:59`);
  return Math.ceil((dt.getTime() - Date.now()) / 86400000);
}
