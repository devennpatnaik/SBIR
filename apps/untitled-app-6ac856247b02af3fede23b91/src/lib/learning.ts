import { authHeaders } from '../runtime';
import type { CohortInsights, InvestigationOutcome, OutcomeAnswers } from '@project/learning';

async function learningApi<T>(path: string, init?: RequestInit): Promise<T> {
  const base = import.meta.env.VITE_BOURNE_BACKEND_URL;
  if (!base) throw new Error('The backend URL is not configured for this environment.');
  const r = await fetch(`${base}${path}`, {
    ...init,
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new Error(body?.error ?? `Learning request failed (${r.status})`);
  return body as T;
}

export async function fetchOutcome(technologyId: string): Promise<InvestigationOutcome | null> {
  const res = await learningApi<{ outcome: InvestigationOutcome | null }>(
    `/learning/outcomes?technologyId=${encodeURIComponent(technologyId)}`,
  );
  return res.outcome;
}

export async function saveOutcome(input: {
  technologyId: string;
  projectId?: string | null;
  answers: OutcomeAnswers;
}): Promise<InvestigationOutcome> {
  const res = await learningApi<{ outcome: InvestigationOutcome }>('/learning/outcomes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.outcome;
}

export async function fetchInsights(agency = '', category = ''): Promise<CohortInsights> {
  const q = new URLSearchParams();
  if (agency) q.set('agency', agency);
  if (category) q.set('category', category);
  const qs = q.toString();
  const res = await learningApi<{ insights: CohortInsights }>(`/learning/insights${qs ? `?${qs}` : ''}`);
  return res.insights;
}

const insightCache = new Map<string, { at: number; value: CohortInsights }>();
const TTL = 60_000;

/** Cached cohort insights for ranking; safe to call from compare/dashboard. */
export async function insightsForTech(agency: string, category: string): Promise<CohortInsights | null> {
  const key = `${agency.trim().toLowerCase()}|${category.trim().toLowerCase()}`;
  const hit = insightCache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value;
  try {
    const value = await fetchInsights(agency, category);
    insightCache.set(key, { at: Date.now(), value });
    return value;
  } catch {
    return null;
  }
}
