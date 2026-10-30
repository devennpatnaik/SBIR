import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { CliError } from './api.ts';
import type { Ask } from './cmd/account.ts';

let owned: readline.Interface | null = null;

/** Read one line. Reuses the caller's prompt when the interactive session already owns stdin. */
export async function askLine(existing: Ask | undefined, question: string): Promise<string> {
  if (existing) return existing(question);
  if (!stdin.isTTY) throw new CliError(`Need an answer for: ${question.trim()}`);
  owned ??= readline.createInterface({ input: stdin, output: stdout });
  return owned.question(question);
}

export function closeAsk(): void {
  owned?.close();
  owned = null;
}
