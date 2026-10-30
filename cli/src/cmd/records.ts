import { answeredCount, answersFromOutcome, OUTCOME_QUESTIONS, type OutcomeAnswers } from '../../../packages/learning/index.ts';
import type { CohortInsights } from '../../../packages/learning/index.ts';
import { statusLabel, TECH_LICENSING_STATUS } from '../../../apps/untitled-app-6ac856247b02af3fede23b91/src/lib/constants.ts';
import { summarize } from '../../../apps/untitled-app-6ac856247b02af3fede23b91/src/lib/scoring.ts';
import { rankPrograms, type Stage } from '../../../apps/untitled-app-6ac856247b02af3fede23b91/src/lib/programs.ts';
import type { Evaluation, InvestigationOutcome, Project, Task, Technology } from '../../../apps/untitled-app-6ac856247b02af3fede23b91/src/lib/types.ts';
import { flag, on, type Args } from '../args.ts';
import { api, CliError, rest, rows } from '../api.ts';
import type { Ask } from './account.ts';
import { clip, emit, heading, jsonMode, paragraph, printLines } from '../format.ts';
import { hints } from '../model/hints.ts';

const STAGES = new Set(['discover', 'license', 'propose', 'awarded']);

function need(value: string | undefined, label: string): string {
  if (!value) throw new CliError(`Missing ${label}.`);
  return value;
}

function licenseLabel(status: string): string {
  return TECH_LICENSING_STATUS[status] ?? (status || 'Unknown');
}

export async function techList(args: Args): Promise<void> {
  const query = on(args, 'shortlisted')
    ? 'archived=eq.false&shortlisted=eq.true&order=updated_at.desc'
    : 'archived=eq.false&order=updated_at.desc';
  const techs = await rows<Technology>('technologies', query);
  printLines(
    techs.map(tech => ({
      title: tech.name || 'Untitled',
      meta: [tech.agency, tech.lab_name, licenseLabel(tech.licensing_status), tech.shortlisted ? 'shortlisted' : ''].filter(Boolean).join(' · '),
      command: `tech show ${tech.id}`,
    })),
    jsonMode(args),
    { items: techs.map(tech => ({ id: tech.id, name: tech.name, agency: tech.agency, lab: tech.lab_name, licensing: tech.licensing_status, shortlisted: tech.shortlisted })) },
    'No technologies yet. Search patents, or start with kickoff.',
  );
}

async function oneTech(id: string): Promise<Technology> {
  const found = await rows<Technology>('technologies', `id=eq.${id}`);
  const tech = found[0];
  if (!tech) throw new CliError(`No technology ${id}.`);
  return tech;
}

export async function techShow(id: string, json: boolean): Promise<{ shortlisted: boolean; projectId: string | null; name: string }> {
  const tech = await oneTech(id);
  const [projects, outcomes, evals] = await Promise.all([
    rows<Project>('projects', `technology_id=eq.${id}&archived=eq.false&select=id,name,status,business_thesis`),
    rows<InvestigationOutcome>('investigation_outcomes', `technology_id=eq.${id}`),
    rows<Evaluation>('evaluations', `technology_id=eq.${id}`),
  ]);
  const project = projects[0];
  const tasks = project
    ? await rows<Task>('tasks', `project_id=eq.${project.id}&order=priority.asc`)
    : [];
  const openTasks = tasks.filter(task => task.status !== 'done' && task.status !== 'skipped');
  const outcome = outcomes[0];
  const answered = outcome ? answeredCount(outcome) : 0;
  const score = summarize(evals[0], tech);
  const next = hints({
    hasProject: Boolean(project),
    thesis: project?.business_thesis ?? '',
    licensingStatus: tech.licensing_status,
    outcomeAnswered: answered,
    openTasks: openTasks.map(task => task.title),
  });
  const payload = {
    technology: tech,
    project: project ?? null,
    score,
    outcome: outcome ?? null,
    next,
  };
  if (json) {
    console.log(JSON.stringify(payload, null, 2));
    return { shortlisted: tech.shortlisted, projectId: project?.id ?? null, name: tech.name };
  }
  console.log(tech.name || 'Untitled technology');
  console.log([tech.agency, tech.lab_name, tech.category].filter(Boolean).join(' · ') || 'No agency recorded');
  console.log(`Licensing: ${licenseLabel(tech.licensing_status)}`);
  if (tech.patent_numbers) console.log(`Patents: ${tech.patent_numbers}`);
  if (tech.maturity) console.log(`Maturity: ${tech.maturity}`);
  console.log(score.overall == null ? 'Score: not scored' : `Score: ${score.overall} (${score.confidence}, ${score.scored}/${score.total} dimensions)`);
  if (tech.description) console.log(`\n${paragraph(clip(tech.description, 700))}`);
  if (tech.source_url) console.log(`\nSource: ${tech.source_url}`);
  if (project) console.log(`\nProject: ${project.name} · ${statusLabel(project.status)}\n  project show ${project.id}`);
  if (tech.is_sample) console.log('\nThis is sample data. Do not contact the fictional office or submit anything from it.');
  heading('Next');
  for (const line of next) console.log(`• ${line}`);
  console.log(`\noutcomes show ${tech.id}`);
  return { shortlisted: tech.shortlisted, projectId: project?.id ?? null, name: tech.name };
}

