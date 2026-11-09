/** Frontend helpers for the DFU / chronic wounds match MVP. */
export {
  PROBLEM_SPACE,
  PROBLEM_SPACE_LABEL,
  QUEUE_LABEL,
  encodeSbirStub,
  parseSbirStub,
} from '@project/ontology/dfu-constants';

export type MatchPath = 'outreach' | 'sbir_topic' | 'skip' | '';

export function isDfuLead(t: { category?: string; problem_space?: string | null }): boolean {
  const space = (t.problem_space || t.category || '').toLowerCase();
  return space.includes('dfu') || space.includes('chronic wound') || space.includes('diabetic foot');
}

export function buildOutreachDraft(t: {
  name: string;
  lab_name?: string;
  inventors?: string;
  agency?: string;
  description?: string;
}): string {
  const lab = t.lab_name?.trim() || 'the technology transfer office';
  const who = t.inventors?.trim() ? ` (inventor(s): ${t.inventors.trim()})` : '';
  return [
    `Subject: Evaluation license inquiry — ${t.name}`,
    '',
    `Hello ${lab} team${who},`,
    '',
    'I am a commercializer exploring solutions for diabetic foot ulcers and chronic non-healing wounds.',
    `I came across “${t.name}”${t.agency ? ` (${t.agency})` : ''} and would like to discuss a short evaluation license or research collaboration.`,
    '',
    t.description?.trim()
      ? `What drew my interest: ${t.description.trim().slice(0, 280)}${t.description.trim().length > 280 ? '…' : ''}`
      : '',
    '',
    'Could you share: (1) current licensing status, (2) the right contact for an evaluation agreement, and (3) any existing SBIR/STTR partner interest?',
    '',
    'Thank you — happy to send a one-page company background if useful.',
    '',
    '[Your name]',
    '[Your company / email]',
  ].join('\n');
}
