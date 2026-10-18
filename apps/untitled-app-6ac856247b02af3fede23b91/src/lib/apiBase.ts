/** Self-host and legacy Bourne URL resolution. Prefer VITE_API_BASE_URL. */
export function apiBase(): string {
  const base = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BOURNE_BACKEND_URL || '';
  if (!base) throw new Error('VITE_API_BASE_URL is not configured for this build.');
  return String(base).replace(/\/+$/, '');
}

export function authMode(): 'local' | 'neon' {
  if (import.meta.env.VITE_AUTH_MODE === 'neon') return 'neon';
  if (import.meta.env.VITE_AUTH_MODE === 'local') return 'local';
  // Default: local when no Neon auth URL is set.
  return import.meta.env.VITE_NEON_AUTH_BASE_URL ? 'neon' : 'local';
}
