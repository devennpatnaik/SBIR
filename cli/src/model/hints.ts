export type HintInput = {
  hasProject: boolean;
  thesis: string;
  licensingStatus: string;
  outcomeAnswered: number;
  openTasks: string[];
};

/** First moves a person can take from a technology record. Ordered, short, and local. */
export function hints(input: HintInput): string[] {
  const out: string[] = [];
  if (input.outcomeAnswered < 5) {
    out.push(`Record what happened (${input.outcomeAnswered}/5 outcome questions answered).`);
  }
  if (!input.hasProject) out.push('No project yet. Start one with kickoff, or keep this as a lead.');
  else if (!input.thesis.trim()) out.push('Write a one-paragraph business thesis on the project.');
  if (!input.licensingStatus || input.licensingStatus === 'unknown') {
    out.push('Licensing status is still unknown. Confirm it with the owner before you rely on it.');
  }
  for (const title of input.openTasks.slice(0, 3)) out.push(title);
  return out;
}
