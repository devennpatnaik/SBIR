import { Hono } from 'hono';
import { appUser } from '../lib/auth';
import type { Env } from '../lib/env';

/**
 * The page's only path to the database. Each request is forwarded to this branch's Neon Data API
 * with the signed-in user's own bearer token, so their row level security decides every row.
 * Only the app's tables are reachable; anything else is refused.
 */
const TABLES = new Set([
  'agreements', 'communications', 'contacts', 'documents', 'evaluations', 'interviews', 'labs', 'licensing_items',
  'opportunities', 'project_opportunities', 'projects', 'proposal_sections', 'proposals', 'questions', 'sources',
  'pathway_catalog', 'project_pathways', 'workflow_runs', 'demo_workspaces', 'status_history', 'tasks', 'technologies', 'user_settings', 'program_tracking',
  'investigation_outcomes',
  'bourne_uploads', 'bourne_artifacts', 'bourne_artifact_revisions', 'bourne_agent_sessions', 'bourne_agent_messages',
]);
const FORWARD_REQUEST = ['authorization', 'content-type', 'accept', 'prefer', 'range', 'range-unit', 'accept-profile', 'content-profile'];
const FORWARD_RESPONSE = ['content-type', 'content-range', 'preference-applied'];

export const dataRoutes = new Hono<{ Bindings: Env }>().all('/rest/:table', async c => {
  const table = c.req.param('table');
  if (!TABLES.has(table)) return c.json({ message: `Unknown table: ${table}` }, 404);
  const method = c.req.method;
  if (!['GET', 'HEAD', 'POST', 'PATCH', 'DELETE'].includes(method)) return c.json({ message: 'Method not allowed' }, 405);

  let user;
  try {
    user = await appUser(c.env, c.req.raw);
  } catch {
    return c.json({ message: 'Could not check your sign-in right now. Try again in a moment.' }, 503);
  }
  if (!user) return c.json({ message: 'Your session has expired. Sign in again.' }, 401);

  const base = c.env.NEON_DATA_API_URL.replace(/\/+$/, '');
  const target = `${base}/${table}${new URL(c.req.url).search}`;
  const headers = new Headers();
  for (const name of FORWARD_REQUEST) {
    const value = c.req.header(name);
    if (value) headers.set(name, value);
  }
  const hasBody = method === 'POST' || method === 'PATCH';
  let upstream: Response;
  try {
    upstream = await fetch(target, { method, headers, body: hasBody ? await c.req.arrayBuffer() : undefined });
  } catch (error) {
    return c.json({ message: `The database could not be reached (${error instanceof Error ? error.message : 'network error'}).` }, 502);
  }
  const out = new Headers();
  for (const name of FORWARD_RESPONSE) {
    const value = upstream.headers.get(name);
    if (value) out.set(name, value);
  }
  return new Response(upstream.body, { status: upstream.status, headers: out });
});
