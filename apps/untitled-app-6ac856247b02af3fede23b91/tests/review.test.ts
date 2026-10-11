import { test, expect } from 'bun:test';
import { PROGRAMS, programDaysLeft, rankPrograms } from '../src/lib/programs';
import { proposalMarkdown } from '../src/lib/export';
import type { Opportunity, Proposal, ProposalSection } from '../src/lib/types';

test('STEP closes at 5pm Eastern, not midnight', () => {
  const step = PROGRAMS.find(p => p.id === 'nci_step')!;
  expect(programDaysLeft(step, new Date('2026-10-11T23:59:00-04:00'))).toBe(1);
  expect(programDaysLeft(step, new Date('2026-10-12T16:59:59-04:00'))).toBe(0);
  expect(programDaysLeft(step, new Date('2026-10-12T17:00:00-04:00'))).toBe(-1);
});
test('NASA-specific help outranks generic help for a NASA license', () => {
  const r = rankPrograms({ profile: {}, techAgency: 'NASA', targetAgencies: new Set(), stage: 'license' });
  expect(r[0].program.id).toBe('nasa_startup_license');
});
test('unrelated cancer project is not matched to DOE just because of lab origin', () => {
  const r = rankPrograms({ profile: { areas: ['cancer'], award: 'none' }, techAgency: 'DOE', targetAgencies: new Set(['NIH']), stage: 'propose' });
  expect(r.find(x => x.program.id === 'doe_phase0')?.fit.level).toBe('no');
});
test('export preserves sample, evidence and requirement caveats', () => {
  const doc = proposalMarkdown({ title: '[SAMPLE] Demo', status: 'drafting' } as Proposal, { is_sample: true, close_date: '2026-11-01' } as Opportunity, [{ title: 'Budget', status: 'needs_evidence', required_status: 'confirm_in_solicitation', draft: '$240,000 estimate', draft_is_ai_generated: true, evidence_needed: 'Quotes' } as ProposalSection]);
  expect(doc).toContain('Do not submit'); expect(doc).toContain('fictional'); expect(doc).toContain('Quotes'); expect(doc).toContain('confirm_in_solicitation'); expect(doc).toContain('AI-generated');
});
