import { useEffect, useRef } from 'react';
import { createClient } from '@neondatabase/neon-js';
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react/adapters';
import { apiBase, authMode } from './lib/apiBase';
import { localClient } from './lib/localClient';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppClient = any;

function neonClient(): AppClient {
  return createClient({
    auth: { url: import.meta.env.VITE_NEON_AUTH_BASE_URL, adapter: BetterAuthReactAdapter() },
    dataApi: { url: `${apiBase()}/data/rest` },
  });
}

/** Local JWT + PostgREST when VITE_AUTH_MODE=local; Neon Auth otherwise. */
export const client: AppClient = authMode() === 'local' ? localClient : neonClient();

/**
 * The signed-in session, pending only until its first read resolves.
 */
export function useSession() {
  const session = client.auth.useSession();
  const resolved = useRef(false);

  useEffect(() => {
    if (!session.isPending) resolved.current = true;
  }, [session.isPending]);

  return { ...session, isPending: session.isPending && !resolved.current };
}
