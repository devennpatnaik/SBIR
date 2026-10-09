/** Names the backend reads from its deployment env (typing only). */
export type Env = {
  DATABASE_URL: string;
  NEON_AUTH_BASE_URL: string;
  NEON_DATA_API_URL: string;
  BOURNE_PROJECT_ID: string;
  BOURNE_BUILD_ID: string;
  BOURNE_RUNTIME_URL: string;
};
