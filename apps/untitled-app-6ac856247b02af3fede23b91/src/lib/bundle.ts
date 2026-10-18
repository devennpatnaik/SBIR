import { useQuery } from './data';
import type { Communication, Contact, Evaluation, Interview, InvestigationOutcome, Lab, LicensingItem, Opportunity, Project, ProjectOpportunity, Proposal, ProposalSection, Question, Task, Technology, Agreement, StatusHistory, ProgramTracking } from './types';

export type Bundle = {
  loading: boolean; error: string | null;
  project?: Project; tech?: Technology; evaluation?: Evaluation; lab?: Lab;
  contacts: Contact[]; tasks: Task[]; questions: Question[]; licensing: LicensingItem[]; comms: Communication[];
  links: ProjectOpportunity[]; opps: Opportunity[]; proposals: Proposal[]; sections: ProposalSection[]; interviews: Interview[];
  agreements: Agreement[]; history: StatusHistory[]; programs: ProgramTracking[];
  outcome?: InvestigationOutcome;
};

/** Loads everything the workspace screens and the next-action engine need for one project. */
export function useBundle(projectId: string | null | undefined): Bundle {
  const on = !!projectId;
  const id = projectId ?? '';
  const p = useQuery<Project>('projects', q => q.eq('id', id), [id], on);
  const project = p.data[0];
  const t = useQuery<Technology>('technologies', q => q.eq('id', project?.technology_id ?? ''), [project?.technology_id], !!project);
  const ev = useQuery<Evaluation>('evaluations', q => q.eq('technology_id', project?.technology_id ?? ''), [project?.technology_id], !!project);
  const outcome = useQuery<InvestigationOutcome>('investigation_outcomes', q => q.eq('technology_id', project?.technology_id ?? ''), [project?.technology_id], !!project);
  const lab = useQuery<Lab>('labs', q => q.eq('id', project?.lab_id ?? ''), [project?.lab_id], !!project?.lab_id);
  const contacts = useQuery<Contact>('contacts', q => q.eq('project_id', id).order('created_at'), [id], on);
  const tasks = useQuery<Task>('tasks', q => q.eq('project_id', id).order('priority').order('due_date', { nullsFirst: false }).order('created_at'), [id], on);
  const questions = useQuery<Question>('questions', q => q.eq('project_id', id).order('created_at'), [id], on);
  const licensing = useQuery<LicensingItem>('licensing_items', q => q.eq('project_id', id).order('sort'), [id], on);
  const comms = useQuery<Communication>('communications', q => q.eq('project_id', id).order('created_at', { ascending: false }), [id], on);
  const links = useQuery<ProjectOpportunity>('project_opportunities', q => q.eq('project_id', id), [id], on);
  const oppIds = links.data.map(l => l.opportunity_id);
  const opps = useQuery<Opportunity>('opportunities', q => q.in('id', oppIds), [oppIds.join(',')], oppIds.length > 0);
  const proposals = useQuery<Proposal>('proposals', q => q.eq('project_id', id), [id], on);
  const propIds = proposals.data.map(x => x.id);
  const sections = useQuery<ProposalSection>('proposal_sections', q => q.in('proposal_id', propIds).order('sort'), [propIds.join(',')], propIds.length > 0);
  const interviews = useQuery<Interview>('interviews', q => q.eq('project_id', id).order('interview_date', { ascending: false }), [id], on);
  const agreements = useQuery<Agreement>('agreements', q => q.eq('project_id', id).order('created_at'), [id], on);
  const programs = useQuery<ProgramTracking>('program_tracking', q => q.eq('project_id', id), [id], on);
  const history = useQuery<StatusHistory>('status_history', q => q.eq('project_id', id).order('created_at', { ascending: false }), [id], on);
  const all = [p, t, ev, outcome, lab, contacts, tasks, questions, licensing, comms, links, opps, proposals, sections, interviews, agreements, programs, history];
  return {
    loading: all.some(q => q.loading),
    error: all.find(q => q.error)?.error ?? null,
    project, tech: t.data[0], evaluation: ev.data[0], lab: lab.data[0], outcome: outcome.data[0],
    contacts: contacts.data, tasks: tasks.data, questions: questions.data, licensing: licensing.data, comms: comms.data,
    links: links.data, opps: opps.data, proposals: proposals.data, sections: sections.data, interviews: interviews.data,
    agreements: agreements.data, history: history.data, programs: programs.data,
  };
}
