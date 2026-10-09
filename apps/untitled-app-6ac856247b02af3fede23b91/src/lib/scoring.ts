import { DIMENSIONS, defaultWeights } from './constants';
import type { Evaluation, Technology } from './types';

export type ScoreSummary = {
  overall: number | null; // 0-100 weighted, over scored dimensions only
  scored: number; total: number;
  confidence: 'low' | 'medium' | 'high' | 'none';
  strengths: string[]; risks: string[]; missing: string[]; lowEvidence: string[];
};

export function summarize(ev: Evaluation | undefined, tech?: Technology): ScoreSummary {
  const weights = { ...defaultWeights(), ...(ev?.weights ?? {}) };
  const scores = ev?.scores ?? {};
  let wsum = 0, acc = 0, scored = 0, confPts = 0;
  const strengths: string[] = [], risks: string[] = [], missing: string[] = [], lowEvidence: string[] = [];
  for (const d of DIMENSIONS) {
    const s = scores[d.key];
    const w = weights[d.key] ?? d.weight;
    if (!s || s.score == null) { missing.push(`No score yet: ${d.label}`); continue; }
    scored += 1; wsum += w; acc += w * s.score;
    confPts += s.confidence === 'high' ? 3 : s.confidence === 'medium' ? 2 : 1;
    if (!s.evidence.trim()) lowEvidence.push(d.label);
    if (s.score >= 4) strengths.push(`${d.label} (${s.score}/5)`);
    if (s.score <= 2) risks.push(`${d.label} (${s.score}/5)`);
  }
  if (tech) {
    if (!tech.source_url) missing.push('No original source URL recorded');
    if (tech.licensing_status === 'unknown') missing.push('Licensing status unknown');
    if (!tech.patent_numbers && !tech.ip_info) missing.push('No patent / IP information');
    if (!tech.customers) missing.push('No potential customers identified');
    if (!tech.competitors) missing.push('No competing products identified');
    if (!tech.maturity) missing.push('Technology maturity (TRL) unknown');
  }
  const avgConf = scored ? confPts / scored : 0;
  const coverage = scored / DIMENSIONS.length;
  const evidenceShare = scored ? (scored - lowEvidence.length) / scored : 0;
  let confidence: ScoreSummary['confidence'] = 'none';
  if (scored) {
    const c = avgConf * coverage * (0.5 + 0.5 * evidenceShare);
    confidence = c >= 2.2 ? 'high' : c >= 1.3 ? 'medium' : 'low';
  }
  return {
    overall: wsum ? Math.round(((acc / wsum) - 1) / 4 * 100) : null,
    scored, total: DIMENSIONS.length, confidence, strengths, risks, missing, lowEvidence,
  };
}
