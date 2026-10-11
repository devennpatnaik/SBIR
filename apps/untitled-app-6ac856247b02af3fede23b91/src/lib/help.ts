import { useMemo } from 'react';
import { insertRow, invalidate, useQuery } from './data';
import { client } from '../client';
import { normalizeAgency, programById, rankPrograms, stageOf, type Agency, type FitContext, type HelpProfile, type Program, type Ranked, type Stage } from './programs';
import { useSettings } from './settings';
import type { Opportunity, Project, ProgramTracking, ProjectOpportunity, Technology } from './types';

/** Everything needed to decide which public programs fit the user and the given project. */
export function useHelp(projectId: string | null | undefined, stageOverride?: Stage) {
  const settings = useSettings();
  const id = projectId ?? '';
  const on = !!projectId;
  const project = useQuery<Project>('projects', q => q.eq('id', id), [id], on);
  const p = project.data[0];
  const tech = useQuery<Technology>('technologies', q => q.select('id,agency,lab_name,name').eq('id', p?.technology_id ?? ''), [p?.technology_id], !!p);
  const links = useQuery<ProjectOpportunity>('project_opportunities', q => q.select('opportunity_id,status').eq('project_id', id), [id], on);
  const oppIds = links.data.filter(l => l.status !== 'rejected').map(l => l.opportunity_id);
  const opps = useQuery<Opportunity>('opportunities', q => q.select('id,agency').in('id', oppIds), [oppIds.join(',')], oppIds.length > 0);
  const tracking = useQuery<ProgramTracking>('program_tracking', q => (on ? q.eq('project_id', id) : q.is('project_id', null)).order('updated_at', { ascending: false }), [id]);

  const profile = settings.helpProfile;
  const techAgency = normalizeAgency(tech.data[0]?.agency);
  const ctx: FitContext = useMemo(() => {
    const targets = new Set<Agency>(profile.agencies ?? []);
    for (const o of opps.data) { const a = normalizeAgency(o.agency); if (a) targets.add(a); }
    return { profile, techAgency, targetAgencies: targets, stage: stageOverride ?? stageOf(p?.status) };
  }, [profile, techAgency, opps.data, stageOverride, p?.status]);
  const ranked: Ranked[] = useMemo(() => rankPrograms(ctx), [ctx]);
  const profileSet = !!(profile.award || profile.agencies?.length || profile.areas?.length);
  return { loading: settings.loading || project.loading || tracking.loading, project: p, ctx, ranked, tracking: tracking.data, profile, profileSet, techName: tech.data[0]?.name };
}

export async function saveHelpProfile(profile: HelpProfile) {
  const { saveSettings } = await import('./settings');
  await saveSettings({ help_profile: profile });
}

/** Creates or updates the user's tracking row for a program on a project (or with no project). */
export async function trackProgram(projectId: string | null, programId: string, status: string, existing?: ProgramTracking) {
  if (existing) {
    const res = await client.from('program_tracking').update({ status, updated_at: new Date().toISOString() }).eq('id', existing.id);
    if (res.error) throw new Error(res.error.message);
    invalidate();
    return;
  }
  await insertRow('program_tracking', { project_id: projectId, program_id: programId, status });
}

export async function saveTrackingNotes(row: ProgramTracking, notes: string) {
  const res = await client.from('program_tracking').update({ notes, updated_at: new Date().toISOString() }).eq('id', row.id);
  if (res.error) throw new Error(res.error.message);
  invalidate();
}

export async function untrackProgram(row: ProgramTracking) {
  const res = await client.from('program_tracking').delete().eq('id', row.id);
  if (res.error) throw new Error(res.error.message);
  invalidate();
}

const AREA_OF_KIND: Record<string, string> = { licensing_help: 'licensing', tech_search: 'validation', proposal_help: 'proposal', funding_help: 'funding', training: 'validation', mentoring: 'general', legal: 'commercialization', manufacturing: 'commercialization', fellowship: 'funding' };

/** Adds a project task to apply to / use the program, due on its verified deadline when it has one, and links it. */
export async function addProgramTask(projectId: string, program: Program, row?: ProgramTracking) {
  const due = program.timing.type === 'deadline' ? program.timing.date : null;
  const task = await insertRow<{ id: string }>('tasks', {
    project_id: projectId,
    title: `${program.kind === 'tech_search' || program.kind === 'mentoring' ? 'Use' : 'Apply to'}: ${program.name}`,
    description: `${program.summary}\n\nTiming: ${program.timing.label}\nEligibility: ${program.eligibility}\nOfficial page: ${program.url}`,
    area: AREA_OF_KIND[program.kind] ?? 'general',
    due_date: due,
    priority: due ? 1 : 2,
  });
  if (row) {
    await client.from('program_tracking').update({ task_id: task.id, status: row.status === 'considering' ? 'preparing' : row.status, updated_at: new Date().toISOString() }).eq('id', row.id);
  } else {
    await insertRow('program_tracking', { project_id: projectId, program_id: program.id, status: 'preparing', task_id: task.id });
  }
  invalidate();
}

export { programById };
