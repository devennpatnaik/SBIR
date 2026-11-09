import { describe, expect, test } from 'bun:test';
import { DFU_LEADS, leadToTechnologyRow } from '@project/ontology/dfu-leads';
import { PROBLEM_SPACE, parseSbirStub, encodeSbirStub } from '@project/ontology/dfu-constants';
import { buildOutreachDraft, isDfuLead } from '../src/lib/dfu';
import { dfuPromiseScore, techPursueStatus } from '../src/lib/pursueRank';
import type { Technology } from '../src/lib/types';

function tech(partial: Partial<Technology> & { id: string; name: string }): Technology {
  return {
    user_id: 'u',
    lab_id: null,
    source_url: '',
    source_name: '',
    description: '',
    lab_name: '',
    agency: '',
    category: PROBLEM_SPACE,
    problem_space: PROBLEM_SPACE,
    applications: '',
    customers: '',
    competitors: '',
    maturity: '',
    patent_numbers: '',
    ip_info: '',
    open_questions: '',
    source_text: '',
    source_fetched_at: null,
    licensing_status: 'unknown',
    shortlisted: false,
    archived: false,
    is_sample: true,
    last_reviewed_at: null,
    created_at: '',
    updated_at: '',
    match_path: '',
    ...partial,
  } as Technology;
}

describe('DFU MVP seed + domain', () => {
  test('curates at least 20 DFU leads', () => {
    expect(DFU_LEADS.length).toBeGreaterThanOrEqual(20);
    expect(DFU_LEADS.length).toBeLessThanOrEqual(50);
  });

  test('every seed row maps into the locked problem space', () => {
    for (const lead of DFU_LEADS) {
      const row = leadToTechnologyRow(lead);
      expect(row.problem_space).toBe(PROBLEM_SPACE);
      expect(row.category).toBe(PROBLEM_SPACE);
      expect(row.sbir_relevance).toContain('||');
      expect(isDfuLead(row)).toBe(true);
    }
  });

  test('isDfuLead recognizes category / problem_space', () => {
    expect(isDfuLead({ category: 'DFU / chronic wounds' })).toBe(true);
    expect(isDfuLead({ problem_space: 'diabetic foot ulcers' })).toBe(true);
    expect(isDfuLead({ category: 'Water sensors' })).toBe(false);
  });
});

describe('path helpers', () => {
  test('outreach draft names the technology', () => {
    const draft = buildOutreachDraft({
      name: 'Smart offloading insole',
      lab_name: 'VA Palo Alto',
      agency: 'VA',
      description: 'Plantar pressure alerts for DFU recurrence.',
    });
    expect(draft).toContain('Smart offloading insole');
    expect(draft).toContain('evaluation license');
    expect(draft).toContain('VA Palo Alto');
  });

  test('SBIR stub round-trips', () => {
    const encoded = encodeSbirStub('NIH SEED', 'https://seed.nih.gov/', 'Wound topics');
    const parsed = parseSbirStub(encoded);
    expect(parsed.title).toBe('NIH SEED');
    expect(parsed.url).toBe('https://seed.nih.gov/');
    expect(parsed.why).toBe('Wound topics');
  });
});

describe('DFU ranking / status', () => {
  test('skip and path choices update pursue status', () => {
    expect(techPursueStatus(tech({ id: '1', name: 'a', match_path: 'skip', archived: true }), false)).toBe('done');
    expect(techPursueStatus(tech({ id: '2', name: 'b', match_path: 'outreach' }), false)).toBe('progress');
    expect(techPursueStatus(tech({ id: '3', name: 'c', match_path: 'sbir_topic' }), false)).toBe('progress');
    expect(techPursueStatus(tech({ id: '4', name: 'd' }), false)).toBe('unpicked');
  });

  test('dfuPromiseScore favors VA/NIH DFU leads over unrelated', () => {
    const wound = dfuPromiseScore(
      tech({ id: '1', name: 'DFU sensor', agency: 'VA', lab_name: 'VA lab', description: 'diabetic foot ulcer monitor' }),
      undefined,
      null,
    );
    const other = dfuPromiseScore(
      tech({ id: '2', name: 'Ammonia', agency: '', category: 'Water', problem_space: '', description: 'wastewater' }),
      undefined,
      null,
    );
    expect(wound).toBeGreaterThan(other);
  });
});
