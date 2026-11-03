import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clearWork, loadWork, saveWork } from './store.ts';
import { leaveLine } from '../cmd/walk.ts';
import { applyPatch, emptyWork, nextGate, normalize, parseGateAnswer, phase1Draft, type Patch, type SbirWork } from './work.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const bin = path.join(root, 'lab-to-market');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ltm-sbir-'));
process.env.LTM_DIR = dir;

function step(work: SbirWork, patch: Patch): SbirWork {
  return applyPatch(work, patch).work;
}

const ready: Patch = {
  name: 'Ammonia sensor',
  idea: 'Cheaper wastewater tests',
  skipOwner: true,
  skipSource: true,
  rights: 'not_needed',
  company: 'ready',
  sam: 'yes',
  sbirRegistry: 'yes',
  portal: 'yes',
  agency: 'DOE',
  number: 'T-1',
  title: 'Water sensors',
  closes: '2026-12-01',
  url: 'https://www.sbir.gov/example',
  objective: 'Prove the sensor',
  plan: 'Run one bench test',
  market: 'A municipal plant',
  team: 'Two engineers',
  budget: 'Pays for the bench test',
};

try {
  assert.equal(nextGate(emptyWork()).id, 'route');
  const legacy = normalize({ version: 1, research: { name: 'Old sensor', idea: '', owner: '', source: '' } });
  assert.equal(legacy.route, 'sbir');
  assert.equal(nextGate(legacy).id, 'idea');

  let stuck = step(emptyWork(), { name: 'A', idea: 'B', skipOwner: true, skipSource: true, rights: 'unavailable' });
  assert.equal(nextGate(stuck).id, 'rights');
  stuck = step(stuck, { rights: 'not_needed', company: 'not_yet' });
  assert.equal(nextGate(stuck).id, 'company');

  let deferred = step(emptyWork(), { ...ready, sam: 'later', sbirRegistry: undefined, portal: undefined, agency: undefined });
  assert.equal(nextGate(deferred).id, 'sbirGov');

  let work = step(emptyWork(), ready);
  assert.equal(nextGate(work).id, 'submit1');
  assert.equal(parseGateAnswer(nextGate(work), ''), 'pause');
  assert.equal(parseGateAnswer(nextGate(work), 'q'), 'quit');
  assert.match(leaveLine('pause', nextGate(work), '/tmp/drafts/phase-1.md'), /No submission recorded/);
  assert.match(leaveLine('pause', nextGate(work), '/tmp/drafts/phase-1.md'), /phase-1\.md/);
  assert.match(leaveLine('quit', nextGate(work), '/tmp/drafts/phase-1.md'), /Stopped/);
  assert.throws(() => step(work, { submitted: true }), /tracking number/);
  assert.throws(() => step(work, { url: 'not a url' }), /http/);
  assert.throws(() => step(work, { closes: 'December' }), /YYYY-MM-DD/);

  work = step(work, { submitted: true, ref: 'ABC-1' });
  assert.ok(work.phase1.submittedAt);
  assert.equal(nextGate(work).id, 'award1');
  assert.throws(() => step(work, { phase2Submitted: true, phase2Ref: 'P2' }), /Phase I selection/);

  const changed = step(work, { url: 'https://www.sbir.gov/other' });
  assert.equal(changed.phase1.ref, '');
  assert.equal(changed.phase1.submittedAt, '');
  assert.equal(changed.topic.agency, '');
  assert.equal(changed.topic.number, '');
  assert.equal(changed.topic.title, '');
  assert.equal(changed.topic.closes, '');
  assert.equal(nextGate(changed).id, 'agency');

  const kept = step(work, { url: 'https://www.sbir.gov/other', agency: 'NIH' });
  assert.equal(kept.topic.agency, 'NIH');
  assert.equal(kept.phase1.submittedAt, '');

  work = step(work, { award: 'no' });
  assert.equal(nextGate(work).id, 'url');
  assert.throws(() => step(work, { url: 'https://www.sbir.gov/next', award: 'pending' }), /submission/);
  const restarted = step(work, { url: 'https://www.sbir.gov/next' });
  assert.equal(restarted.phase1.award, '');
  assert.equal(nextGate(restarted).id, 'agency');

  work = step(emptyWork(), { ...ready, submitted: true, ref: 'ABC-1', award: 'pending', phase2Plan: 'Build a field unit', phase2Customers: 'One utility asked for a demo' });
  assert.equal(nextGate(work).id, 'wait-award1');
  work = step(work, { award: 'yes' });
  assert.equal(nextGate(work).id, 'submit2');
  work = step(work, { phase2Submitted: true, phase2Ref: 'P2-9', phase2Award: 'no' });
  assert.equal(nextGate(work).id, 'buyer');
  assert.match(nextGate(work).prompt, /not an SBIR award|not selected/);
  work = step(work, { buyer: 'City water department', offer: 'Sensor kits', money: 'A purchase order, not an SBIR award' });
  assert.equal(nextGate(work).kind, 'done');

  const selected = step(emptyWork(), {
    ...ready,
    submitted: true,
    ref: 'ABC-1',
    award: 'yes',
    phase2Plan: 'Build a field unit',
    phase2Customers: 'One utility asked for a demo',
    phase2Submitted: true,
    phase2Ref: 'P2-9',
    phase2Award: 'yes',
    buyer: 'City water department',
    offer: 'Sensor kits',
    money: 'A purchase order',
  });
  assert.equal(nextGate(selected).kind, 'done');
  const fromSbir = step(selected, { route: 'patents' });
  assert.equal(fromSbir.phase1.ref, 'ABC-1');
  assert.equal(nextGate(fromSbir).id, 'sourceKind');
  const draft = phase1Draft(selected);
  assert.match(draft, /Cheaper wastewater tests/);
  assert.match(draft, /not an application|did not submit/);
  assert.match(draft, /ABC-1/);

  saveWork(selected);
  assert.equal(loadWork().research.name, 'Ammonia sensor');
  assert.match(fs.readFileSync(path.join(dir, 'drafts', 'phase-1.md'), 'utf8'), /Cheaper wastewater tests/);
  assert.match(fs.readFileSync(path.join(dir, 'drafts', 'phase-3.md'), 'utf8'), /not an SBIR award/);
  clearWork();
  assert.equal(fs.existsSync(path.join(dir, 'sbir.json')), false);
  assert.equal(loadWork().research.name, '');

  const cliDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ltm-cli-'));
  const run = (args: string[]) => spawnSync(bin, args, {
    cwd: root,
    env: { ...process.env, LTM_DIR: cliDir },
    encoding: 'utf8',
  });

  const status = run(['status', '--json']);
  assert.equal(status.status, 0, status.stderr);
  const fresh = JSON.parse(status.stdout);
  assert.equal(fresh.step, 'route');
  assert.equal(fresh.next, 'Choose a route');
  assert.equal(fresh.draft, path.join(cliDir, 'drafts', 'phase-1.md'));
  assert.equal(fs.existsSync(path.join(cliDir, 'sbir.json')), false);
  assert.equal(fs.existsSync(path.join(cliDir, 'drafts')), false);

  const partial = run(['do', '--name', 'Ammonia sensor', '--idea', 'Cheaper wastewater tests', '--json']);
  assert.equal(partial.status, 0, partial.stderr);
  const partialJson = JSON.parse(partial.stdout);
  assert.equal(partialJson.research.name, 'Ammonia sensor');
  assert.match(partialJson.prompt, /Who owns it/);

  const full = run([
    'do', '--json',
    '--skip-owner', '--skip-source',
    '--rights', 'not-needed', '--company', 'ready',
    '--sam', 'yes', '--sbir-registry', 'yes', '--portal', 'yes',
    '--agency', 'DOE', '--number', 'T-1', '--title', 'Water sensors', '--closes', '2026-12-01',
    '--url', 'https://www.sbir.gov/example',
    '--objective', 'Prove the sensor', '--plan', 'Run one bench test',
    '--market', 'A municipal plant', '--team', 'Two engineers', '--budget', 'Pays for the bench test',
    '--submitted', 'yes', '--ref', 'ABC-1', '--award', 'yes',
    '--phase2-plan', 'Build a field unit', '--phase2-customers', 'One utility asked for a demo',
    '--phase2-submitted', 'yes', '--phase2-ref', 'P2-9', '--phase2-award', 'yes',
    '--buyer', 'City water department', '--offer', 'Sensor kits', '--money', 'A purchase order',
  ]);
  assert.equal(full.status, 0, full.stderr);
  const done = JSON.parse(full.stdout);
  assert.equal(done.finished, true);
  assert.equal(done.phase1.ref, 'ABC-1');
  assert.equal(done.draft, path.join(cliDir, 'drafts', 'phase-3.md'));
  const saved = fs.readFileSync(path.join(cliDir, 'sbir.json'), 'utf8');
  const reread = run(['status', '--json']);
  assert.equal(reread.status, 0, reread.stderr);
  assert.equal(fs.readFileSync(path.join(cliDir, 'sbir.json'), 'utf8'), saved);
  assert.match(fs.readFileSync(path.join(cliDir, 'drafts', 'phase-1.md'), 'utf8'), /ABC-1/);
  assert.match(fs.readFileSync(path.join(cliDir, 'drafts', 'phase-3.md'), 'utf8'), /City water department/);

  const bad = run(['do', '--url', 'ftp://example.com']);
  assert.notEqual(bad.status, 0);
  assert.match(bad.stderr, /http/);
  assert.equal(JSON.parse(run(['status', '--json']).stdout).phase1.ref, 'ABC-1');

  const refused = run(['clear']);
  assert.notEqual(refused.status, 0);
  assert.equal(run(['clear', '--yes']).status, 0);
  assert.equal(fs.existsSync(path.join(cliDir, 'sbir.json')), false);
  assert.equal(JSON.parse(run(['status', '--json']).stdout).research.name, '');

  const brokenDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ltm-broken-'));
  const brokenFile = path.join(brokenDir, 'sbir.json');
  fs.writeFileSync(brokenFile, '{', { mode: 0o600 });
  const broken = spawnSync(bin, ['status', '--json'], {
    cwd: root,
    env: { ...process.env, LTM_DIR: brokenDir },
    encoding: 'utf8',
  });
  assert.notEqual(broken.status, 0);
  assert.match(broken.stderr, /left untouched/);
  assert.equal(fs.readFileSync(brokenFile, 'utf8'), '{');
  assert.equal(fs.existsSync(path.join(brokenDir, 'drafts')), false);
  const brokenDo = spawnSync(bin, ['do', '--name', 'Should not replace', '--json'], {
    cwd: root,
    env: { ...process.env, LTM_DIR: brokenDir },
    encoding: 'utf8',
  });
  assert.notEqual(brokenDo.status, 0);
  assert.equal(fs.readFileSync(brokenFile, 'utf8'), '{');
  fs.rmSync(brokenDir, { recursive: true, force: true });

  let patent = step(emptyWork(), { route: 'patents' });
  assert.equal(nextGate(patent).id, 'sourceKind');
  assert.equal(parseGateAnswer(nextGate(patent), '2').kind, 'article');
  patent = step(patent, {
    kind: 'article',
    foundTitle: 'A paper sensor',
    identifier: 'PMID 12345678',
    foundUrl: 'https://pubmed.ncbi.nlm.nih.gov/12345678/',
    novelty: 'It detects ammonia with a cheaper strip.',
    inventor: 'Ada Lovelace',
    deal: 'royalties',
    terms: 'Two percent of net sales for ten years.',
  });
  assert.equal(nextGate(patent).id, 'contact');
  assert.deepEqual(parseGateAnswer(nextGate(patent), ''), { noContact: true });
  assert.throws(() => step(patent, { contact: 'ada@example.com' }), /placeholder/);
  assert.throws(() => step(patent, { sent: true }), /contact/);
  patent = step(patent, { noContact: true });
  assert.equal(nextGate(patent).id, 'contact');
  assert.match(nextGate(patent).prompt, /does not invent/);
  patent = step(patent, {
    contact: 'tto@university.edu',
    contactSource: 'https://pubmed.ncbi.nlm.nih.gov/12345678/',
  });
  assert.equal(nextGate(patent).id, 'send');
  assert.equal(parseGateAnswer(nextGate(patent), ''), 'pause');
  assert.equal(parseGateAnswer(nextGate(patent), 'maybe'), 'again');
  const sent = step(patent, { sent: true });
  saveWork(sent);
  assert.equal(sent.route, '');
  assert.ok(sent.outreaches[0]?.sentAt);
  assert.equal(nextGate(sent).id, 'route');
  assert.match(nextGate(sent).prompt, /did not send it/);
  const note = fs.readFileSync(path.join(dir, 'drafts', 'outreach-1.md'), 'utf8');
  assert.match(note, /was not emailed|did not send it/);
  assert.match(note, /royalty/i);
  assert.match(note, /Two percent of net sales/);
  assert.match(note, /tto@university.edu/);
  const again = step(sent, { route: 'patents' });
  assert.equal(again.outreaches.length, 2);
  assert.equal(nextGate(again).id, 'sourceKind');
  const dropped = step(again, { dropOutreach: true });
  assert.equal(dropped.outreaches.length, 1);
  assert.equal(nextGate(dropped).id, 'route');
  assert.equal(nextGate(step(dropped, { route: 'sbir' })).id, 'name');

  const patentDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ltm-patent-'));
  const patentRun = (args: string[]) => spawnSync(bin, args, {
    cwd: root,
    env: { ...process.env, LTM_DIR: patentDir },
    encoding: 'utf8',
  });
  const opened = patentRun(['do', '--route', 'patents', '--json']);
  assert.equal(opened.status, 0, opened.stderr);
  assert.equal(JSON.parse(opened.stdout).step, 'sourceKind');
  const noted = patentRun([
    'do', '--json',
    '--kind', 'patent',
    '--found-title', 'Ammonia strip',
    '--identifier', 'US 9,999,999',
    '--found-url', 'https://patents.google.com/patent/US9999999',
    '--novelty', 'A cheaper strip for wastewater ammonia.',
    '--inventor', 'Grace Hopper',
    '--deal', 'equity',
    '--terms', 'Five percent of the company.',
    '--contact', 'licensing@lab.edu',
    '--contact-source', 'https://patents.google.com/patent/US9999999',
  ]);
  assert.equal(noted.status, 0, noted.stderr);
  assert.equal(JSON.parse(noted.stdout).step, 'send');
  assert.match(fs.readFileSync(path.join(patentDir, 'drafts', 'outreach-1.md'), 'utf8'), /Five percent of the company/);
  assert.match(fs.readFileSync(path.join(patentDir, 'drafts', 'outreach-1.md'), 'utf8'), /This file was not emailed/);
  const mailed = patentRun(['do', '--sent', 'yes', '--json']);
  assert.equal(mailed.status, 0, mailed.stderr);
  const back = JSON.parse(mailed.stdout);
  assert.equal(back.step, 'route');
  assert.equal(back.sentNotes.length, 1);
  assert.match(back.note, /did not send it/);
  const invented = patentRun(['do', '--route', 'patents', '--contact', 'inventor@example.com', '--json']);
  assert.notEqual(invented.status, 0);
  assert.match(invented.stderr, /placeholder/);
  fs.rmSync(patentDir, { recursive: true, force: true });

  console.log('sbir walk ok');
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
