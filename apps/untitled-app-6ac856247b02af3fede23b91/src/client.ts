import { useEffect, useRef } from 'react';
import { createClient } from '@neondatabase/neon-js';
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react/adapters';

export const client = createClient({
  auth: { url: import.meta.env.VITE_NEON_AUTH_BASE_URL, adapter: BetterAuthReactAdapter() },
  dataApi: { url: import.meta.env.VITE_NEON_DATA_API_URL },
});

/**
 * The signed-in session, pending only until its first read resolves. The
 * client.auth.useSession underneath turns isPending back on for every refetch
 * while there is no session — a window refocus, a reconnect, a sign-in in
 * another tab — so a screen gated on it unmounts and loses its state on each
 * one. Gate session-dependent renders on this hook instead.
 */
export function useSession() {
  const session = client.auth.useSession();
  const resolved = useRef(false);

  useEffect(() => {
    if (!session.isPending) resolved.current = true;
  }, [session.isPending]);

  return { ...session, isPending: session.isPending && !resolved.current };
}
