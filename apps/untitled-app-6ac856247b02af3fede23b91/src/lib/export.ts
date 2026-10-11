import type { Opportunity, Proposal, ProposalSection } from './types';

export function proposalMarkdown(p: Proposal, o: Opportunity | undefined, sections: ProposalSection[]): string {
  return [
    `# ${p.title}`,
    o?.is_sample ? '**[SAMPLE] Fictional practice material. Not a real solicitation, verified evidence or application. Do not submit.**' : '**WORKING DRAFT: not reviewed or ready for submission. Confirm every requirement against the current solicitation.**',
    `Exported: ${new Date().toISOString()}`,
    `Status: ${p.status}.\nDeadline: ${o?.close_date ?? 'Not recorded'} (${o?.is_sample ? 'fictional' : o?.deadline_verified ? 'marked verified in saved record; recheck current official page' : 'unverified'}).`,
    `Official source: ${o?.source_url || 'None recorded'}`,
    'This export contains saved text only. Save any open edits first. Uploaded attachments are not included.',
    '## Review checklist',
    ...sections.map(s => `- [${s.status === 'complete' ? 'x' : ' '}] ${s.title}: ${s.status}; requirement: ${s.required_status}`),
    ...sections.map(s => `## ${s.title}\n\nRequirement: ${s.required_status}\nReference: ${s.solicitation_reference || 'Not confirmed'}\nStatus: ${s.status}\n${s.draft_is_ai_generated ? '\nContains AI-generated text. Verify all claims.\n' : ''}\n${s.draft || '(No draft yet.)'}\n\nEvidence still needed: ${s.evidence_needed || 'None recorded; this does not establish readiness.'}`),
  ].join('\n\n');
}

export function downloadMarkdown(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = `${name.replace(/[^a-z0-9-]+/gi, '-').slice(0, 100)}.md`;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
