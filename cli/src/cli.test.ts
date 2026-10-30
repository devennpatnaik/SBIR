import { describe, expect, test } from 'bun:test';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseArgs, splitWords } from './args.ts';
import { pathText } from './cmd/offline.ts';
import { programLines } from './cmd/records.ts';
import { hints } from './model/hints.ts';
import { assemblePatents, assembleSbir, flattenPursue } from './model/pursue.ts';
import type { Technology } from '../../apps/untitled-app-6ac856247b02af3fede23b91/src/lib/types.ts';

const root = path.resolve(import.meta.dir, '../..');

function tech(partial: Partial<Technology> & Pick<Technology, 'id' | 'name'>): Technology {
  return {
    user_id: 'u',
    lab_id: null,
    description: '',
    source_url: '',
    source_name: '',
    lab_name: '',
    agency: '',
    inventors: '',
    category: '',
    applications: '',
    customers: '',
    competitors: '',
    maturity: '',
    ip_info: '',
    patent_numbers: '',
    licensing_status: 'unknown',
    licensing_status_source: '',
    sbir_relevance: '',
    open_questions: '',
    source_text: '',
    source_fetched_at: null,
    shortlisted: false,
    archived: false,
    is_sample: false,
    last_reviewed_at: null,
    created_at: '',
    updated_at: '',
    ...partial,
  };
}

describe('args', () => {
  test('flags and positionals', () => {
    const args = parseArgs(['pursue', '--track', 'patents', '--json', '--idea=water sensors']);
    expect(args._).toEqual(['pursue']);
    expect(args.flags.track).toBe('patents');
    expect(args.flags.json).toBe(true);
    expect(args.flags.idea).toBe('water sensors');
  });

  test('quoted words', () => {
    expect(splitWords('grants search "water sensors" --small-business')).toEqual([
      'grants', 'search', 'water sensors', '--small-business',
    ]);
  });
});

describe('pursue ranking', () => {
  test('sbir puts the stronger unpicked lead first and keeps process steps', () => {
    const list = assembleSbir({
      techs: [
        tech({ id: 'low', name: 'Plain idea' }),
        tech({
          id: 'high',
          name: 'Lab sensor',
          agency: 'DOE',
          lab_name: 'National Lab',
          licensing_status: 'available',
          category: 'sensors',
        }),
        tech({ id: 'picked', name: 'Already shortlisted', shortlisted: true, agency: 'NIH' }),
      ],
      evals: [],
      projectTechIds: new Set(),
      insightsByKey: {},
    });
    expect(list.unpicked.map(row => row.id)).toEqual(['high', 'low']);
    expect(list.acted.map(row => row.id)).toEqual(['picked']);
    expect(list.process.some(row => row.command === 'path')).toBe(true);
    expect(flattenPursue(list)[0]?.command).toBe('tech show high');
  });

  test('patents favor a lead that still looks unused', () => {
    const list = assemblePatents([
      tech({ id: 'bare', name: 'No number' }),
      tech({ id: 'patent', name: 'University patent', patent_numbers: 'US123', lab_name: 'State University', licensing_status: 'unknown' }),
    ]);
    expect(list.unpicked[0]?.id).toBe('patent');
    expect(list.process.some(row => row.command === 'patents search')).toBe(true);
  });
});

describe('offline product text', () => {
  test('path names the first SBIR step', () => {
    expect(pathText()).toContain('Pick the research');
    expect(pathText()).toContain('never submits for you');
  });

  test('programs include TechLink without an account', () => {
    const names = programLines('license').map(row => row.program.name);
    expect(names.some(name => /techlink/i.test(name))).toBe(true);
  });

  test('hints ask for outcomes before a thesis', () => {
    const lines = hints({
      hasProject: true,
      thesis: '',
      licensingStatus: 'unknown',
      outcomeAnswered: 0,
      openTasks: ['Email the tech-transfer office'],
    });
    expect(lines[0]).toContain('0/5');
    expect(lines.some(line => line.includes('thesis'))).toBe(true);
    expect(lines.some(line => line.includes('Email the tech-transfer office'))).toBe(true);
  });
});

describe('cli process', () => {
  test('guide runs with no API', () => {
    const result = spawnSync('bun', ['cli/src/main.ts', 'guide', 'What is my next step for SBIR Phase I?'], {
      cwd: root,
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Offline guide');
    expect(result.stdout).toContain('Single next action');
  });

  test('help does not open a session', () => {
    const result = spawnSync('bun', ['cli/src/main.ts', '--help'], { cwd: root, encoding: 'utf8' });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('pursue');
    expect(result.stdout).toContain('--json');
  });
});
