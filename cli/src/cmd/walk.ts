import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { flag, on, type Args } from '../args.ts';
import { clearWork, draftPaths, loadWork, outreachFile, saveWork } from '../sbir/store.ts';
import {
  applyPatch,
  nextGate,
  openOutreach,
  parseGateAnswer,
  renderStatus,
  where,
  type Award,
  type Company,
  type Deal,
  type Patch,
  type Rights,
  type Route,
  type SbirWork,
  type SourceKind,
  type YesLater,
} from '../sbir/work.ts';
import type { Ask } from './account.ts';

function yesLater(value: string | undefined): YesLater | undefined {
  if (value == null) return undefined;
  const normalized = value.replace(/-/g, '_');
  if (normalized === 'yes' || normalized === 'no' || normalized === 'later') return normalized;
  throw new Error('Use yes, no, or later.');
}

function rightsOf(value: string | undefined): Rights | undefined {
  if (value == null) return undefined;
  const normalized = value.replace(/-/g, '_') as Rights;
  if (normalized === 'not_needed' || normalized === 'asked' || normalized === 'available' || normalized === 'unavailable') return normalized;
  throw new Error('Rights must be not-needed, asked, available, or unavailable.');
}

function companyOf(value: string | undefined): Company | undefined {
  if (value == null) return undefined;
  const normalized = value.replace(/-/g, '_') as Company;
  if (normalized === 'ready' || normalized === 'not_yet' || normalized === 'partner') return normalized;
  throw new Error('Company must be ready, not-yet, or partner.');
}

function awardOf(value: string | undefined): Award | undefined {
  if (value == null) return undefined;
  if (value === 'pending' || value === 'yes' || value === 'no') return value;
  throw new Error('Award must be pending, yes, or no.');
}

function routeOf(value: string | undefined): Route | undefined {
  if (value == null) return undefined;
  if (value === 'patents' || value === 'sbir') return value;
  throw new Error('Route must be patents or sbir.');
}

function kindOf(value: string | undefined): SourceKind | undefined {
  if (value == null) return undefined;
  if (value === 'patent' || value === 'article') return value;
  throw new Error('Kind must be patent or article.');
}

function dealOf(value: string | undefined): Deal | undefined {
  if (value == null) return undefined;
  if (value === 'debt' || value === 'royalties' || value === 'equity') return value;
  throw new Error('Deal must be debt, royalties, or equity.');
}

