import { client } from '../client';
import { LICENSING_TOPICS, PROPOSAL_TEMPLATE, STARTER_TASKS } from './constants';
import { insertRow, insertRows, invalidate, nowIso, updateRow } from './data';
import type { Lab, Opportunity, Project, Proposal, Technology } from './types';

/** Finds the user's lab record by name, creating it if needed. */
export async function ensureLab(name: string, agency: string): Promise<Lab | null> {
  if (!name.trim()) return null;
  const { data } = await client.from('labs').select('*').ilike('name', name.trim()).limit(1);
  if (data && data.length) return data[0] as Lab;
  return insertRow<Lab>('labs', { name: name.trim(), agency });
}

/** "Select this technology": creates the persistent project with its starter roadmap. Idempotent per technology. */
export async function selectTechnology(tech: Technology): Promise<Project> {
  const existing = await client.from('projects').select('*').eq('technology_id', tech.id).limit(1);
  if (existing.data && existing.data.length) return existing.data[0] as Project;

  const lab = tech.lab_id ? null : await ensureLab(tech.lab_name, tech.agency);
  const labId = tech.lab_id ?? lab?.id ?? null;
  if (lab && !tech.lab_id) await client.from('technologies').update({ lab_id: lab.id }).eq('id', tech.id);

  const project = await insertRow<Project>('projects', {
    technology_id: tech.id,
    lab_id: labId,
    name: tech.name,
    application_summary: tech.applications,
    target_customer: tech.customers,
    licensing_status: 'not_started',
  });
  await insertRows('status_history', [{ project_id: project.id, from_status: null, to_status: 'technology_selected', reason: 'Technology selected from comparison.' }]);
  await insertRows('tasks', STARTER_TASKS.map(t => ({ ...t, project_id: project.id, created_by: 'template' })));
  await insertRows('licensing_items', LICENSING_TOPICS.map((t, i) => ({ ...t, project_id: project.id, sort: i })));
  const qs = tech.open_questions.split('\n').map(s => s.replace(/^[-*•\d.)\s]+/, '').trim()).filter(Boolean);
  await insertRows('questions', qs.map(text => ({ project_id: project.id, technology_id: tech.id, text, area: 'general' })));
  if (tech.source_url) {
    await insertRows('sources', [{ project_id: project.id, technology_id: tech.id, claim: `Original listing for ${tech.name}`, field: 'listing', url: tech.source_url, evidence_level: 'sourced' }]);
  }
  invalidate();
  return project;
}

/** Creates a proposal workspace for an opportunity with a checklist of sections to confirm against the solicitation. */
export async function createProposal(project: Project, opp: Opportunity): Promise<Proposal> {
  const existing = await client.from('proposals').select('*').eq('project_id', project.id).eq('opportunity_id', opp.id).limit(1);
  let proposal = existing.data?.[0] as Proposal | undefined;
  if (proposal) {
    // Recover from an earlier partial creation: only seed the checklist when it is missing.
    const secs = await client.from('proposal_sections').select('id').eq('proposal_id', proposal.id).limit(1);
    if (secs.data && secs.data.length) return proposal;
  } else proposal = await insertRow<Proposal>('proposals', {
    project_id: project.id, opportunity_id: opp.id,
    title: `${opp.program} ${opp.phase || ''} — ${opp.topic_number ? opp.topic_number + ' ' : ''}${opp.topic_title}`.replace(/\s+/g, ' ').trim(),
  });
  const pid = proposal.id;
  const docs = opp.required_documents.split('\n').map(s => s.replace(/^[-*•\d.)\s]+/, '').trim()).filter(Boolean);
  const fromSolicitation = docs.map((d, i) => ({ proposal_id: pid, title: d, kind: 'document', required_status: 'confirmed_required', solicitation_reference: 'Listed in the saved solicitation record', sort: i }));
  const template = PROPOSAL_TEMPLATE.map((t, i) => {
    const partner = t.title.startsWith('Research partners');
    return {
      proposal_id: pid, title: t.title, kind: t.kind, sort: 100 + i,
      guidance: partner && opp.program === 'STTR' ? `${t.guidance} STTR requires a research-institution partner by law; the solicitation states the required work split.` : t.guidance,
      required_status: partner && opp.program === 'STTR' ? 'confirmed_required' : 'confirm_in_solicitation',
      solicitation_reference: partner && opp.program === 'STTR' ? 'STTR program requirement (15 U.S.C. 638); confirm details in solicitation' : '',
    };
  });
  await insertRows('proposal_sections', [...fromSolicitation, ...template]);
  await insertRows('tasks', [
    { project_id: project.id, proposal_id: pid, opportunity_id: opp.id, area: 'proposal', priority: 1, title: `Download and read the full solicitation for ${opp.topic_number || opp.topic_title}`, description: 'Save it on the Documents page and mark each checklist item as confirmed required / not required.', created_by: 'template' },
    { project_id: project.id, proposal_id: pid, opportunity_id: opp.id, area: 'proposal', priority: 1, title: 'Re-confirm the submission deadline on the official agency page', description: 'Deadlines and amendments change. Record the URL and date checked.', due_date: opp.close_date, created_by: 'template' },
  ]);
  invalidate();
  return proposal;
}

export async function recordStatusChange(project: Project, to: string, reason: string) {
  await updateRow('projects', project.id, { status: to, updated_at: nowIso() });
  await insertRows('status_history', [{ project_id: project.id, from_status: project.status, to_status: to, reason }]);
}
