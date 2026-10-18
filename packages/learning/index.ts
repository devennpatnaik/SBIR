/** Layer 4 — learning and feedback signals from real investigations. */

export const LAB_RESPONDED = ['unknown', 'yes', 'no', 'pending'] as const;
export const LICENSE_AVAILABLE = ['unknown', 'yes', 'no', 'partial', 'not_applicable'] as const;
export const TECH_DD_RESULT = ['unknown', 'passed', 'failed', 'in_progress', 'not_started'] as const;
export const SBIR_AWARD = ['unknown', 'yes', 'no', 'pending', 'not_pursued'] as const;
export const CUSTOMER_INTEREST = ['unknown', 'none', 'weak', 'strong'] as const;

export type LabResponded = (typeof LAB_RESPONDED)[number];
export type LicenseAvailable = (typeof LICENSE_AVAILABLE)[number];
export type TechDdResult = (typeof TECH_DD_RESULT)[number];
export type SbirAward = (typeof SBIR_AWARD)[number];
export type CustomerInterest = (typeof CUSTOMER_INTEREST)[number];

export type OutcomeAnswers = {
  lab_responded: LabResponded;
  license_available: LicenseAvailable;
  tech_dd_result: TechDdResult;
  sbir_award: SbirAward;
  customer_interest: CustomerInterest;
  notes?: string;
  evidence_url?: string;
  pathway_key?: string;
  contribute_to_learning?: boolean;
};

export type InvestigationOutcome = OutcomeAnswers & {
  id: string;
  technology_id: string;
  project_id: string | null;
  agency: string;
  category: string;
  origin_kind: string;
  pathway_key: string;
  is_sample: boolean;
  contribute_to_learning: boolean;
  notes: string;
  evidence_url: string;
  recorded_at: string;
  updated_at: string;
};

export type CohortInsights = {
  sampleSize: number;
  agency: string;
  category: string;
  labRespondedYes: number;
  labRespondedNo: number;
  licenseAvailableYes: number;
  licenseAvailableNo: number;
  techDdPassed: number;
  techDdFailed: number;
  sbirAwardYes: number;
  sbirAwardNo: number;
  customerInterestStrong: number;
  customerInterestWeak: number;
  customerInterestNone: number;
};

/** Plain-language questions shown in the simple outcomes form. */
export const OUTCOME_QUESTIONS: {
  key: keyof OutcomeAnswers;
  label: string;
  help: string;
  options: { value: string; label: string }[];
}[] = [
  {
    key: 'lab_responded',
    label: 'Did the laboratory (or owner) respond?',
    help: 'Only mark yes after a real reply you received.',
    options: [
      { value: 'unknown', label: 'Not yet known' },
      { value: 'pending', label: 'Waiting for a reply' },
      { value: 'yes', label: 'Yes — they replied' },
      { value: 'no', label: 'No reply after follow-up' },
    ],
  },
  {
    key: 'license_available',
    label: 'Was a license available?',
    help: 'Based on what the owner or listing confirmed, not a guess.',
    options: [
      { value: 'unknown', label: 'Not yet known' },
      { value: 'yes', label: 'Yes — rights appear available' },
      { value: 'partial', label: 'Partially / limited field' },
      { value: 'no', label: 'Not available' },
      { value: 'not_applicable', label: 'Not applicable' },
    ],
  },
  {
    key: 'tech_dd_result',
    label: 'Did it survive technical due diligence?',
    help: 'Your own technical review, not a lab certificate.',
    options: [
      { value: 'unknown', label: 'Not yet known' },
      { value: 'not_started', label: 'Not started' },
      { value: 'in_progress', label: 'In progress' },
      { value: 'passed', label: 'Passed (so far)' },
      { value: 'failed', label: 'Did not pass' },
    ],
  },
  {
    key: 'sbir_award',
    label: 'Did you receive an SBIR/STTR award?',
    help: 'Only mark yes after an official award notice.',
    options: [
      { value: 'unknown', label: 'Not yet known' },
      { value: 'not_pursued', label: 'Not pursuing SBIR/STTR' },
      { value: 'pending', label: 'Submitted — awaiting decision' },
      { value: 'yes', label: 'Yes — award confirmed' },
      { value: 'no', label: 'No — declined or not selected' },
    ],
  },
  {
    key: 'customer_interest',
    label: 'Did customers show interest?',
    help: 'Real conversations or paid interest — not a hypothesis.',
    options: [
      { value: 'unknown', label: 'Not yet known' },
      { value: 'none', label: 'No interest found' },
      { value: 'weak', label: 'Some interest, not committed' },
      { value: 'strong', label: 'Strong interest or pilot intent' },
    ],
  },
];

export function emptyAnswers(): OutcomeAnswers {
  return {
    lab_responded: 'unknown',
    license_available: 'unknown',
    tech_dd_result: 'unknown',
    sbir_award: 'unknown',
    customer_interest: 'unknown',
    notes: '',
    evidence_url: '',
    pathway_key: '',
    contribute_to_learning: true,
  };
}

