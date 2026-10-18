import { useCallback, useEffect, useRef, useState } from 'react';
import { client } from '../client';
import { authHeaders } from '../runtime';
import { apiBase } from './apiBase';

/** Every successful write bumps this version; every query hook re-runs when it changes. */
let version = 0;
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('ltm-data-changes') : null;
const listeners = new Set<() => void>();
export function invalidate() {
  version += 1;
  listeners.forEach(l => l());
  channel?.postMessage("changed");
}
if (channel) channel.onmessage = () => { version++; listeners.forEach(l => l()); };
if (typeof window !== 'undefined') window.addEventListener('focus', () => invalidate());

/** Keep failures separate: one successful query must not hide another query's error. */
const failures = new Map<symbol, string>();
const writeKey = Symbol('write');
const errorListeners = new Set<(message: string | null) => void>();
const currentError = () => Array.from(failures.values())[0] ?? null;
function reportDataError(key: symbol, message: string | null) {
  if (message) failures.set(key, message); else failures.delete(key);
  errorListeners.forEach(l => l(currentError()));
}
export function reportWriteError(error: unknown) {
  reportDataError(writeKey, `Could not save: ${error instanceof Error ? error.message : String(error)}. Your change may not have been saved; check before retrying.`);
}
export function clearWriteError() { reportDataError(writeKey, null); }
export function useDataError(): string | null {
  const [message, setMessage] = useState<string | null>(currentError);
  useEffect(() => { errorListeners.add(setMessage); return () => { errorListeners.delete(setMessage); }; }, []);
  return message;
}

type Result<T> = { data: T[]; loading: boolean; error: string | null; reload: () => void };

/** Re-read after writes/focus; ignore late responses from obsolete requests or another project. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useQuery<T>(table: string, build: (q: any) => any, deps: unknown[] = [], enabled = true): Result<T> {
  const key = JSON.stringify([table, enabled, ...deps]);
  const [state, setState] = useState<{ key: string; data: T[]; loading: boolean; error: string | null }>({ key, data: [], loading: enabled, error: null });
  const [tick, setTick] = useState(version);
  const errorKey = useRef(Symbol(table));
  const generation = useRef(0);
  useEffect(() => {
    const l = () => setTick(version);
    listeners.add(l);
    const id = errorKey.current;
    return () => { listeners.delete(l); generation.current++; reportDataError(id, null); };
  }, []);
  const run = useCallback(async () => {
    const request = ++generation.current;
    if (!enabled) { setState({ key, data: [], loading: false, error: null }); reportDataError(errorKey.current, null); return; }
    setState(prev => prev.key === key ? prev : { key, data: [], loading: true, error: null });
    try {
      const { data, error } = await build(client.from(table).select('*'));
      if (request !== generation.current) return;
      if (error) throw new Error(error.message || 'Could not load data.');
      setState({ key, data: (data ?? []) as T[], loading: false, error: null });
      reportDataError(errorKey.current, null);
    } catch (caught) {
      if (request !== generation.current) return;
      const message = caught instanceof Error ? caught.message : String(caught);
      setState(prev => ({ key, data: prev.key === key ? prev.data : [], loading: false, error: message }));
      reportDataError(errorKey.current, `${table}: ${message}`);
    }
    // build's dependencies are represented by key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => { void run(); return () => { generation.current++; }; }, [run, tick]);
  if (!enabled) return { data: [], loading: false, error: null, reload: () => void run() };
  if (state.key !== key) return { data: [], loading: true, error: null, reload: () => void run() };
  return { data: state.data, loading: state.loading, error: state.error, reload: () => void run() };
}

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) { const e = new Error(res.error.message); reportWriteError(e); throw e; }
  clearWriteError();
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
  const res = await fetch(`${apiBase()}${path}`, {
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
  const now = new Date();
  const day = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const target = Date.parse(`${d.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(target) ? null : Math.round((target - day) / 86400000);
}
