import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { parseArgs, splitWords } from './args.ts';
import { apiBase, ping } from './api.ts';
import { dispatch } from './dispatch.ts';
import { printPath } from './cmd/offline.ts';
import { formatPursue, loadPursue } from './cmd/pursue.ts';
import { projectShow, promptOutcomes, techCommand, techShow } from './cmd/records.ts';
import { flattenPursue } from './model/pursue.ts';
import { currentTrack, readSession, signedIn, updateSession } from './session.ts';
import { USAGE } from './usage.ts';

type Screen = { kind: 'home' } | { kind: 'pursue' } | { kind: 'tech'; id: string } | { kind: 'project'; id: string };
type Move = { op: 'push'; screen: Screen } | { op: 'stay' } | { op: 'back' } | { op: 'quit' };

const stay: Move = { op: 'stay' };
const back: Move = { op: 'back' };
const quit: Move = { op: 'quit' };

export async function repl(): Promise<void> {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const ask = (question: string) => rl.question(question);
  const stack: Screen[] = [{ kind: 'home' }];
  console.log('Older lab-to-market menu. The SBIR walk is ./lab-to-market with no arguments.\nPick a number, type a command, or quit. Nothing is submitted for you.\n');
  try {
    while (stack.length) {
      const screen = stack[stack.length - 1] ?? { kind: 'home' };
      let move: Move;
      try {
        move = await step(screen, ask);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (/readline was closed|ERR_USE_AFTER_CLOSE/i.test(message)) return;
        console.error(`\n${message}\n`);
        move = stay;
      }
      if (move.op === 'quit') return;
      if (move.op === 'back') {
        if (stack.length > 1) stack.pop();
        continue;
      }
      if (move.op === 'push') stack.push(move.screen);
    }
  } finally {
    rl.close();
  }
}

async function runLine(line: string, ask: (question: string) => Promise<string>): Promise<void> {
  const words = splitWords(line);
  if (!words.length) return;
  await dispatch(parseArgs(words), ask);
}

async function step(screen: Screen, ask: (question: string) => Promise<string>): Promise<Move> {
  if (screen.kind === 'home') return home(ask);
  if (screen.kind === 'pursue') return pursueScreen(ask);
  if (screen.kind === 'tech') return techScreen(screen.id, ask);
  return projectScreen(screen.id, ask);
}

async function home(ask: (question: string) => Promise<string>): Promise<Move> {
  const session = readSession();
  const up = await ping();
  console.log(session.user?.email ? `Signed in as ${session.user.email}` : 'Not signed in');
  console.log(up ? `API ${apiBase()}` : `API not reachable at ${apiBase()} — run ./lab-to-market up`);
  console.log(`Track: ${currentTrack() === 'sbir' ? 'SBIR' : 'patents'}\n`);

  const items: { label: string; go: () => Promise<Move> }[] = [];
  if (!signedIn()) {
    items.push({ label: 'Sign in', go: async () => { await runLine('signin', ask); return stay; } });
    items.push({ label: 'Create an account', go: async () => { await runLine('signup', ask); return stay; } });
  }
  items.push(
    { label: 'Pursue — ranked leads', go: async () => ({ op: 'push', screen: { kind: 'pursue' } }) },
    { label: 'The SBIR path', go: async () => { printPath(); return stay; } },
    { label: 'Start a plan', go: async () => { await runLine('kickoff', ask); return stay; } },
    { label: 'Projects', go: async () => { await runLine('project list', ask); return stay; } },
    { label: 'Technologies', go: async () => { await runLine('tech list', ask); return stay; } },
    { label: 'Search Grants.gov', go: async () => askSearch('grants search', 'Grants.gov phrase: ', ask) },
    { label: 'Search patents', go: async () => askSearch('patents search', 'Patent phrase: ', ask) },
    { label: 'SBIR solicitations', go: async () => askSearch('sbir', 'Keyword (enter to list open ones): ', ask) },
    { label: 'Pathways', go: async () => { await runLine('pathways', ask); return stay; } },
    { label: 'Programs that can help', go: async () => { await runLine('programs', ask); return stay; } },
    { label: 'Offline guide', go: async () => askSearch('guide', 'Question: ', ask) },
    {
      label: `Switch to ${currentTrack() === 'sbir' ? 'patents' : 'SBIR'}`,
      go: async () => {
        const track = currentTrack() === 'sbir' ? 'patents' : 'sbir';
        updateSession({ track });
        console.log(`Track is now ${track}.`);
        return stay;
      },
    },
  );
  if (signedIn()) items.push({ label: 'Sign out', go: async () => { await runLine('signout', ask); return stay; } });

  items.forEach((item, index) => console.log(`${String(index + 1).padStart(2)}  ${item.label}`));
  const line = (await ask('\n> ')).trim();
  if (!line) return stay;
  if (line === 'q' || line === 'quit' || line === 'exit') return quit;
  if (line === 'b' || line === 'back') return back;
  if (line === 'help' || line === '?') { console.log(USAGE); return stay; }
  if (/^\d+$/.test(line)) {
    const item = items[Number(line) - 1];
    if (!item) { console.log('That number is not on the list.'); return stay; }
    return item.go();
  }
  await runLine(line, ask);
  return stay;
}