export function answersFromOutcome(o?: Partial<InvestigationOutcome> | null): OutcomeAnswers {
  const base = emptyAnswers();
  if (!o) return base;
  return {
    lab_responded: (LAB_RESPONDED as readonly string[]).includes(o.lab_responded ?? '') ? o.lab_responded as LabResponded : 'unknown',
    license_available: (LICENSE_AVAILABLE as readonly string[]).includes(o.license_available ?? '') ? o.license_available as LicenseAvailable : 'unknown',
    tech_dd_result: (TECH_DD_RESULT as readonly string[]).includes(o.tech_dd_result ?? '') ? o.tech_dd_result as TechDdResult : 'unknown',
    sbir_award: (SBIR_AWARD as readonly string[]).includes(o.sbir_award ?? '') ? o.sbir_award as SbirAward : 'unknown',
    customer_interest: (CUSTOMER_INTEREST as readonly string[]).includes(o.customer_interest ?? '') ? o.customer_interest as CustomerInterest : 'unknown',
    notes: o.notes ?? '',
    evidence_url: o.evidence_url ?? '',
    pathway_key: o.pathway_key ?? '',
    contribute_to_learning: o.is_sample ? false : o.contribute_to_learning !== false,
  };
}

/** How many of the five core signals have a concrete (non-unknown) answer. */
export function answeredCount(a: OutcomeAnswers): number {
  return (['lab_responded', 'license_available', 'tech_dd_result', 'sbir_award', 'customer_interest'] as const)
    .filter(k => a[k] !== 'unknown').length;
}

/**
 * Small, bounded adjustment (−12…+12) applied to a 0–100 technology score when
 * cohort evidence exists. Requires a minimum sample; never invents a ranking alone.
 */
export function learningAdjustment(insights: CohortInsights | null | undefined): {
  delta: number;
  reasons: string[];
  confidence: 'none' | 'low' | 'medium';
} {
  if (!insights || insights.sampleSize < 3) {
    return { delta: 0, reasons: [], confidence: 'none' };
  }
  const n = insights.sampleSize;
  let delta = 0;
  const reasons: string[] = [];
  const rate = (yes: number, no: number) => {
    const known = yes + no;
    return known >= 3 ? yes / known : null;
  };

  const license = rate(insights.licenseAvailableYes, insights.licenseAvailableNo);
  if (license != null) {
    const d = Math.round((license - 0.5) * 8);
    delta += d;
    if (d !== 0) reasons.push(`Among ${n} similar investigations, licenses looked available about ${Math.round(license * 100)}% of the time when known.`);
  }

  const dd = rate(insights.techDdPassed, insights.techDdFailed);
  if (dd != null) {
    const d = Math.round((dd - 0.5) * 6);
    delta += d;
    if (d !== 0) reasons.push(`Technical due diligence passed about ${Math.round(dd * 100)}% of the time when known.`);
  }

  const sbir = rate(insights.sbirAwardYes, insights.sbirAwardNo);
  if (sbir != null) {
    const d = Math.round((sbir - 0.35) * 6);
    delta += d;
    if (d !== 0) reasons.push(`SBIR/STTR awards were confirmed about ${Math.round(sbir * 100)}% of the time among known decisions.`);
  }

  const interestKnown = insights.customerInterestStrong + insights.customerInterestWeak + insights.customerInterestNone;
  if (interestKnown >= 3) {
    const strongShare = insights.customerInterestStrong / interestKnown;
    const d = Math.round((strongShare - 0.25) * 6);
    delta += d;
    if (d !== 0) reasons.push(`Strong customer interest showed up in about ${Math.round(strongShare * 100)}% of known cases.`);
  }

  delta = Math.max(-12, Math.min(12, delta));
  const confidence = n >= 12 ? 'medium' : 'low';
  return { delta, reasons, confidence };
}

export function applyLearningScore(base: number | null, insights: CohortInsights | null | undefined): {
  score: number | null;
  delta: number;
  reasons: string[];
  confidence: 'none' | 'low' | 'medium';
} {
  const adj = learningAdjustment(insights);
  if (base == null) return { score: null, ...adj };
  return { score: Math.max(0, Math.min(100, base + adj.delta)), ...adj };
}

/** Prefer technologies with better evidence-adjusted scores when ranking. */
export function rankByLearning<T extends { id: string }>(
  items: T[],
  baseScore: (item: T) => number | null,
  insightFor: (item: T) => CohortInsights | null | undefined,
): { item: T; base: number | null; adjusted: number | null; delta: number; reasons: string[] }[] {
  return items
    .map(item => {
      const base = baseScore(item);
      const applied = applyLearningScore(base, insightFor(item));
      return { item, base, adjusted: applied.score, delta: applied.delta, reasons: applied.reasons };
    })
    .sort((a, b) => (b.adjusted ?? -1) - (a.adjusted ?? -1));
}
