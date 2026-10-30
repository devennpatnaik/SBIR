import { flag, type Args } from '../args.ts';
import { api, CliError } from '../api.ts';
import { emit, jsonMode } from '../format.ts';
import { clearAuth, currentTrack, readSession, updateSession } from '../session.ts';

export type Ask = (question: string) => Promise<string>;

function requireEmail(value: string): string {
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new CliError('Enter a valid email address.');
  return email;
}

async function passwordFrom(args: Args, ask: Ask): Promise<string> {
  const given = flag(args, 'password') ?? process.env.LTM_PASSWORD ?? '';
  if (given) return given;
  if (!process.stdin.isTTY) throw new CliError('Set LTM_PASSWORD or pass --password.');
  return (await ask('Password: ')).trim();
}

async function emailFrom(args: Args, ask: Ask): Promise<string> {
  const given = flag(args, 'email');
  if (given) return requireEmail(given);
  if (!process.stdin.isTTY) throw new CliError('Pass --email.');
  return requireEmail(await ask('Email: '));
}

export async function signup(args: Args, ask: Ask): Promise<void> {
  const email = await emailFrom(args, ask);
  const name = flag(args, 'name') ?? email;
  const password = await passwordFrom(args, ask);
  if (password.length < 8) throw new CliError('Password must be at least 8 characters.');
  const result = await api<{ token: string; user: { id: string; email: string; name?: string } }>('/auth/sign-up', {
    auth: false,
    body: { email, password, name },
  });
  updateSession({ token: result.token, user: result.user, api: process.env.LTM_API || readSession().api });
  emit(jsonMode(args), { user: result.user }, `Account created. Signed in as ${result.user.email}.`);
}

export async function signin(args: Args, ask: Ask): Promise<void> {
  const email = await emailFrom(args, ask);
  const password = await passwordFrom(args, ask);
  const result = await api<{ token: string; user: { id: string; email: string; name?: string } }>('/auth/sign-in', {
    auth: false,
    body: { email, password },
  });
  updateSession({ token: result.token, user: result.user, api: process.env.LTM_API || readSession().api });
  emit(jsonMode(args), { user: result.user }, `Signed in as ${result.user.email}.`);
}

export function signout(args: Args): void {
  clearAuth();
  emit(jsonMode(args), { signedIn: false }, 'Signed out on this machine. The account is unchanged.');
}

export async function whoami(args: Args): Promise<void> {
  const session = await api<{ session: { user: { id: string; email: string } } | null }>('/auth/session');
  const user = session.session?.user;
  if (!user) throw new CliError('Not signed in.');
  emit(jsonMode(args), { user, track: currentTrack() }, `${user.email}\ntrack ${currentTrack()}`);
}

export function track(args: Args): void {
  const name = args._[1];
  if (name !== 'sbir' && name !== 'patents') throw new CliError('Use: track sbir   or   track patents');
  updateSession({ track: name });
  emit(jsonMode(args), { track: name }, `Track set to ${name === 'sbir' ? 'SBIR' : 'patents'}.`);
}

export async function health(args: Args): Promise<void> {
  const body = await api<Record<string, unknown>>('/health', { auth: false });
  emit(jsonMode(args), body, [
    `API ${process.env.LTM_API || 'http://127.0.0.1:8787'}`,
    `auth ${String(body.authMode ?? 'unknown')}`,
    `assistant ${String(body.assistant ?? 'unknown')}`,
    body.offline ? 'offline guide (no language-model key)' : `model ${String(body.model ?? '')}`,
  ].join('\n'));
}

export async function demo(args: Args): Promise<void> {
  const operation = args._[1] === 'remove' ? 'remove' : 'create';
  if (args._[1] && args._[1] !== 'remove' && args._[1] !== 'create') {
    throw new CliError('Use: demo    or    demo remove');
  }
  const result = await api<Record<string, unknown>>('/demo', { body: { operation } });
  if (jsonMode(args)) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (operation === 'remove') {
    console.log('Demo workspace removed.');
    return;
  }
  const project = typeof result.project_id === 'string' ? result.project_id : '';
  console.log(typeof result.message === 'string' ? result.message : 'Demo workspace is ready.');
  if (project) console.log(`\nOpen it with:\n  ./lab-to-market project show ${project}`);
  console.log('\nSample records are fictional. Do not email the sample contacts or submit the sample proposal.');
}

