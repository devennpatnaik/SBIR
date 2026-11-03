import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { emptyWork, normalize, phase1Draft, phase2Draft, phase3Draft, type SbirWork } from './work.ts';

export function dataDir(): string {
  return process.env.LTM_DIR || path.join(os.homedir(), '.lab-to-market');
}

export function workPath(): string {
  return path.join(dataDir(), 'sbir.json');
}

export function draftPaths(): { phase1: string; phase2: string; phase3: string } {
  const dir = path.join(dataDir(), 'drafts');
  return {
    phase1: path.join(dir, 'phase-1.md'),
    phase2: path.join(dir, 'phase-2.md'),
    phase3: path.join(dir, 'phase-3.md'),
  };
}

export function loadWork(): SbirWork {
  const file = workPath();
  let raw: string;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return emptyWork();
    throw unreadable(file, error);
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('expected a JSON object');
    return normalize(parsed);
  } catch (error) {
    throw unreadable(file, error);
  }
}

function unreadable(file: string, error: unknown): Error {
  const detail = error instanceof SyntaxError
    ? 'the JSON is invalid'
    : error instanceof Error ? error.message : 'unreadable';
  const short = detail.length > 160 ? `${detail.slice(0, 160)}…` : detail;
  return new Error(`The SBIR file at ${file} could not be read (${short}). It was left untouched.`);
}

export function saveWork(work: SbirWork): { phase1: string; phase2: string; phase3: string } {
  const file = workPath();
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  fs.writeFileSync(file, `${JSON.stringify(work, null, 2)}\n`, { mode: 0o600 });
  try { fs.chmodSync(file, 0o600); } catch { /* already restricted */ }
  return writeDrafts(work);
}

export function writeDrafts(work: SbirWork): { phase1: string; phase2: string; phase3: string } {
  const drafts = draftPaths();
  fs.mkdirSync(path.dirname(drafts.phase1), { recursive: true, mode: 0o700 });
  fs.writeFileSync(drafts.phase1, phase1Draft(work), { mode: 0o600 });
  fs.writeFileSync(drafts.phase2, phase2Draft(work), { mode: 0o600 });
  fs.writeFileSync(drafts.phase3, phase3Draft(work), { mode: 0o600 });
  return drafts;
}

export function clearWork(): void {
  for (const file of [workPath(), ...Object.values(draftPaths())]) {
    try { fs.rmSync(file); } catch { /* already gone */ }
  }
}