async function askSearch(prefix: string, label: string, ask: (question: string) => Promise<string>): Promise<Move> {
  const phrase = (await ask(label)).trim();
  if (prefix === 'sbir' && !phrase) await runLine('sbir', ask);
  else if (!phrase) console.log('Canceled.');
  else await dispatch(parseArgs([...prefix.split(' '), ...splitWords(phrase)]), ask);
  return stay;
}

async function pursueScreen(ask: (question: string) => Promise<string>): Promise<Move> {
  let rows;
  let text: string;
  try {
    const list = await loadPursue(currentTrack());
    rows = flattenPursue(list);
    text = formatPursue(list);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return back;
  }
  console.log(`\n${text}\n`);
  const line = (await ask('Number to open, b back, or a command.\n> ')).trim();
  if (!line || line === 'b' || line === 'back') return back;
  if (line === 'q' || line === 'quit') return quit;
  if (/^\d+$/.test(line)) {
    const row = rows[Number(line) - 1];
    if (!row) { console.log('That number is not on the list.'); return stay; }
    if (row.kind === 'technology') return { op: 'push', screen: { kind: 'tech', id: row.id } };
    await dispatch(parseArgs(splitWords(row.command)), ask);
    return stay;
  }
  await runLine(line, ask);
  return stay;
}

async function techScreen(id: string, ask: (question: string) => Promise<string>): Promise<Move> {
  let shown;
  try {
    shown = await techShow(id, false);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return back;
  }
  console.log('\n  1  Shortlist / remove from shortlist');
  console.log('  2  Record what happened');
  if (shown.projectId) console.log('  3  Open the project');
  console.log('  b  Back\n');
  const line = (await ask('> ')).trim();
  if (!line || line === 'b' || line === 'back') return back;
  if (line === 'q' || line === 'quit') return quit;
  if (line === '1') {
    await techCommand([shown.shortlisted ? 'unshortlist' : 'shortlist', id], { _: [], flags: {} });
    return stay;
  }
  if (line === '2') {
    await promptOutcomes(id, ask);
    return stay;
  }
  if (line === '3' && shown.projectId) return { op: 'push', screen: { kind: 'project', id: shown.projectId } };
  await runLine(line, ask);
  return stay;
}

async function projectScreen(id: string, ask: (question: string) => Promise<string>): Promise<Move> {
  let tasks;
  try {
    tasks = await projectShow(id, false);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return back;
  }
  console.log('\nA number marks that task done. b back.\n');
  const line = (await ask('> ')).trim();
  if (!line || line === 'b' || line === 'back') return back;
  if (line === 'q' || line === 'quit') return quit;
  if (/^\d+$/.test(line)) {
    const task = tasks[Number(line) - 1];
    if (!task) { console.log('That number is not an open task.'); return stay; }
    const yes = (await ask(`Mark done: ${task.title}? [y/N] `)).trim().toLowerCase();
    if (yes === 'y' || yes === 'yes') {
      await dispatch(parseArgs(['tasks', 'done', task.id]), ask);
    }
    return stay;
  }
  await runLine(line, ask);
  return stay;
}
