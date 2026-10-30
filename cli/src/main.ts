#!/usr/bin/env bun
import { stdin, stdout } from 'node:process';
import { parseArgs } from './args.ts';
import { CliError } from './api.ts';
import { walkLoop } from './cmd/walk.ts';
import { dispatch } from './dispatch.ts';
import { closeAsk } from './prompt.ts';

const argv = process.argv.slice(2);

if (argv.length === 0) {
  try {
    if (stdin.isTTY && stdout.isTTY) await walkLoop();
    else await dispatch(parseArgs(['status']));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
  process.exit(process.exitCode ?? 0);
}

try {
  await dispatch(parseArgs(argv));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  if (process.env.LTM_DEBUG && error instanceof Error && !(error instanceof CliError)) console.error(error.stack);
  process.exitCode = 1;
} finally {
  closeAsk();
}
