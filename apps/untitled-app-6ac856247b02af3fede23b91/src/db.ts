import { useEffect, useState } from 'react';
import { authHeaders, dataUrl, readSseEvents, sleep } from './runtime';

const SUBSCRIBE_RETRY_DELAY_MS = 1000;
const SUBSCRIBE_RETRY_MAX_MS = 30_000;

/**
 * Keeps one SELECT live: onRows gets the current rows, then the query's fresh rows every time
 * one of the tables it reads changes — the server re-runs the query as the signed-in user, so
 * every push is exactly what their policies allow. Reconnects with backoff after drops and server
 * errors and reports them through onError. Only a refused query (400) ends it. The returned function
 * unsubscribes.
 */
export function subscribe<T = Record<string, unknown>>(
  sql: string,
  params: unknown[],
  onRows: (rows: T[]) => void,
  onError?: (message: string) => void,
): () => void {
  const controller = new AbortController();
  let closed = false;
  let retryDelayMs = SUBSCRIBE_RETRY_DELAY_MS;

  const deliver = async (): Promise<void> => {
    while (!closed) {
      let failed = false;
      let errorMessage: string | null = null;
      let refusedMessage: string | null = null;

      try {
        const response = await fetch(dataUrl('/data/subscribe'), {
          method: 'POST',
          headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql, params }),
          signal: controller.signal,
        });

        if (closed) return;

        if (!response.ok) {
          if (response.status === 400) {
            const body = await response.json().catch(() => null);
            refusedMessage = body?.error ?? 'The query was refused';
          } else {
            failed = true;
            errorMessage = `Live updates stopped (status ${response.status}); reconnecting`;
          }
        } else {
          if (!response.body) throw new Error('Subscribe opened no stream');

          for await (const { event, data } of readSseEvents(response.body)) {
            if (closed) return;
            if (event === 'rows') {
              retryDelayMs = SUBSCRIBE_RETRY_DELAY_MS;
              onRows(JSON.parse(data) as T[]);
            } else if (event === 'error') {
              onError?.(JSON.parse(data).message ?? 'Live refresh failed');
            }
          }
        }

      } catch (cause) {
        if (closed) return;
        failed = true;
        errorMessage = cause instanceof Error ? cause.message : String(cause);
      }

      if (closed) return;
      if (refusedMessage !== null) {
        onError?.(refusedMessage);
        return;
      }
      if (errorMessage !== null) onError?.(errorMessage);
      if (closed) return;

      await sleep(retryDelayMs, controller.signal).catch(() => undefined);
      if (closed) return;
      if (failed) retryDelayMs = Math.min(retryDelayMs * 2, SUBSCRIBE_RETRY_MAX_MS);
    }
  };

  deliver();

  return () => {
    closed = true;
    controller.abort();
  };
}

export type LiveRows<T> = { rows: T[]; loading: boolean; error: string | null };

/**
 * One SELECT kept live for a component: the rows the signed-in user may see, then fresh rows on
 * every change to a table the query reads, whoever wrote it. Render them as they are; changing
 * sql or params re-subscribes, and unmounting unsubscribes. The error is set while live updates
 * are down and clears when rows arrive again.
 */
export function useRows<T = Record<string, unknown>>(sql: string, params: unknown[] = []): LiveRows<T> {
  const [state, setState] = useState<LiveRows<T>>({ rows: [], loading: true, error: null });
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    setState({ rows: [], loading: true, error: null });
    return subscribe<T>(
      sql,
      JSON.parse(paramsKey) as unknown[],
      rows => setState({ rows, loading: false, error: null }),
      error => setState(prev => ({ ...prev, loading: false, error })),
    );
  }, [sql, paramsKey]);

  return state;
}
