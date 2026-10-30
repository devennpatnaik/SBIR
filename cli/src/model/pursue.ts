import type { CohortInsights } from '../../../packages/learning/index.ts';
import { pathwayByKey } from '../../../packages/pathways/index.ts';
import {
  patentPromiseScore,
  rankPursueItems,
  sbirPromiseScore,
  splitPursueSections,
  techPursueStatus,
} from '../../../apps/untitled-app-6ac856247b02af3fede23b91/src/lib/pursueRank.ts';
import type { Evaluation, Technology } from '../../../apps/untitled-app-6ac856247b02af3fede23b91/src/lib/types.ts';
import type { Track } from '../session.ts';

export type PursueRow = {
  id: string;
  kind: 'technology' | 'process';
  title: string;
  note: string;
  badge: string;
  score: number | null;
  status: 'unpicked' | 'progress' | 'done' | 'process';
  /** Next CLI command, without the ./lab-to-market prefix. */
  command: string;
};

export type PursueList = {
  track: Track;
  unpicked: PursueRow[];
  process: PursueRow[];
  acted: PursueRow[];
};

export function flattenPursue(list: PursueList): PursueRow[] {
  return [...list.unpicked, ...list.process, ...list.acted];
}

function techRow(tech: Technology, score: number, status: 'unpicked' | 'progress' | 'done', track: Track): PursueRow {
  const bits = [
    tech.agency || null,
    tech.lab_name || null,
    track === 'patents' ? (tech.patent_numbers || null) : null,
    tech.is_sample ? 'sample' : null,
  ].filter(Boolean);
  return {
    id: tech.id,
    kind: 'technology',
    title: tech.name || 'Untitled technology',
    note: bits.join(' · ') || (track === 'patents' ? 'Saved patent lead' : 'Lab technology'),
    badge: status === 'unpicked' ? 'unpicked' : status === 'progress' ? 'in progress' : 'done',
    score: Math.round(score),
    status,
    command: `tech show ${tech.id}`,
  };
}

function sbirProcess(): PursueRow[] {
  const path = pathwayByKey('sbir_track');
  const rows: PursueRow[] = [
    {
      id: 'path',
      kind: 'process',
      title: 'The SBIR path (seven steps)',
      note: 'Eligibility, solicitation, proposal prep.',
      badge: 'process',
      score: null,
      status: 'process',
      command: 'path',
    },
    {
      id: 'kickoff',
      kind: 'process',
      title: 'Start an SBIR idea',
      note: 'A few questions, then a saved plan with one next step.',
      badge: 'start',
      score: null,
      status: 'process',
      command: 'kickoff --path sbir',
    },
    {
      id: 'techs',
      kind: 'process',
      title: 'Browse saved government R&D',
      note: 'Technologies already in your collection.',
      badge: 'collection',
      score: null,
      status: 'process',
      command: 'tech list',
    },
    {
      id: 'funding',
      kind: 'process',
      title: 'SBIR solicitations and grants',
      note: 'Official SBIR.gov solicitations, then Grants.gov.',
      badge: 'funding',
      score: null,
      status: 'process',
      command: 'sbir',
    },
  ];
  for (const step of (path?.steps ?? []).slice(0, 4)) {
    rows.push({
      id: `step:${step.title}`,
      kind: 'process',
      title: step.title,
      note: step.description,
      badge: 'path step',
      score: null,
      status: 'process',
      command: 'path',
    });
  }
  return rows;
}

function patentProcess(shortlisted: number): PursueRow[] {
  return [
    {
      id: 'search',
      kind: 'process',
      title: 'Search patents worldwide',
      note: 'Discovery only. A hit is not a license and may not be SBIR-eligible.',
      badge: 'search',
      score: null,
      status: 'process',
      command: 'patents search',
    },
    {
      id: 'shortlist',
      kind: 'process',
      title: 'Review your shortlist',
      note: `${shortlisted} shortlisted lead(s).`,
      badge: 'shortlist',
      score: null,
      status: 'process',
      command: 'tech list --shortlisted',
    },
  ];
}

export function assembleSbir(input: {
  techs: Technology[];
  evals: Evaluation[];
  projectTechIds: Set<string>;
  insightsByKey: Record<string, CohortInsights | null | undefined>;
}): PursueList {
  const ranked = rankPursueItems(input.techs.filter(tech => !tech.archived).map(tech => {
    const key = `${tech.agency}|${tech.category}`;
    const score = sbirPromiseScore(tech, input.evals.find(ev => ev.technology_id === tech.id), input.insightsByKey[key]);
    return { item: tech, status: techPursueStatus(tech, input.projectTechIds.has(tech.id)), score };
  }));
  const sections = splitPursueSections(ranked);
  return {
    track: 'sbir',
    unpicked: sections.unpicked.map(row => techRow(row.item, row.score, row.status, 'sbir')),
    process: sbirProcess(),
    acted: sections.acted.map(row => techRow(row.item, row.score, row.status, 'sbir')),
  };
}

export function assemblePatents(techs: Technology[]): PursueList {
  const live = techs.filter(tech => !tech.archived);
  const ranked = rankPursueItems(live.map(tech => ({
    item: tech,
    status: techPursueStatus(tech, false),
    score: patentPromiseScore(tech),
  })));
  const sections = splitPursueSections(ranked);
  const shortlisted = sections.acted.filter(row => row.status === 'progress').length;
  return {
    track: 'patents',
    unpicked: sections.unpicked.map(row => techRow(row.item, row.score, row.status, 'patents')),
    process: patentProcess(shortlisted),
    acted: sections.acted.map(row => techRow(row.item, row.score, row.status, 'patents')),
  };
}
