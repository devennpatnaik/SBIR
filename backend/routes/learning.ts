import { Hono } from 'hono';
import { appUser } from '../lib/auth';
import { DataError, userData } from '../lib/user-data';
import type { Env } from '../lib/env';
import { emptyAnswers, type OutcomeAnswers } from '@project/learning';

const uuid = (x: unknown): x is string =>
  typeof x === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);

const app = new Hono<{ Bindings: Env }>();
app.onError((e, c) =>
  c.json(
    { error: e instanceof DataError ? e.message : e instanceof Error ? e.message : 'Learning request failed.' },
    e instanceof DataError && e.status < 500 ? (e.status === 403 ? 403 : 400) : 502,
  ),
);
app.use('*', async (c, next) => {
  if (!(await appUser(c.env, c.req.raw))) return c.json({ error: 'Sign in required.' }, 401);
  await next();
});

/** Read the signed-in user's outcome for one technology. */
app.get('/outcomes', async c => {
  const technologyId = c.req.query('technologyId');
  if (!uuid(technologyId)) return c.json({ error: 'Choose a valid technology.' }, 400);
  const rows = await userData<Record<string, unknown>[]>(
    c.env,
    c.req.raw,
    `investigation_outcomes?technology_id=eq.${technologyId}&select=*`,
  );
  return c.json({ outcome: rows[0] ?? null });
});

/** Upsert investigation outcomes for a technology the user owns. */
app.post('/outcomes', async c => {
  const b = await c.req.json();
  if (!uuid(b.technologyId)) return c.json({ error: 'Choose a technology.' }, 400);
  if (b.projectId != null && !uuid(b.projectId)) return c.json({ error: 'Invalid project.' }, 400);
  const base = emptyAnswers();
  const answers: OutcomeAnswers = {
    ...base,
    ...(typeof b.answers === 'object' && b.answers ? b.answers : {}),
  };
  const result = await userData(
    c.env,
    c.req.raw,
    'rpc/upsert_investigation_outcome',
    'POST',
    {
      target_technology: b.technologyId,
      target_project: b.projectId ?? null,
      answers,
    },
  );
  return c.json({ outcome: result });
});

/** Anonymized cohort counts for recommendation adjustments. */
app.get('/insights', async c => {
  const agency = c.req.query('agency') ?? '';
  const category = c.req.query('category') ?? '';
  if (agency.length > 120 || category.length > 120) return c.json({ error: 'Filter is too long.' }, 400);
  const insights = await userData(
    c.env,
    c.req.raw,
    'rpc/learning_cohort_insights',
    'POST',
    { filter_agency: agency, filter_category: category },
  );
  return c.json({ insights });
});

export const learningRoutes = app;
