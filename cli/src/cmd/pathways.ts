import { PATHWAYS, pathwayByKey } from '../../../packages/pathways/index.ts';
import { flag, type Args } from '../args.ts';
import { api, CliError, rows } from '../api.ts';
import { readSession } from '../session.ts';
import type { Ask } from './account.ts';
import { clip, emit, jsonMode, paragraph, printLines } from '../format.ts';

const GOALS = ['discover', 'rights', 'funding', 'customers'] as const;
const COMPANIES = ['none', 'company', 'partner'] as const;

type PlanResult = { projectId?: string; pathwayId?: string; pathwayKey?: string; id?: string; created?: boolean };

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function catalogText(key?: string): string {
  if (!key) {
    return PATHWAYS.map(path => `${path.key}\n  ${path.name} — ${clip(path.summary, 110)}`).join('\n');
  }
  const path = pathwayByKey(key);
  if (!path) throw new CliError(`Unknown pathway "${key}". Run: pathways`);
  const steps = path.steps.map((step, index) => `${index + 1}. ${step.title}\n   ${paragraph(step.description)}`).join('\n');
  const sources = path.sources.map(source => `${source.label}: ${source.url}`).join('\n');
  return [
    path.name,
    path.category,
    '',
    paragraph(path.summary),
    '',
    paragraph(path.money),
    '',
    paragraph(path.boundary),
    '',
    'Steps',
    steps,
    '',
    `Sources checked ${path.checked_on}`,
    sources,
  ].join('\n');
}

export async function pathways(args: Args): Promise<void> {
  const sub = args._[1];
  const json = jsonMode(args);
  if (!sub) {
    emit(json, { items: PATHWAYS.map(path => ({ key: path.key, name: path.name, summary: path.summary, category: path.category })) }, catalogText());
    return;
  }
  if (sub === 'show') {
    const key = args._[2];
    if (!key) throw new CliError('Use: pathways show <key>');
    const path = pathwayByKey(key);
    if (!path) throw new CliError(`Unknown pathway "${key}".`);
    emit(json, path, catalogText(key));
    return;
  }
  if (sub === 'saved') {
    const project = flag(args, 'project');
    const query = project ? `project_id=eq.${project}&order=updated_at.desc` : 'order=updated_at.desc';
    const saved = await rows<{ id: string; project_id: string; pathway_key: string; status: string }>('project_pathways', query);
    printLines(
      saved.map(row => ({
        title: `${row.pathway_key} · ${row.status}`,
        meta: row.project_id,
        command: `pathways run ${row.id} research`,
      })),
      json,
      { items: saved },
      'No pathway plans yet. pathways plan <projectId> <key>',
    );
    return;
  }
  if (sub === 'plan') {
    const projectId = args._[2];
    const pathwayKey = args._[3];
    if (!projectId || !pathwayKey) throw new CliError('Use: pathways plan <projectId> <key>');
    if (!pathwayByKey(pathwayKey)) throw new CliError(`Unknown pathway "${pathwayKey}".`);
    const result = await api<PlanResult>('/pathways/plan', { body: { projectId, pathwayKey } });
    const id = result.id;
    emit(json, result, id
      ? `${result.created === false ? 'Already planned' : 'Plan created'} ${id}.\n  pathways run ${id} research`
      : JSON.stringify(result, null, 2));
    return;
  }
  if (sub === 'run') {
    const pathwayId = args._[2];
    const action = args._[3] ?? 'research';
    if (!pathwayId) throw new CliError('Use: pathways run <pathwayId> research|draft|review');
    await runPathway(pathwayId, action, json);
    return;
  }
  throw new CliError('Use: pathways | pathways show <key> | pathways saved | pathways plan <projectId> <key> | pathways run <pathwayId> research|draft|review');
}