async function setShortlist(id: string, shortlisted: boolean, json: boolean): Promise<void> {
  await oneTech(id);
  await rest('technologies', `id=eq.${id}`, { method: 'PATCH', body: { shortlisted } });
  emit(json, { id, shortlisted }, shortlisted ? `Shortlisted ${id}` : `Removed ${id} from the shortlist`);
}

export async function techArchive(id: string, json: boolean): Promise<void> {
  await oneTech(id);
  await rest('technologies', `id=eq.${id}`, { method: 'PATCH', body: { archived: true } });
  emit(json, { id, archived: true }, `Archived ${id}`);
}

export async function techCommand(restArgs: string[], args: Args): Promise<void> {
  const action = restArgs[0] ?? 'list';
  const json = jsonMode(args);
  if (action === 'list') return techList(args);
  const id = need(restArgs[1], 'a technology id');
  if (action === 'show') return techShow(id, json);
  if (action === 'shortlist') return setShortlist(id, true, json);
  if (action === 'unshortlist') return setShortlist(id, false, json);
  if (action === 'archive') return techArchive(id, json);
  throw new CliError('Use: tech list | tech show <id> | tech shortlist <id> | tech unshortlist <id> | tech archive <id>');
}

export async function compare(args: Args): Promise<void> {
  const [techs, evals] = await Promise.all([
    rows<Technology>('technologies', 'archived=eq.false&order=updated_at.desc'),
    rows<Evaluation>('evaluations'),
  ]);
  const ranked = techs.map(tech => {
    const summary = summarize(evals.find(ev => ev.technology_id === tech.id), tech);
    return { tech, summary };
  }).sort((a, b) => (b.summary.overall ?? -1) - (a.summary.overall ?? -1));
  printLines(
    ranked.map(row => ({
      title: `${row.summary.overall == null ? '  —' : String(row.summary.overall).padStart(3)}  ${row.tech.name}`,
      meta: `${row.summary.confidence} · ${row.summary.scored}/${row.summary.total} scored${row.summary.risks[0] ? ` · risk: ${row.summary.risks[0]}` : ''}`,
      command: `tech show ${row.tech.id}`,
    })),
    jsonMode(args),
    { items: ranked.map(row => ({ id: row.tech.id, name: row.tech.name, overall: row.summary.overall, confidence: row.summary.confidence, scored: row.summary.scored, risks: row.summary.risks, missing: row.summary.missing })) },
    'No technologies to compare.',
  );
}

export async function projectList(args: Args): Promise<void> {
  const projects = await rows<Project>('projects', 'archived=eq.false&order=updated_at.desc');
  printLines(
    projects.map(project => ({
      title: project.name,
      meta: statusLabel(project.status),
      command: `project show ${project.id}`,
    })),
    jsonMode(args),
    { items: projects.map(project => ({ id: project.id, name: project.name, status: project.status, technologyId: project.technology_id })) },
    'No projects yet. Start one with kickoff.',
  );
}

export async function projectShow(id: string, json: boolean): Promise<{ id: string; title: string; status: string }[]> {
  const found = await rows<Project>('projects', `id=eq.${id}`);
  const project = found[0];
  if (!project) throw new CliError(`No project ${id}.`);
  const tasks = await rows<Task>('tasks', `project_id=eq.${id}&order=priority.asc`);
  const open = tasks.filter(task => task.status !== 'done' && task.status !== 'skipped');
  if (json) {
    console.log(JSON.stringify({ project, tasks }, null, 2));
    return open.map(task => ({ id: task.id, title: task.title, status: task.status }));
  }
  console.log(project.name);
  console.log(statusLabel(project.status));
  if (project.business_thesis) console.log(`\n${paragraph(project.business_thesis)}`);
  if (project.problem && project.problem !== project.business_thesis) console.log(`\nProblem\n${paragraph(project.problem)}`);
  heading('Open tasks');
  if (!open.length) console.log('None.');
  open.forEach((task, index) => {
    console.log(`${String(index + 1).padStart(2)}  ${task.title}${task.due_date ? `  due ${task.due_date}` : ''}`);
    console.log(`    tasks done ${task.id}`);
  });
  if (project.technology_id) console.log(`\ntech show ${project.technology_id}`);
  return open.map(task => ({ id: task.id, title: task.title, status: task.status }));
}

