import type { Args } from './args.ts';
import { on } from './args.ts';

export function jsonMode(args: Args): boolean {
  return on(args, 'json');
}

export function emit(json: boolean, payload: unknown, text: string): void {
  if (json) console.log(JSON.stringify(payload, null, 2));
  else if (text) console.log(text);
}

export function clip(value: string | null | undefined, max = 140): string {
  const text = (value ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function heading(text: string): void {
  console.log(`\n${text}\n`);
}

export type Line = { title: string; meta?: string; command?: string };

export function printLines(lines: Line[], json: boolean, payload: unknown, empty = 'Nothing here yet.'): void {
  if (json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  if (!lines.length) {
    console.log(empty);
    return;
  }
  lines.forEach((line, index) => {
    const n = String(index + 1).padStart(2);
    console.log(`${n}  ${line.title}`);
    if (line.meta) console.log(`    ${line.meta}`);
    if (line.command) {
      const shown = /^https?:\/\//.test(line.command) ? line.command : `./lab-to-market ${line.command}`;
      console.log(`    ${shown}`);
    }
  });
}

export function paragraph(text: string, width = 78): string {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.join('\n');
}
