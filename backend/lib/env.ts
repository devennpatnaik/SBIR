/** Names the backend reads from its deployment env (typing only). */
export type Env = {
  DATABASE_URL: string;
  /** PostgREST / Neon Data API base (no trailing slash). */
  NEON_DATA_API_URL: string;
  /** Neon Auth base when AUTH_MODE=neon; unused for local. */
  NEON_AUTH_BASE_URL: string;
  /** local | neon — local uses HS256 JWT_SECRET; neon uses JWKS. */
  AUTH_MODE: 'local' | 'neon';
  JWT_SECRET: string;
  /** Optional Bourne runtime — empty on self-host. */
  BOURNE_PROJECT_ID: string;
  BOURNE_BUILD_ID: string;
  BOURNE_RUNTIME_URL: string;
};

export function loadProcessEnv(): Env {
  const authMode = (process.env.AUTH_MODE === 'neon' ? 'neon' : 'local') as Env['AUTH_MODE'];
  return {
    DATABASE_URL: process.env.DATABASE_URL ?? '',
    NEON_DATA_API_URL: (process.env.NEON_DATA_API_URL ?? process.env.POSTGREST_URL ?? '').replace(/\/+$/, ''),
    NEON_AUTH_BASE_URL: process.env.NEON_AUTH_BASE_URL ?? '',
    AUTH_MODE: authMode,
    JWT_SECRET: process.env.JWT_SECRET ?? '',
    BOURNE_PROJECT_ID: process.env.BOURNE_PROJECT_ID ?? '',
    BOURNE_BUILD_ID: process.env.BOURNE_BUILD_ID ?? '',
    BOURNE_RUNTIME_URL: process.env.BOURNE_RUNTIME_URL ?? '',
  };
}
