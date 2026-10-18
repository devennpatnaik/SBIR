import { Hono } from 'hono';
import { appUser } from '../lib/auth';
import { runLocalPathwayJob } from '../lib/pathway-jobs';
import { DataError, userData } from '../lib/user-data';
import type { Env } from '../lib/env';
import { pathwayByKey } from '@project/pathways';
const uuid = (x: unknown): x is string =>
  typeof x === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);

type Run = { id: string; project_id: string; pathway_id: string; action: string; status: string; session_id: string | null };

const app = new Hono<{ Bindings: Env }>();
app.onError((e, c) =>
  c.json(
    {
      error:
        e instanceof DataError
          ? e.message
          : 'The pathway service could not complete this request. Your saved work is preserved; please retry.',
    },
    e instanceof DataError ? (e.status === 403 ? 403 : 400) : 502,
  ),
);
app.use('*', async (c, next) => {
  try {
    if (!(await appUser(c.env, c.req.raw))) return c.json({ error: 'Sign in required.' }, 401);
    await next();
  } catch (e) {
    return c.json(
      { error: e instanceof Error ? e.message : 'Pathway request failed.' },
      e instanceof DataError && e.status === 404 ? 404 : 400,
    );
  }
});

app.post('/kickoff', async c => {
  const b = await c.req.json();
  if (!uuid(b.requestKey) || !b.answers || typeof b.answers !== 'object') {
    return c.json({ error: 'Complete your starting questions.' }, 400);
  }
  return c.json(await userData(c.env, c.req.raw, 'rpc/create_simple_plan', 'POST', { request_key: b.requestKey, answers: b.answers }));
});

app.post('/plan', async c => {
  const b = await c.req.json();
  if (!uuid(b.projectId) || !pathwayByKey(b.pathwayKey)) {
    return c.json({ error: 'Choose a project and a supported pathway.' }, 400);
  }
  const result = await userData(c.env, c.req.raw, 'rpc/create_pathway_plan', 'POST', {
    target_project: b.projectId,
    selected_pathway: b.pathwayKey,
  });
  return c.json(result);
});

app.post('/run', async c => {
  const b = await c.req.json();
  if (!uuid(b.pathwayId) || !uuid(b.requestKey) || !['research', 'draft', 'review'].includes(b.action)) {
    return c.json({ error: 'Invalid workflow request.' }, 400);
  }
  const result = await userData<{ id: string; created: boolean }>(
    c.env,
    c.req.raw,
    'rpc/start_pathway_workflow',
    'POST',
    { target_pathway: b.pathwayId, requested_action: b.action, idempotency_key: b.requestKey },
  );
  if (!result.created) return c.json(result);

  // Always run locally: offline templates when no API key; live LLM when configured.
  const work = runLocalPathwayJob(c.env, c.req.raw, result.id);
  const ctx = (c as { executionCtx?: { waitUntil?: (p: Promise<unknown>) => void } }).executionCtx;
  if (ctx?.waitUntil) ctx.waitUntil(work);
  else await work;
  return c.json(result);
});

app.post('/runs/:id/cancel', async c => {
  const id = c.req.param('id');
  if (!uuid(id)) return c.json({ error: 'Invalid run.' }, 400);
  const stopped = await userData<Run[]>(
    c.env,
    c.req.raw,
    `workflow_runs?id=eq.${id}&status=eq.running`,
    'PATCH',
    { status: 'canceled', updated_at: new Date().toISOString(), completed_at: new Date().toISOString() },
  );
  return c.json({ stopped: stopped.length > 0 });
});

app.get('/runs/:id', async c => {
  const id = c.req.param('id');
  if (!uuid(id)) return c.json({ error: 'Invalid run.' }, 400);
  const rows = await userData<Run[]>(c.env, c.req.raw, `workflow_runs?id=eq.${id}`);
  return c.json(rows[0] ?? null);
});

export const pathwayRoutes = app;
