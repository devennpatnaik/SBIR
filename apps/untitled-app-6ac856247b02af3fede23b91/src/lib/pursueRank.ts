/**
 * Deterministic pursue-list ranking: unpicked first, then by promising score.
 * Uses existing scoring + Layer 4 learning helpers — no chatty AI ranker.
 */
import { applyLearningScore, type CohortInsights } from '../../../../packages/learning/index.ts';
import { summarize } from './scoring.ts';
import type { Evaluation, Technology } from './types.ts';

export type PursueStatus = 'unpicked' | 'progress' | 'done';

export function techPursueStatus(t: Technology, hasProject: boolean): PursueStatus {
  if (t.archived) return 'done';
  if (t.shortlisted || hasProject) return 'progress';
  return 'unpicked';
}

/** SBIR / gov R&D promise: base score + cohort nudge when sampleSize ≥ 3. */
export function sbirPromiseScore(
  t: Technology,
  ev: Evaluation | undefined,
  insights: CohortInsights | null | undefined,
): number {
  const base = summarize(ev, t).overall;
  const applied = applyLearningScore(base, insights);
  let score = applied.score ?? base ?? 28;
  if (t.agency) score += 4;
  if (/federal|national lab|doe|nasa|nih|darpa|army|navy|air force/i.test(`${t.lab_name} ${t.agency}`)) score += 6;
  if (t.licensing_status === 'available') score += 5;
  if (summarize(ev, t).confidence === 'high') score += 3;
  else if (summarize(ev, t).confidence === 'medium') score += 1;
  return Math.max(0, Math.min(100, score));
}

/**
 * Patents track: heuristic for “unused / not commercialized yet”.
 * Favors clear IP, university/lab owners, unknown licensing, early maturity.
 */
export function patentPromiseScore(t: Technology): number {
  let score = 35;
  if (t.patent_numbers?.trim()) score += 18;
  if (/university|college|institute|laboratory|federal|national lab/i.test(t.lab_name || '')) score += 14;
  if (t.licensing_status === 'unknown' || t.licensing_status === 'available') score += 10;
  if (t.licensing_status === 'unavailable' || t.licensing_status === 'licensed_elsewhere') score -= 20;
  if (!t.customers?.trim()) score += 6;
  if (/trl\s*[1-4]\b/i.test(t.maturity || '') || /early|prototype|concept/i.test(t.maturity || '')) score += 8;
  if (/commercial|on the market|productized/i.test(`${t.description} ${t.applications}`)) score -= 12;
  if (summarize(undefined, t).confidence === 'high') score += 2;
  return Math.max(0, Math.min(100, score));
}

export type Ranked<T> = { item: T; status: PursueStatus; score: number };

/** Sort: unpicked → progress → done; within each bucket, higher score first. */
export function rankPursueItems<T>(rows: Ranked<T>[]): Ranked<T>[] {
  const order: Record<PursueStatus, number> = { unpicked: 0, progress: 1, done: 2 };
  return [...rows].sort((a, b) => {
    const s = order[a.status] - order[b.status];
    if (s !== 0) return s;
    return b.score - a.score;
  });
}

export function splitPursueSections<T>(ranked: Ranked<T>[]): {
  unpicked: Ranked<T>[];
  acted: Ranked<T>[];
} {
  return {
    unpicked: ranked.filter(r => r.status === 'unpicked'),
    acted: ranked.filter(r => r.status !== 'unpicked'),
  };
}
