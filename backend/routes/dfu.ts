import { Hono } from 'hono';
import { DFU_LEADS, leadToTechnologyRow } from '../../packages/ontology/dfu-leads';
import { PROBLEM_SPACE } from '../../packages/ontology/dfu-constants';
import { appUser } from '../lib/auth';
import { DataError, userData } from '../lib/user-data';
import type { Env } from '../lib/env';

const app = new Hono<{ Bindings: Env }>();

app.onError((e, c) =>
  c.json(
    { error: e instanceof DataError ? e.message : e instanceof Error ? e.message : 'DFU seed failed.' },
    e instanceof DataError && e.status < 500 ? 400 : 502,
  ),
);

/** Seed curated DFU / chronic-wound leads for the signed-in user (idempotent by name). */
app.post('/seed', async c => {
  if (!(await appUser(c.env, c.req.raw))) return c.json({ error: 'Sign in required.' }, 401);

  // PostgREST: quote values that contain spaces / punctuation.
  const spaceFilter = `problem_space=eq.${encodeURIComponent(`"${PROBLEM_SPACE}"`)}`;
  const existing = await userData<{ id: string; name: string }[]>(
    c.env,
    c.req.raw,
    `technologies?${spaceFilter}&select=id,name`,
  );
  const have = new Set(existing.map(r => r.name));
  const toInsert = DFU_LEADS.filter(l => !have.has(l.name)).map(l => leadToTechnologyRow(l, { is_sample: true }));

  if (toInsert.length) {
    // PostgREST prefers uniform key sets — leadToTechnologyRow is uniform.
    await userData(c.env, c.req.raw, 'technologies?columns=name,description,source_url,source_name,lab_name,agency,inventors,origin_kind,category,problem_space,applications,customers,maturity,competitors,ip_info,patent_numbers,licensing_status,licensing_status_source,sbir_relevance,open_questions,source_text,shortlisted,archived,is_sample,match_path', 'POST', toInsert);
  }

  const all = await userData<{ id: string }[]>(
    c.env,
    c.req.raw,
    `technologies?${spaceFilter}&select=id&archived=eq.false`,
  );

  return c.json({
    message: toInsert.length
      ? `Loaded ${toInsert.length} DFU / chronic-wound leads.`
      : 'DFU / chronic-wound leads already loaded.',
    inserted: toInsert.length,
    total: all.length,
    problemSpace: PROBLEM_SPACE,
  });
});

app.get('/meta', c =>
  c.json({
    problemSpace: PROBLEM_SPACE,
    leadCount: DFU_LEADS.length,
    successMetric: '≥5 pursued leads with logged outreach or SBIR topic open',
  }),
);

export const dfuRoutes = app;
