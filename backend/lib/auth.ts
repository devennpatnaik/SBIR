import { createRemoteJWKSet, errors, jwtVerify } from 'jose';
import type { Env } from './env';

let remoteJWKSet: ReturnType<typeof createRemoteJWKSet> | null = null;

/** The signed-in app user a request is from. */
export type AppUser = { userId: string; organizationId: string | null; email?: string };

/**
 * The signed-in app user who sent the request, from its bearer token.
 * - AUTH_MODE=local: HS256 JWT signed with JWT_SECRET (self-host)
 * - AUTH_MODE=neon: JWKS against NEON_AUTH_BASE_URL (legacy hosted)
 */
export const appUser = async (env: object, request: Request): Promise<AppUser | null> => {
  const authorization = request.headers.get('Authorization') ?? '';
  const token = authorization.match(/^Bearer[ ]+(.+)$/i)?.[1];
  if (!token) return null;

  const e = env as Env;
  if (e.AUTH_MODE === 'local' || (!e.NEON_AUTH_BASE_URL && e.JWT_SECRET)) {
    if (!e.JWT_SECRET) return null;
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(e.JWT_SECRET), { algorithms: ['HS256'] });
      if (typeof payload.sub !== 'string' || !payload.sub.length) return null;
      const email = typeof payload.email === 'string' ? payload.email : undefined;
      return { userId: payload.sub, organizationId: null, email };
    } catch {
      return null;
    }
  }

  const { NEON_AUTH_BASE_URL } = e;
  if (!NEON_AUTH_BASE_URL) return null;
  const issuer = new URL(NEON_AUTH_BASE_URL).origin;
  let keySet = remoteJWKSet;
  if (!keySet) {
    keySet = createRemoteJWKSet(new URL(`${NEON_AUTH_BASE_URL}/.well-known/jwks.json`));
    remoteJWKSet = keySet;
  }

  let payload: Awaited<ReturnType<typeof jwtVerify>>['payload'];
  try {
    ({ payload } = await jwtVerify(token, keySet, { issuer, audience: issuer }));
  } catch (error) {
    if (error instanceof errors.JWKSTimeout || (error instanceof errors.JOSEError && error.constructor === errors.JOSEError)) throw error;
    if (error instanceof errors.JOSEError) return null;
    throw error;
  }

  if (typeof payload.sub !== 'string' || !payload.sub.length) return null;
  const { id } = payload.o && typeof payload.o === 'object' ? (payload.o as { id?: unknown }) : {};

  return { userId: payload.sub, organizationId: typeof id === 'string' && id.length ? id : null };
};
