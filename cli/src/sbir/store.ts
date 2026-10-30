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
  try {
    return normalize(JSON.parse(fs.readFileSync(workPath(), 'utf8')) as unknown);
  } catch {
    return emptyWork();
  }
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
