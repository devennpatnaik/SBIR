import { offlineGuideReply } from '../../../backend/lib/offline-guide.ts';
import { pathwayByKey } from '../../../packages/pathways/index.ts';
import { CliError } from '../api.ts';
import { paragraph } from '../format.ts';

export function pathText(): string {
  const path = pathwayByKey('sbir_track');
  if (!path) throw new CliError('The SBIR path is missing from the catalog.');
  const phases = [
    'Phase I — Prove it can work. A smaller award to test feasibility.',
    'Phase II — Build and demonstrate it. Not automatic after Phase I.',
    'Phase III — Sell it, with money from outside the SBIR set-aside.',
  ];
  const steps = path.steps.map((step, index) => `${index + 1}. ${step.title}\n   ${paragraph(step.description)}`).join('\n\n');
  const sources = path.sources.map(source => `${source.label}\n  ${source.url}`).join('\n');
  return [
    'Get paid to turn research into a product.',
    '',
    paragraph('Federal agencies set aside part of their research budgets for small businesses. If your company wins, the agency pays you to do the R&D. You keep the company. The government takes no equity.'),
    '',
    phases.join('\n'),
    '',
    'Seven steps',
    '',
    steps,
    '',
    paragraph(path.boundary),
    '',
    'You confirm eligibility, and you submit. This program never submits for you.',
    '',
    `Official sources, checked ${path.checked_on}`,
    sources,
  ].join('\n');
}

export function printPath(): void {
  console.log(pathText());
}

export function guide(question: string): void {
  const text = question.trim();
  if (text.length < 2) throw new CliError('Ask a question, for example: guide "What should I do next?"');
  console.log(offlineGuideReply(text));
}
