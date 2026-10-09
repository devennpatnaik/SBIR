import { createRemoteJWKSet, errors, jwtVerify } from 'jose';

let remoteJWKSet: ReturnType<typeof createRemoteJWKSet> | null = null;

/** The signed-in app user a request is from. */
export type AppUser = { userId: string; organizationId: string | null };

/**
 * The signed-in app user who sent the request, from its bearer token checked against this branch's auth server,
 * or null when the token is missing or invalid; answer null with 401. Throws when the auth server can't be reached.
 */
export const appUser = async (env: object, request: Request): Promise<AppUser | null> => {
  const authorization = request.headers.get('Authorization') ?? '';
  const token = authorization.match(/^Bearer[ ]+(.+)$/i)?.[1];
  if (!token) return null;

  const { NEON_AUTH_BASE_URL } = env as { NEON_AUTH_BASE_URL: string };
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