export function patchFromFlags(args: Args): Patch {
  const submitted = flag(args, 'submitted');
  const phase2Submitted = flag(args, 'phase2-submitted');
  return {
    name: flag(args, 'name'),
    idea: flag(args, 'idea'),
    owner: flag(args, 'owner'),
    skipOwner: on(args, 'skip-owner'),
    source: flag(args, 'source'),
    skipSource: on(args, 'skip-source'),
    rights: rightsOf(flag(args, 'rights')),
    rightsNote: flag(args, 'rights-note'),
    company: companyOf(flag(args, 'company')),
    sam: yesLater(flag(args, 'sam')),
    sbirRegistry: yesLater(flag(args, 'sbir-registry')),
    portal: yesLater(flag(args, 'portal')),
    agency: flag(args, 'agency'),
    number: flag(args, 'number'),
    title: flag(args, 'title'),
    closes: flag(args, 'closes'),
    url: flag(args, 'url'),
    objective: flag(args, 'objective'),
    plan: flag(args, 'plan'),
    market: flag(args, 'market'),
    team: flag(args, 'team'),
    budget: flag(args, 'budget'),
    submitted: submitted == null ? undefined : submitted === 'yes',
    ref: flag(args, 'ref'),
    award: awardOf(flag(args, 'award')),
    phase2Plan: flag(args, 'phase2-plan'),
    phase2Customers: flag(args, 'phase2-customers'),
    phase2Submitted: phase2Submitted == null ? undefined : phase2Submitted === 'yes',
    phase2Ref: flag(args, 'phase2-ref'),
    phase2Award: awardOf(flag(args, 'phase2-award')),
    buyer: flag(args, 'buyer'),
    offer: flag(args, 'offer'),
    money: flag(args, 'money'),
    route: routeOf(flag(args, 'route')),
    dropOutreach: on(args, 'drop-outreach'),
    kind: kindOf(flag(args, 'kind')),
    foundTitle: flag(args, 'found-title'),
    identifier: flag(args, 'identifier'),
    foundUrl: flag(args, 'found-url'),
    novelty: flag(args, 'novelty'),
    inventor: flag(args, 'inventor'),
    contact: flag(args, 'contact'),
    contactSource: flag(args, 'contact-source'),
    noContact: on(args, 'no-contact'),
    deal: dealOf(flag(args, 'deal')),
    terms: flag(args, 'terms'),
    sent: flag(args, 'sent') == null ? undefined : flag(args, 'sent') === 'yes',
    suggestAgency: flag(args, 'suggest-agency'),
    suggestNumber: flag(args, 'suggest-number'),
    suggestTitle: flag(args, 'suggest-title'),
    suggestCloses: flag(args, 'suggest-closes'),
    suggestUrl: flag(args, 'suggest-url'),
    suggestName: flag(args, 'suggest-name'),
    suggestIdea: flag(args, 'suggest-idea'),
    suggestOwner: flag(args, 'suggest-owner'),
    suggestSource: flag(args, 'suggest-source'),
    pick: flag(args, 'pick'),
    clearSuggestions: on(args, 'clear-suggestions'),
    clearMatch: on(args, 'clear-match'),
  };
}

function hasPatch(patch: Patch): boolean {
  return Object.values(patch).some(value => value != null && value !== false);
}

export function statusPayload(work: SbirWork) {
  const place = where(work);
  const gate = nextGate(work);
  const drafts = draftPaths();
  return {
    phase: place.phase,
    heading: place.heading,
    step: gate.id,
    kind: gate.kind,
    next: gate.title,
    prompt: gate.prompt,
    choices: gate.choices?.map(choice => ({ value: choice.value, label: choice.label })),
    blocked: gate.kind === 'stop',
    finished: gate.kind === 'done',
    research: work.research,
    rights: work.rights,
    company: work.company,
    registrations: work.registrations,
    topic: work.topic,
    phase1: { submittedAt: work.phase1.submittedAt, ref: work.phase1.ref, award: work.phase1.award },
    phase2: { submittedAt: work.phase2.submittedAt, ref: work.phase2.ref, award: work.phase2.award },
    phase3: work.phase3,
    route: work.route,
    suggestions: work.suggestions.map((item, index) => ({ n: index + 1, ...item })),
    outreach: openOutreach(work) ?? null,
    sentNotes: work.outreaches.filter(item => item.sentAt).map(item => ({
      title: item.title,
      inventor: item.inventor,
      kind: item.kind,
      sentAt: item.sentAt,
    })),
    drafts,
    draft: draftFile(work),
  };
}

function draftFile(work: SbirWork): string {
  const gate = nextGate(work);
  const openIndex = work.outreaches.findIndex(item => !item.sentAt);
  if (gate.phase === 'patent' && openIndex >= 0) return outreachFile(openIndex);
  if (gate.id === 'route') {
    let last = -1;
    work.outreaches.forEach((item, index) => { if (item.sentAt) last = index; });
    if (last >= 0) return outreachFile(last);
  }
  const drafts = draftPaths();
  if (gate.kind === 'done' || gate.phase === 'III') return drafts.phase3;
  if (gate.phase === 'II') return drafts.phase2;
  return drafts.phase1;
}

