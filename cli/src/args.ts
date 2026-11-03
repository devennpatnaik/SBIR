export type Args = {
  _: string[];
  flags: Record<string, string | boolean>;
};

const BOOL = new Set(['json', 'help', 'h', 'small-business', 'shortlisted', 'yes', 'skip-owner', 'skip-source', 'no-contact', 'drop-outreach']);

/** Split argv into positional words and flags. `--json` is boolean; `--track patents` and `--idea=water` both work. */
export function parseArgs(argv: string[]): Args {
  const _: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i] ?? '';
    if (token === '--') {
      _.push(...argv.slice(i + 1));
      break;
    }
    if (!token.startsWith('-')) {
      _.push(token);
      continue;
    }
    const body = token.replace(/^--?/, '');
    const eq = body.indexOf('=');
    if (eq >= 0) {
      flags[body.slice(0, eq)] = body.slice(eq + 1);
      continue;
    }
    const name = body === 'h' ? 'help' : body;
    if (BOOL.has(body) || token === '-h') {
      flags[name] = true;
      continue;
    }
    const next = argv[i + 1];
    if (next != null && !next.startsWith('-')) {
      flags[name] = next;
      i++;
    } else {
      flags[name] = true;
    }
  }
  return { _, flags };
}

export function flag(args: Args, name: string): string | undefined {
  const value = args.flags[name];
  return typeof value === 'string' ? value : undefined;
}

export function on(args: Args, name: string): boolean {
  return args.flags[name] === true;
}

/** Words typed at the interactive prompt, with quotes preserved. */
export function splitWords(line: string): string[] {
  const out: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  for (const match of line.matchAll(re)) out.push(match[1] ?? match[2] ?? match[3] ?? '');
  return out.filter(Boolean);
}
