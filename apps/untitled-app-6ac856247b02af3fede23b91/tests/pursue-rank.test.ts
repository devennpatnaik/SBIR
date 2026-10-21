import { describe, expect, test } from 'bun:test';
import {
  patentPromiseScore,
  rankPursueItems,
  sbirPromiseScore,
  splitPursueSections,
  techPursueStatus,
} from '../src/lib/pursueRank';
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
    category: '',
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
    is_sample: false,
    last_reviewed_at: null,
    created_at: '',
    updated_at: '',
    ...partial,
  } as Technology;
}

describe('pursue ranking', () => {
  test('unpicked ranks above shortlisted and archived', () => {
    const rows = rankPursueItems([
      { item: 'a', status: 'done' as const, score: 99 },
      { item: 'b', status: 'progress' as const, score: 90 },
      { item: 'c', status: 'unpicked' as const, score: 40 },
      { item: 'd', status: 'unpicked' as const, score: 70 },
    ]);
    expect(rows.map(r => r.item)).toEqual(['d', 'c', 'b', 'a']);
  });

  test('techPursueStatus maps shortlist/archive', () => {
    expect(techPursueStatus(tech({ id: '1', name: 'x', shortlisted: false }), false)).toBe('unpicked');
    expect(techPursueStatus(tech({ id: '1', name: 'x', shortlisted: true }), false)).toBe('progress');
    expect(techPursueStatus(tech({ id: '1', name: 'x' }), true)).toBe('progress');
    expect(techPursueStatus(tech({ id: '1', name: 'x', archived: true }), false)).toBe('done');
  });

  test('patentPromiseScore favors unused-looking IP', () => {
    const strong = patentPromiseScore(tech({
      id: '1',
      name: 'Sensor',
      patent_numbers: 'US123',
      lab_name: 'State University',
      licensing_status: 'unknown',
      maturity: 'TRL 3',
      customers: '',
    }));
    const weak = patentPromiseScore(tech({
      id: '2',
      name: 'Widget',
      patent_numbers: '',
      lab_name: 'Acme Corp',
      licensing_status: 'licensed_elsewhere',
      description: 'Already on the market commercial product',
      customers: 'Many buyers',
    }));
    expect(strong).toBeGreaterThan(weak);
  });

  test('sbirPromiseScore boosts federal agency tech', () => {
    const fed = sbirPromiseScore(tech({ id: '1', name: 'A', agency: 'NASA', lab_name: 'NASA Lab' }), undefined, null);
    const plain = sbirPromiseScore(tech({ id: '2', name: 'B' }), undefined, null);
    expect(fed).toBeGreaterThan(plain);
  });

  test('splitPursueSections separates acted items', () => {
    const ranked = rankPursueItems([
      { item: 1, status: 'unpicked' as const, score: 50 },
      { item: 2, status: 'progress' as const, score: 80 },
    ]);
    const { unpicked, acted } = splitPursueSections(ranked);
    expect(unpicked.map(r => r.item)).toEqual([1]);
    expect(acted.map(r => r.item)).toEqual([2]);
  });
});