export function leaveLine(reason: 'quit' | 'pause', gate: { kind: string; id?: string }, draft: string): string {
  const where = `Draft: ${draft}`;
  if (reason === 'pause' && gate.id === 'send') return `No email recorded. You send it yourself.\n${where}`;
  if (reason === 'pause' && gate.kind === 'ref') return `No submission recorded. You submit it yourself.\n${where}`;
  if (reason === 'pause') return `Left this for later.\n${where}`;
  return `Stopped.\n${where}`;
}

function printWork(work: SbirWork, json: boolean, note = '', save = true): void {
  if (save) saveWork(work);
  if (json) {
    console.log(JSON.stringify({ ...statusPayload(work), note: note || undefined }, null, 2));
    return;
  }
  if (note) console.log(`${note}\n`);
  console.log(renderStatus(work));
  console.log('');
  console.log(`Draft: ${draftFile(work)}`);
}

export function showStatus(args: Args): void {
  printWork(loadWork(), on(args, 'json'), '', false);
}

export async function doStep(args: Args, ask: Ask): Promise<void> {
  const patch = patchFromFlags(args);
  if (hasPatch(patch)) {
    const applied = applyPatch(loadWork(), patch);
    printWork(applied.work, on(args, 'json'), applied.note);
    return;
  }
  if (!stdin.isTTY) throw new Error('Pass the next fact, for example: do --name "Ammonia sensor" --idea "Cheaper wastewater tests"');
  await askOnce(ask, on(args, 'json'));
}

async function askOnce(ask: Ask, json: boolean): Promise<void> {
  const work = loadWork();
  const gate = nextGate(work);
  if (!json) {
    console.log(renderStatus(work));
    console.log('');
  }
  if (gate.kind === 'done' || gate.kind === 'stop' || gate.kind === 'wait') {
    if (json) console.log(JSON.stringify(statusPayload(work), null, 2));
    return;
  }
  const line = await ask('> ');
  const parsed = parseGateAnswer(gate, line);
  if (parsed === 'quit' || parsed === 'pause') {
    const note = leaveLine(parsed, gate, draftFile(work));
    if (json) console.log(JSON.stringify({ ...statusPayload(work), note }, null, 2));
    else console.log(note);
    return;
  }
  if (parsed === 'again') throw new Error(gate.kind === 'choice' ? 'That was not one of the choices.' : 'That did not answer the question.');
  const applied = applyPatch(work, parsed);
  printWork(applied.work, json, applied.note);
}

export async function walkLoop(): Promise<void> {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const ask = (question: string) => rl.question(question);
  console.log('SBIR on this machine. One question at a time. q leaves. Nothing is submitted for you.\n');
  try {
    for (;;) {
      const work = loadWork();
      const gate = nextGate(work);
      console.log(renderStatus(work));
      console.log(`\nDraft: ${draftFile(work)}`);
      if (gate.kind === 'done' || gate.kind === 'stop' || gate.kind === 'wait') {
        await ask('\nenter to close> ');
        return;
      }
      const line = await ask('\n> ');
      const parsed = parseGateAnswer(gate, line);
      if (parsed === 'quit' || parsed === 'pause') {
        console.log(`\n${leaveLine(parsed, gate, draftFile(work))}`);
        return;
      }
      if (parsed === 'again') {
        console.log(gate.kind === 'choice' ? '\nUse one of the numbers above, or q to leave.\n' : '\nThat did not answer the question. q leaves.\n');
        continue;
      }
      try {
        const applied = applyPatch(work, parsed);
        saveWork(applied.work);
        console.log(applied.note ? `\n${applied.note}\n` : '\nSaved.\n');
      } catch (error) {
        console.log(`\n${error instanceof Error ? error.message : String(error)}\n`);
      }
    }
  } finally {
    rl.close();
  }
}

export function clearLocal(args: Args): void {
  if (!on(args, 'yes')) throw new Error('This deletes the SBIR file on this machine. Re-run with: clear --yes');
  clearWork();
  if (on(args, 'json')) console.log(JSON.stringify({ cleared: true }));
  else console.log('Deleted the local SBIR record and drafts.');
}
