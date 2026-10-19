/**
 * Minimal PostgREST + local JWT client for Bourne-free self-host.
 * Mimics the neon-js surface the app uses: auth + from(table).select/eq/order/insert/update/delete.
 */
import { useEffect, useState } from 'react';
import { apiBase } from './apiBase';

const TOKEN_KEY = 'ltm.local.session';

type Session = { token: string; user: { id: string; email: string; name?: string } };

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? JSON.parse(raw) as Session : null;
  } catch {
    return null;
  }
}

function writeSession(s: Session | null) {
  if (s) localStorage.setItem(TOKEN_KEY, JSON.stringify(s));
  else localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event('ltm-auth-change'));
}

type Filter = { type: 'eq' | 'in' | 'ilike' | 'is'; col: string; val: unknown };
type Order = { col: string; ascending: boolean; nullsFirst?: boolean };

class QueryBuilder {
  private filters: Filter[] = [];
  private orders: Order[] = [];
  private wantSingle = false;
  private rowLimit: number | null = null;
  constructor(private table: string, private method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET', private body?: unknown) {}

  select(_cols = '*') { return this; }
  eq(col: string, val: unknown) { this.filters.push({ type: 'eq', col, val }); return this; }
  in(col: string, vals: unknown[]) { this.filters.push({ type: 'in', col, val: vals }); return this; }
  ilike(col: string, val: unknown) { this.filters.push({ type: 'ilike', col, val }); return this; }
  is(col: string, val: unknown) { this.filters.push({ type: 'is', col, val }); return this; }
  limit(n: number) { this.rowLimit = n; return this; }
  order(col: string, opts?: { ascending?: boolean; nullsFirst?: boolean }) {
    this.orders.push({ col, ascending: opts?.ascending !== false, nullsFirst: opts?.nullsFirst });
    return this;
  }
  single() { this.wantSingle = true; return this; }
  insert(values: unknown) {
    this.method = 'POST';
    this.body = values;
    return this;
  }
  update(values: unknown) {
    this.method = 'PATCH';
    this.body = values;
    return this;
  }
  delete() {
    this.method = 'DELETE';
    return this;
  }

  private url() {
    const q = new URLSearchParams();
    for (const f of this.filters) {
      if (f.type === 'eq') q.set(f.col, `eq.${f.val}`);
      else if (f.type === 'in') q.set(f.col, `in.(${(f.val as unknown[]).map(v => `"${String(v).replace(/"/g, '')}"`).join(',')})`);
      else if (f.type === 'ilike') q.set(f.col, `ilike.${f.val}`);
      else if (f.type === 'is') q.set(f.col, `is.${f.val === null ? 'null' : String(f.val)}`);
    }
    for (const o of this.orders) {
      const dir = o.ascending ? 'asc' : 'desc';
      const nulls = o.nullsFirst == null ? '' : o.nullsFirst ? '.nullsfirst' : '.nullslast';
      q.append('order', `${o.col}.${dir}${nulls}`);
    }
    if (this.wantSingle) q.set('limit', '1');
    else if (this.rowLimit != null) q.set('limit', String(this.rowLimit));
    const qs = q.toString();
    return `${apiBase()}/data/rest/${this.table}${qs ? `?${qs}` : ''}`;
  }

  async then<TResult1 = { data: unknown; error: { message: string } | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    try {
      const session = readSession();
      const headers: Record<string, string> = { Accept: 'application/json', Prefer: 'return=representation' };
      if (session?.token) headers.Authorization = `Bearer ${session.token}`;
      if (this.body !== undefined) headers['Content-Type'] = 'application/json';
      const res = await fetch(this.url(), {
        method: this.method,
        headers,
        body: this.body === undefined ? undefined : JSON.stringify(this.body),
      });
      const text = await res.text();
      let parsed: unknown = null;
      try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
      if (!res.ok) {
        const message = (parsed as { message?: string })?.message || `Request failed (${res.status})`;
        const out = { data: null, error: { message } };
        return onfulfilled ? onfulfilled(out) : out as unknown as TResult1;
      }
      let data: unknown = parsed;
      if (this.wantSingle) data = Array.isArray(parsed) ? parsed[0] ?? null : parsed;
      const out = { data, error: null };
      return onfulfilled ? onfulfilled(out) : out as unknown as TResult1;
    } catch (e) {
      if (onrejected) return onrejected(e);
      throw e;
    }
  }
}

export const localClient = {
  auth: {
    async getSession() {
      const s = readSession();
      return { data: { session: s ? { token: s.token, user: s.user } : null } };
    },
    async signOut() { writeSession(null); },
    signUp: {
      async email({ email, password, name }: { email: string; password: string; name?: string }) {
        const res = await fetch(`${apiBase()}/auth/sign-up`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) return { error: { message: body.error || 'Sign up failed' } };
        writeSession({ token: body.token, user: body.user });
        return { data: body, error: null };
      },
    },
    signIn: {
      async email({ email, password }: { email: string; password: string }) {
        const res = await fetch(`${apiBase()}/auth/sign-in`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) return { error: { message: body.error || 'Sign in failed' } };
        writeSession({ token: body.token, user: body.user });
        return { data: body, error: null };
      },
    },
    useSession() {
      const [state, setState] = useState<{ data: Session | null; isPending: boolean }>(() => ({
        data: typeof window === 'undefined' ? null : readSession(),
        isPending: false,
      }));
      useEffect(() => {
        const sync = () => setState({ data: readSession(), isPending: false });
        sync();
        window.addEventListener('ltm-auth-change', sync);
        window.addEventListener('storage', sync);
        return () => {
          window.removeEventListener('ltm-auth-change', sync);
          window.removeEventListener('storage', sync);
        };
      }, []);
      return {
        data: state.data ? { session: { token: state.data.token }, user: state.data.user } : null,
        isPending: state.isPending,
      };
    },
  },
  from(table: string) {
    return new QueryBuilder(table);
  },
};
