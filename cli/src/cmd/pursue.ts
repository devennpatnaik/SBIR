import type { CohortInsights } from '../../../packages/learning/index.ts';
import { flag, type Args } from '../args.ts';
import { api, rows } from '../api.ts';
import { clip, emit, jsonMode, printLines, type Line } from '../format.ts';
import { assemblePatents, assembleSbir, flattenPursue, type PursueList, type PursueRow } from '../model/pursue.ts';
import { currentTrack, type Track } from '../session.ts';
import type { Evaluation, Project, Technology } from '../../../apps/untitled-app-6ac856247b02af3fede23b91/src/lib/types.ts';

export function resolveTrack(args: Args): Track {
  const explicit = flag(args, 'track');
  if (explicit === 'patents' || explicit === 'sbir') return explicit;
  const positional = args._[1];
  if (args._[0] === 'pursue' || args._[0] === 'next') {
    if (positional === 'patents' || positional === 'sbir') return positional;
  }
  return currentTrack();
}

async function insightsFor(techs: Technology[]): Promise<Record<string, CohortInsights | null>> {
  const keys = [...new Set(techs.map(tech => `${tech.agency}|${tech.category}`))];
  const entries = await Promise.all(keys.map(async key => {
    const [agency, category] = key.split('|');
    try {
      const body = await api<{ insights: CohortInsights | null }>(
        `/learning/insights?agency=${encodeURIComponent(agency ?? '')}&category=${encodeURIComponent(category ?? '')}`,
      );
      return [key, body.insights] as const;
    } catch {
      return [key, null] as const;
    }
  }));
  return Object.fromEntries(entries);
}

export async function loadPursue(track: Track): Promise<PursueList> {
  const techs = await rows<Technology>('technologies', 'archived=eq.false&order=updated_at.desc');
  if (track === 'patents') return assemblePatents(techs);
  const [evals, projects, insightsByKey] = await Promise.all([
    rows<Evaluation>('evaluations'),
    rows<Pick<Project, 'id' | 'technology_id'>>('projects', 'archived=eq.false&select=id,technology_id'),
    insightsFor(techs),
  ]);
  return assembleSbir({
    techs,
    evals,
    projectTechIds: new Set(projects.map(project => project.technology_id).filter(Boolean)),
    insightsByKey,
  });
}

function linesOf(rowsToPrint: PursueRow[]): Line[] {
  return rowsToPrint.map(row => ({
    title: row.score == null ? row.title : `${row.score}  ${row.title}`,
    meta: `${row.badge} · ${clip(row.note, 110)}`,
    command: row.command,
  }));
}

export function formatPursue(list: PursueList): string {
  const sections: [string, PursueRow[]][] = [
    ['Unpicked — most promising first', list.unpicked],
    ['Process', list.process],
    ['Already in motion', list.acted],
  ];
  const chunks: string[] = [`${list.track === 'sbir' ? 'SBIR' : 'Patents'} — pick one, then run the command under it.\n`];
  let n = 0;
  for (const [title, rowsToPrint] of sections) {
    if (!rowsToPrint.length) continue;
    chunks.push(title);
    for (const row of rowsToPrint) {
      n += 1;
      const score = row.score == null ? '  ' : String(row.score).padStart(2);
      chunks.push(`${String(n).padStart(2)}  ${score}  ${row.title}`);
      chunks.push(`       ${row.badge} · ${clip(row.note, 100)}`);
      chunks.push(`       ./lab-to-market ${row.command}`);
    }
    chunks.push('');
  }
  if (n === 0) chunks.push('Nothing saved yet. Read the path, or search grants and patents.');
  return chunks.join('\n').trimEnd();
}

export async function pursue(args: Args): Promise<PursueList> {
  const list = await loadPursue(resolveTrack(args));
  const flat = flattenPursue(list);
  emit(jsonMode(args), { track: list.track, items: flat }, formatPursue(list));
  return list;
}

export async function next(args: Args): Promise<void> {
  const list = await loadPursue(resolveTrack(args));
  const row = list.unpicked[0] ?? list.process[0];
  if (!row) {
    emit(jsonMode(args), { track: list.track, next: null }, 'Nothing to pursue yet. Try: path');
    return;
  }
  const text = [
    row.score == null ? row.title : `${row.title}  (${row.score})`,
    clip(row.note, 160),
    '',
    `Next command:  ./lab-to-market ${row.command}`,
  ].join('\n');
  emit(jsonMode(args), { track: list.track, next: row }, text);
}
