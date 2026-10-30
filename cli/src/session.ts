import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export type Track = 'sbir' | 'patents';

export type Session = {
  api?: string;
  token?: string;
  user?: { id: string; email: string; name?: string };
  track?: Track;
};

export function sessionPath(): string {
  return process.env.LTM_SESSION || path.join(os.homedir(), '.lab-to-market', 'session.json');
}

export function readSession(): Session {
  try {
    const raw = fs.readFileSync(sessionPath(), 'utf8');
    const parsed = JSON.parse(raw) as Session;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function writeSession(next: Session): void {
  const file = sessionPath();
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  fs.writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 });
  try { fs.chmodSync(file, 0o600); } catch { /* already restricted */ }
}

export function updateSession(patch: Session): Session {
  const next = { ...readSession(), ...patch };
  if (patch.user) next.user = patch.user;
  writeSession(next);
  return next;
}

export function clearAuth(): void {
  const current = readSession();
  writeSession({ api: current.api, track: current.track });
}

export function currentTrack(): Track {
  return readSession().track === 'patents' ? 'patents' : 'sbir';
}

export function signedIn(): boolean {
  return Boolean(readSession().token);
}
