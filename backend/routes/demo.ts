import { Hono } from 'hono';
import { appUser } from '../lib/auth';
import type { Env } from '../lib/env';
import { userData } from '../lib/user-data';

type DemoResult = {
  message?: string;
  project_id?: string;
  technology_ids?: string[];
  opportunity_ids?: string[];
  proposal_id?: string;
};

/** Seed sample Layer 4 outcomes that never enter the learning cohort (is_sample from tech). */
async function seedSampleOutcomes(env: Env, request: Request, technologyIds: string[]) {
  const samples = [
    {
      lab_responded: 'pending',
      license_available: 'unknown',
      tech_dd_result: 'in_progress',
      sbir_award: 'not_pursued',
      customer_interest: 'weak',
      notes: '[SAMPLE] Demo outcomes only. Do not treat as real evidence.',
      contribute_to_learning: false,
    },
    {
      lab_responded: 'no',
      license_available: 'unknown',
      tech_dd_result: 'not_started',
      sbir_award: 'not_pursued',
      customer_interest: 'none',
      notes: '[SAMPLE] Alternate candidate — intentionally weaker signals.',
      contribute_to_learning: false,
    },
    {
      lab_responded: 'yes',
      license_available: 'partial',
      tech_dd_result: 'passed',
      sbir_award: 'pending',
      customer_interest: 'strong',
      notes: '[SAMPLE] Strongest fictional candidate — still not real.',
      contribute_to_learning: false,
    },
  ];
  for (let i = 0; i < technologyIds.length; i++) {
    const tid = technologyIds[i]!;
    const answers = samples[i] ?? samples[0]!;
    await userData(env, request, 'rpc/upsert_investigation_outcome', 'POST', {
      target_technology: tid,
      target_project: null,
      answers,
    }).catch(() => undefined);
  }
}

/** Atomic demo setup/removal through the Data API, using the caller's token and RLS. */
export const demoRoutes = new Hono<{ Bindings: Env }>().post('/', async c => {
  try {
    const user = await appUser(c.env, c.req.raw);
    if (!user) return c.json({ error: 'Sign in to open your private demo.' }, 401);
    const body = await c.req.json().catch(() => null);
    if (!body || !['create', 'remove'].includes(body.operation)) return c.json({ error: 'Choose create or remove.' }, 400);
    const response = await fetch(`${c.env.NEON_DATA_API_URL.replace(/\/+$/, '')}/rpc/manage_demo`, {
      method: 'POST',
      headers: { Authorization: c.req.header('Authorization')!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: body.operation }),
    });
    const result = (await response.json()) as DemoResult;
    if (!response.ok) {
      return c.json({ error: result.message || 'Demo setup failed. No partial demo was saved; try again.' }, 502);
    }
    if (body.operation === 'create' && Array.isArray(result.technology_ids) && result.technology_ids.length) {
      await seedSampleOutcomes(c.env, c.req.raw, result.technology_ids);
    }
    return c.json(result);
  } catch {
    return c.json(
      { error: 'Could not reach the demo service. Retry safely: an existing demo will be reopened, not duplicated.' },
      503,
    );
  }
});