export async function projectCommand(restArgs: string[], args: Args): Promise<void> {
  const action = restArgs[0] ?? 'list';
  if (action === 'list') return projectList(args);
  if (action === 'show') {
    await projectShow(need(restArgs[1], 'a project id'), jsonMode(args));
    return;
  }
  throw new CliError('Use: project list | project show <id>');
}

export async function tasksDone(id: string, json: boolean): Promise<void> {
  const found = await rows<Task>('tasks', `id=eq.${id}&select=id,title,status`);
  if (!found[0]) throw new CliError(`No task ${id}.`);
  await rest('tasks', `id=eq.${id}`, {
    method: 'PATCH',
    body: { status: 'done', completed_at: new Date().toISOString() },
  });
  emit(json, { id, status: 'done' }, `Marked done: ${found[0].title}`);
}

type OutcomeRow = InvestigationOutcome | null;

export async function outcomesShow(id: string, json: boolean): Promise<OutcomeRow> {
  const body = await api<{ outcome: InvestigationOutcome | null }>(`/learning/outcomes?technologyId=${id}`);
  const outcome = body.outcome;
  if (json) {
    console.log(JSON.stringify({ outcome }, null, 2));
    return outcome;
  }
  if (!outcome) {
    console.log('No outcomes recorded yet.');
  } else {
    console.log(`${answeredCount(outcome)}/5 answered`);
    for (const question of OUTCOME_QUESTIONS) {
      const value = outcome[question.key];
      const label = question.options.find(option => option.value === value)?.label ?? String(value ?? 'unknown');
      console.log(`• ${question.label}\n  ${label}`);
    }
    if (outcome.notes) console.log(`\nNotes\n${paragraph(outcome.notes)}`);
  }
  console.log(`\nRecord answers with:\n  outcomes set ${id} --lab-responded pending`);
  return outcome;
}

const FLAG_TO_KEY: Record<string, keyof OutcomeAnswers> = {
  'lab-responded': 'lab_responded',
  'license-available': 'license_available',
  'tech-dd': 'tech_dd_result',
  'sbir-award': 'sbir_award',
  'customer-interest': 'customer_interest',
};

function applyFlags(base: OutcomeAnswers, args: Args): OutcomeAnswers {
  const next = { ...base };
  let touched = false;
  for (const [name, key] of Object.entries(FLAG_TO_KEY)) {
    const value = flag(args, name);
    if (!value) continue;
    const question = OUTCOME_QUESTIONS.find(item => item.key === key);
    const allowed = question?.options.map(option => option.value) ?? [];
    if (!allowed.includes(value)) {
      throw new CliError(`--${name} must be one of: ${allowed.join(', ')}`);
    }
    (next[key] as string) = value;
    touched = true;
  }
  const notes = flag(args, 'notes');
  const evidence = flag(args, 'evidence-url');
  if (notes != null) { next.notes = notes; touched = true; }
  if (evidence != null) { next.evidence_url = evidence; touched = true; }
  if (!touched) throw new CliError('Pass at least one answer, for example --lab-responded pending');
  return next;
}

export async function outcomesSet(id: string, args: Args): Promise<void> {
  const existing = await api<{ outcome: InvestigationOutcome | null }>(`/learning/outcomes?technologyId=${id}`);
  const tech = await oneTech(id);
  const projects = await rows<Pick<Project, 'id'>>('projects', `technology_id=eq.${id}&archived=eq.false&select=id`);
  const base = answersFromOutcome(existing.outcome);
  const answers = applyFlags(base, args);
  if (tech.is_sample) answers.contribute_to_learning = false;
  const saved = await api<{ outcome: unknown }>('/learning/outcomes', {
    body: { technologyId: id, projectId: projects[0]?.id ?? null, answers },
  });
  emit(jsonMode(args), saved, `Saved outcomes for ${tech.name}. ${answeredCount(answers)}/5 answered.`);
}

