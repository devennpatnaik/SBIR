import { on, type Args } from './args.ts';
import { CliError } from './api.ts';
import { demo, health, signin, signout, signup, track, whoami, type Ask } from './cmd/account.ts';
import { guide, printPath } from './cmd/offline.ts';
import { kickoff, pathways } from './cmd/pathways.ts';
import { next, pursue } from './cmd/pursue.ts';
import {
  compare,
  docs,
  insights,
  outcomesSet,
  outcomesShow,
  programs,
  projectCommand,
  tasksDone,
  techCommand,
} from './cmd/records.ts';
import { grantsImport, grantsSearch, patentsImport, patentsSearch, sbir } from './cmd/search.ts';
import { clearLocal, doStep, showStatus } from './cmd/walk.ts';
import { askLine } from './prompt.ts';
import { USAGE } from './usage.ts';

function idAt(args: Args, index: number, label: string): string {
  const value = args._[index];
  if (!value) throw new CliError(`Missing ${label}.`);
  return value;
}

export async function dispatch(args: Args, ask?: Ask): Promise<void> {
  if (on(args, 'help') || args._.length === 0) {
    console.log(USAGE);
    return;
  }
  const prompt: Ask = question => askLine(ask, question);
  const [command, sub] = args._;
  switch (command) {
    case 'signup': return signup(args, prompt);
    case 'signin': return signin(args, prompt);
    case 'signout': return signout(args);
    case 'whoami': return whoami(args);
    case 'track': return track(args);
    case 'health': return health(args);
    case 'demo': return demo(args);
    case 'pursue':
      await pursue(args);
      return;
    case 'next': return next(args);
    case 'path': return printPath();
    case 'guide': return guide(args._.slice(1).join(' '));
    case 'kickoff': return kickoff(args, prompt);
    case 'tech': return techCommand(args._.slice(1), args);
    case 'compare': return compare(args);
    case 'project': return projectCommand(args._.slice(1), args);
    case 'tasks':
      if (sub !== 'done') throw new CliError('Use: tasks done <taskId>');
      return tasksDone(idAt(args, 2, 'a task id'), on(args, 'json'));
    case 'outcomes':
      if (sub === 'show') {
        await outcomesShow(idAt(args, 2, 'a technology id'), on(args, 'json'));
        return;
      }
      if (sub === 'set') return outcomesSet(idAt(args, 2, 'a technology id'), args);
      throw new CliError('Use: outcomes show <technologyId> | outcomes set <technologyId> --lab-responded ...');
    case 'docs': return docs(args);
    case 'insights': return insights(args);
    case 'programs': return programs(args);
    case 'status': return showStatus(args);
    case 'do': return doStep(args, prompt);
    case 'clear': return clearLocal(args);
    case 'solicitations': return sbir(args);
    case 'sbir':
      if (sub) return sbir(args);
      return showStatus(args);
    case 'grants':
      if (sub === 'search') return grantsSearch(args);
      if (sub === 'import') return grantsImport(args);
      throw new CliError('Use: grants search <keywords> | grants import <id>');
    case 'patents':
      if (sub === 'search') return patentsSearch(args);
      if (sub === 'import') return patentsImport(args);
      throw new CliError('Use: patents search <keywords> | patents import <publicationNumber>');
    case 'menu': return (await import('./repl.ts')).repl();
    case 'pathways': return pathways(args);
    default:
      throw new CliError(`Unknown command "${command}".\n\n${USAGE}`);
  }
}
