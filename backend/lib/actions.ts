import { Hono } from 'hono';
import { decodeJwt, importSPKI, jwtVerify } from 'jose';
import { actions } from '@project/ontology';
import { z } from 'zod';
import { appUser } from './auth';

type ActionEnvironment = {
  BOURNE_AGENT_PUBLIC_KEY: string;
  BOURNE_PROJECT_ID: string;
  BOURNE_RUNTIME_URL: string;
  NEON_AUTH_BASE_URL: string;
};

type ActionCaller = {
  userId: string;
  organizationId: string | null;
};

let agentPublicKey: Promise<CryptoKey> | null = null;

const importAgentPublicKey = (pem: string): Promise<CryptoKey> => {
  if (!agentPublicKey) agentPublicKey = importSPKI(pem, 'ES256');

  return agentPublicKey;
};

const requestCaller = async (env: ActionEnvironment, request: Request): Promise<ActionCaller | null> => {
  const token = request.headers.get('Authorization')?.match(/^Bearer[ ]+(.+)$/i)?.[1];
  if (!token) return null;

  const audience = `bourne-project-runtime:${env.BOURNE_PROJECT_ID}`;
  let payload;

  try {
    payload = decodeJwt(token);
  } catch {
    return null;
  }

  if (payload.aud !== audience) return appUser(env, request);

  try {
    const key = await importAgentPublicKey(env.BOURNE_AGENT_PUBLIC_KEY);
    const verified = await jwtVerify(token, key, {
      algorithms: ['ES256'],
      audience,
      requiredClaims: ['exp'],
    });
    const userId = verified.payload.sub;

    if (typeof userId !== 'string' || !userId.length) return null;

    const organization = verified.payload.o && typeof verified.payload.o === 'object'
      ? verified.payload.o as { id?: unknown }
      : {};

    return {
      userId,
      organizationId: typeof organization.id === 'string' && organization.id.length ? organization.id : null,
    };
  } catch {
    return null;
  }
};

const postgresError = (error: unknown): { message: string; code: string } | null => {
  if (error === null || typeof error !== 'object') return null;

  const { code, message } = error as { code?: unknown; message?: unknown };

  return typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code) && typeof message === 'string'
    ? { message, code }
    : null;
};

export const actionRoutes = new Hono();

actionRoutes.post('/:name', async c => {
  const env = c.env as ActionEnvironment;
  const caller = await requestCaller(env, c.req.raw);

  if (!caller) return c.json({ error: 'Unauthorized' }, 401);

  const name = c.req.param('name');
  const action = actions.find(candidate => candidate.name === name);

  if (!action) return c.json({ error: `Unknown action "${name}".` }, 404);

  let input: unknown;

  try {
    input = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const parsed = action.input.safeParse(input);

  if (!parsed.success) {
    return c.json({
      error: z.prettifyError(parsed.error),
      input: z.toJSONSchema(action.input),
    }, 400);
  }

  const db = {
    rpc: async (functionName: string, args: Record<string, unknown>) => {
      const response = await fetch(`${env.BOURNE_RUNTIME_URL}/functions/${encodeURIComponent(functionName)}`, {
        method: 'POST',
        headers: { Authorization: c.req.header('Authorization') ?? '', 'Content-Type': 'application/json' },
        body: JSON.stringify(args ?? {}),
      });
      const body = await response.json().catch(() => null) as { data?: unknown; error?: { message: string; code?: string } } | null;

      if (response.ok) return { data: body?.data ?? null, error: null };
      if (response.status === 400 && body?.error && typeof body.error === 'object') return { data: null, error: body.error };

      throw new Error(`Bourne function call failed with HTTP ${response.status}.`);
    },
  };

  try {
    const result = await action.run(parsed.data as never, { db });

    return c.json({ result }, 200);
  } catch (error) {
    const mappedError = postgresError(error);

    if (mappedError) {
      const status = mappedError.code === '42501' ? 403 : /^(22|23|P0)/.test(mappedError.code) ? 400 : 500;

      return c.json({ error: mappedError.message, code: mappedError.code }, status);
    }

    return c.json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
