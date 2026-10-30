import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clearWork, loadWork, saveWork } from './store.ts';
import { applyPatch, emptyWork, nextGate, phase1Draft, type Patch, type SbirWork } from './work.ts';

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
  assert.equal(nextGate(emptyWork()).id, 'name');

  let stuck = step(emptyWork(), { name: 'A', idea: 'B', skipOwner: true, skipSource: true, rights: 'unavailable' });
  assert.equal(nextGate(stuck).id, 'rights');
  stuck = step(stuck, { rights: 'not_needed', company: 'not_yet' });
  assert.equal(nextGate(stuck).id, 'company');

  let deferred = step(emptyWork(), { ...ready, sam: 'later', sbirRegistry: undefined, portal: undefined, agency: undefined });
  assert.equal(nextGate(deferred).id, 'sbirGov');

  let work = step(emptyWork(), ready);
  assert.equal(nextGate(work).id, 'submit1');
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
  assert.equal(JSON.parse(status.stdout).next, 'Pick the research');
  assert.equal(fs.existsSync(path.join(cliDir, 'sbir.json')), false);

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

  console.log('sbir walk ok');
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