export async function runPathway(pathwayId: string, action: string, json: boolean, extra: Record<string, unknown> = {}): Promise<void> {
  if (!['research', 'draft', 'review'].includes(action)) throw new CliError('Action must be research, draft, or review.');
  const started = await api<{ id: string; created: boolean }>('/pathways/run', {
    body: { pathwayId, action, requestKey: crypto.randomUUID() },
  });
  const run = await waitRun(started.id);
  if (run.status === 'failed') throw new CliError(run.error || 'The pathway run failed. Your saved plan is unchanged.');
  const docs = await rows<{ id: string; title: string; body: string }>('documents', `workflow_run_id=eq.${started.id}&order=created_at.desc`);
  const doc = docs[0];
  const payload = { ...extra, runId: started.id, status: run.status, document: doc ?? null };
  if (json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  if (!doc) {
    console.log(`Run ${started.id} is ${run.status}, and no document was stored.`);
    return;
  }
  console.log(`# ${doc.title}\n`);
  console.log(doc.body);
  console.log(`\nSaved as document ${doc.id}`);
}

async function waitRun(id: string): Promise<{ status: string; error: string }> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const run = await api<{ status?: string; error?: string } | null>(`/pathways/runs/${id}`);
    const status = run?.status ?? '';
    if (status && status !== 'running') return { status, error: run?.error ?? '' };
    await sleep(500);
  }
  throw new CliError(`Still running. Check later, or read documents for run ${id}.`);
}

async function choose(ask: Ask, label: string, options: readonly string[]): Promise<string> {
  options.forEach((option, index) => console.log(`  ${index + 1}  ${option}`));
  const picked = (await ask(`${label}: `)).trim();
  const option = options[Number(picked) - 1];
  if (!option) throw new CliError(`Pick 1–${options.length}.`);
  return option;
}

export async function kickoff(args: Args, ask: Ask): Promise<void> {
  if (!readSession().token) throw new CliError('Sign in first: ./lab-to-market signin --email you@example.com');
  let path = flag(args, 'path');
  let idea = flag(args, 'idea');
  const source = flag(args, 'source') ?? '';
  let goal = flag(args, 'goal');
  let company = flag(args, 'company');
  const role = flag(args, 'role') ?? 'founder';
  const scripted = Boolean(idea);

  if (!scripted) {
    if (!process.stdin.isTTY) throw new CliError('Pass --path sbir|explore and --idea "...".');
    if (!path) path = await choose(ask, 'Track', ['sbir', 'explore']);
    idea = (await ask(path === 'sbir' ? 'What would you like to build? ' : 'What would you like to make possible? ')).trim();
    if (path === 'sbir' && !company) company = await choose(ask, 'Where does your company stand?', COMPANIES);
    if (path !== 'sbir' && !goal) goal = await choose(ask, 'What would help most right now?', GOALS);
  }

  path = path || 'sbir';
  if (path !== 'sbir' && path !== 'explore') throw new CliError('--path must be sbir or explore.');
  if (!idea || idea.trim().length < 3) throw new CliError('The idea needs at least 3 characters.');
  if (path === 'sbir') {
    company = company || 'none';
    goal = 'funding';
    if (!COMPANIES.includes(company as typeof COMPANIES[number])) throw new CliError('--company must be none, company, or partner.');
  } else {
    goal = goal || 'discover';
  }
  if (!GOALS.includes(goal as typeof GOALS[number])) throw new CliError('--goal must be discover, rights, funding, or customers.');
  if (source && !/^https?:\/\/\S+$/i.test(source)) throw new CliError('Source must be an http(s) link, or omit it.');

  const answers = {
    path,
    idea: idea.trim(),
    starting: source ? 'link' : 'idea',
    source,
    goal,
    role: role === 'investor' ? 'investor' : 'founder',
    ...(path === 'sbir' ? { company: company ?? 'none' } : {}),
  };
  const plan = await api<PlanResult>('/pathways/kickoff', { body: { requestKey: crypto.randomUUID(), answers } });
  const projectId = plan.projectId;
  const pathwayId = plan.pathwayId;
  if (!projectId || !pathwayId) throw new CliError('The plan was not created.');
  if (!jsonMode(args)) {
    console.log(`Saved “${idea.trim().slice(0, 80)}”.\n  project show ${projectId}`);
    console.log('\nResearching from what you wrote. Nothing is sent or submitted.\n');
  }
  try {
    await runPathway(pathwayId, 'research', jsonMode(args), { projectId, pathwayId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CliError(`Plan saved (${projectId}) but research did not finish: ${message}\nRetry: ./lab-to-market pathways run ${pathwayId} research`);
  }
}