export async function promptOutcomes(id: string, ask: Ask): Promise<void> {
  const existing = await api<{ outcome: InvestigationOutcome | null }>(`/learning/outcomes?technologyId=${id}`);
  const current = existing.outcome;
  console.log('Press enter to keep the current answer.\n');
  const answers: Record<string, string> = {};
  for (const question of OUTCOME_QUESTIONS) {
    console.log(question.label);
    console.log(question.help);
    question.options.forEach((option, index) => console.log(`  ${index + 1}  ${option.label}`));
    const currentValue = current ? String(current[question.key] ?? 'unknown') : 'unknown';
    const picked = (await ask(`Choice [${currentValue}]: `)).trim();
    if (!picked) continue;
    const index = Number(picked);
    const option = question.options[index - 1];
    if (!option) throw new CliError(`Pick 1–${question.options.length}.`);
    answers[question.key] = option.value;
  }
  const notes = (await ask('Notes (optional): ')).trim();
  if (!Object.keys(answers).length && !notes) {
    console.log('Nothing changed.');
    return;
  }
  const flags: Record<string, string | boolean> = {};
  for (const [name, key] of Object.entries(FLAG_TO_KEY)) {
    const value = answers[key];
    if (value) flags[name] = value;
  }
  if (notes) flags.notes = notes;
  await outcomesSet(id, { _: ['outcomes', 'set', id], flags });
}

export async function docs(args: Args): Promise<void> {
  const action = args._[1];
  if (action === 'show') {
    const id = need(args._[2], 'a document id');
    const found = await rows<{ id: string; title: string; kind: string; body: string; project_id: string | null }>('documents', `id=eq.${id}`);
    const doc = found[0];
    if (!doc) throw new CliError(`No document ${id}.`);
    emit(jsonMode(args), doc, `# ${doc.title}\n\n${doc.body}`);
    return;
  }
  const projectId = action && action !== 'list' ? action : flag(args, 'project');
  const query = projectId
    ? `project_id=eq.${projectId}&order=updated_at.desc`
    : 'order=updated_at.desc&limit=40';
  const documents = await rows<{ id: string; title: string; kind: string; project_id: string | null; updated_at: string }>('documents', query);
  printLines(
    documents.map(doc => ({
      title: doc.title || 'Untitled',
      meta: doc.kind,
      command: `docs show ${doc.id}`,
    })),
    jsonMode(args),
    { items: documents },
    'No documents yet. A pathway research run writes one.',
  );
}

export async function insights(args: Args): Promise<void> {
  const agency = flag(args, 'agency') ?? '';
  const category = flag(args, 'category') ?? '';
  const body = await api<{ insights: CohortInsights | null }>(
    `/learning/insights?agency=${encodeURIComponent(agency)}&category=${encodeURIComponent(category)}`,
  );
  const data = body.insights;
  if (jsonMode(args)) {
    console.log(JSON.stringify(body, null, 2));
    return;
  }
  if (!data || data.sampleSize < 3) {
    console.log(`Cohort is too small to adjust scores${data ? ` (${data.sampleSize} recorded)` : ''}. Rankings stay on the technology's own score until at least 3 comparable outcomes exist.`);
    return;
  }
  console.log(`${data.sampleSize} comparable outcomes${agency ? ` · ${agency}` : ''}${category ? ` · ${category}` : ''}`);
  console.log(`Lab replied yes/no: ${data.labRespondedYes}/${data.labRespondedNo}`);
  console.log(`License available yes/no: ${data.licenseAvailableYes}/${data.licenseAvailableNo}`);
  console.log(`Technical review passed/failed: ${data.techDdPassed}/${data.techDdFailed}`);
  console.log(`SBIR award yes/no: ${data.sbirAwardYes}/${data.sbirAwardNo}`);
  console.log(`Customer interest strong/weak/none: ${data.customerInterestStrong}/${data.customerInterestWeak}/${data.customerInterestNone}`);
  console.log('Score adjustments from this cohort stay inside −12 to +12.');
}

export function programLines(stage: Stage) {
  return rankPrograms({
    profile: {},
    techAgency: null,
    targetAgencies: new Set(),
    stage,
  }).filter(row => row.fit.level !== 'no').slice(0, 12);
}

export function programs(args: Args): void {
  const requested = flag(args, 'stage') ?? 'discover';
  if (!STAGES.has(requested)) throw new CliError('--stage must be discover, license, propose, or awarded.');
  const stage = requested as Stage;
  const ranked = programLines(stage);
  printLines(
    ranked.map(row => ({
      title: row.program.name,
      meta: `${row.fit.level} · ${clip(row.program.summary, 110)}`,
      command: row.program.url,
    })),
    jsonMode(args),
    { stage, items: ranked.map(row => ({ id: row.program.id, name: row.program.name, fit: row.fit.level, reasons: row.fit.reasons, url: row.program.url })) },
  );
  if (!jsonMode(args)) console.log('\nConfirm eligibility on the official page. A fit here is not an acceptance.');
}
