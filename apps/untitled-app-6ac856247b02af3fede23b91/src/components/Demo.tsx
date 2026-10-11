import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import type { Database } from '@project/database';
import { backend, invalidate, useQuery } from '../lib/data';
import { navigate, setActiveProject, useActiveProjectId } from '../lib/router';
import { Button, Card, ErrorNote, Modal, useAsync } from './ui';

type Demo = Database['public']['Tables']['demo_workspaces']['Row'];
export function DemoLauncher({ welcome = false }: { welcome?: boolean }) {
  const q = useQuery<Demo>('demo_workspaces', b => b.limit(1));
  const demo = q.data[0];
  const [open, setOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const { busy, error, run } = useAsync();
  const start = () => run(async () => {
    const result = await backend<Demo>('/demo', { method: 'POST', body: JSON.stringify({ operation: 'create' }) });
    setActiveProject(result.project_id); invalidate(); setOpen(false); navigate('dashboard');
  });
  return <>
    {welcome ? <Card className="mb-4 border-blue-200" title="Try a complete company first">
      <p className="mb-3 text-sm text-slate-600">Explore HarborTrace Instruments, a fictional wastewater-sensor startup. Compare three technologies, review a practice proposal, and see how licensing, customer research and finances connect.</p>
      <Button variant="primary" onClick={() => setOpen(true)}><FlaskConical className="size-4" />Explore demo company</Button>
      <p className="mt-2 text-xs text-slate-500">Private to your account. Editable, clearly labeled, and removable. Nothing is sent or submitted.</p>
    </Card> : <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"><FlaskConical className="size-4" />Demo company</button>}
    <Modal open={open} onClose={() => !busy && setOpen(false)} title="Explore HarborTrace Instruments">
      <div className="space-y-3 text-sm">
        <p>A complete, fictional pre-revenue business with <b>3 scored technologies, 2 funding examples, a 12-section proposal, 5 simulated interviews, 12 milestones and 9 working documents</b>.</p>
        <p>All company claims, people, measurements, budgets and dates are sample assumptions. No patent, license, customer, submission or award is real. Official support-program information remains separate.</p>
        <p>Your real projects and profile answers stay unchanged. Reopening the demo preserves your edits. You can remove it and create a fresh copy later.</p>
        {removing && <div className="rounded border border-red-200 bg-red-50 p-3 text-red-800">Remove the demo and <b>all edits and records linked to its technologies, funding examples and project</b>? Unrelated records stay. This cannot be undone.</div>}
        <ErrorNote error={error} />
        <div className="flex flex-wrap gap-2">
          {!removing && <Button variant="primary" busy={busy} onClick={start}>{demo ? 'Open my demo' : 'Create my demo'}</Button>}
          {demo && <Button variant="danger" busy={busy} onClick={() => {
            if (!removing) { setRemoving(true); return; }
            void run(async () => {
              await backend('/demo', { method: 'POST', body: JSON.stringify({ operation: 'remove' }) });
              setActiveProject(null); invalidate(); setRemoving(false); setOpen(false); navigate('dashboard');
            });
          }}>{removing ? 'Yes, remove demo data' : 'Remove demo data'}</Button>}
          <Button disabled={busy} onClick={() => removing ? setRemoving(false) : setOpen(false)}>Cancel</Button>
        </div>
        {busy && <p role="status">Please wait. You can safely reopen the demo after a connection interruption; it will not be duplicated.</p>}
      </div>
    </Modal>
  </>;
}

export function DemoGuide({ section }: { section: string }) {
  const q = useQuery<Demo>('demo_workspaces', b => b.limit(1));
  const [active] = useActiveProjectId();
  const d = q.data[0];
  const [expanded, setExpanded] = useState(false);
  if (!d || active !== d.project_id) return null;
  const steps = [
    ['dashboard', '1. Dashboard', 'See the company, stage, next action, dates and blockers.'],
    ['discover', '2. Technologies', 'Open the three fictional candidates and inspect what is known versus assumed.'],
    ['compare', '3. Compare', 'Review all ten scores and the reasons for selecting the ammonia cartridge. Low confidence is intentional.'],
    [`projects/${d.project_id}`, '4. Company project', 'Read the business thesis. Try editing it; your changes are saved to your private demo.'],
    ['licensing', '5. Licensing', 'Review unanswered IP questions, the proposed evaluation pathway and the unsent inquiry.'],
    ['funding', '6. Funding', 'Compare the pursued water-monitoring exercise with the rejected infrastructure example. Dates are fictional.'],
    [`proposals/${d.proposal_id}`, '7. Proposal', 'Read the 12-section practice draft. Missing evidence and unconfirmed requirements remain visible.'],
    ['roadmap', '8. Roadmap', 'Inspect all 12 milestone categories and the five simulated interviews, including a negative response.'],
    ['documents', '9. Documents', 'Read the company brief, budget, runway, unit economics, test plan and risk register.'],
  ];
  const index = steps.findIndex(s => s[0].split('/')[0] === section);
  const current = steps[index < 0 ? 0 : index];
  return <section aria-label="Demo guide" className="mb-4 rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-violet-950">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <strong>[SAMPLE] HarborTrace Instruments</strong>
      <button type="button" aria-expanded={expanded} className="text-xs underline" onClick={() => setExpanded(!expanded)}>{expanded ? 'Hide walkthrough' : 'Show walkthrough'}</button>
    </div>
    <p className="mt-1 text-xs">Fictional training data, not verified evidence. No real license, customer commitment, application or award. All demo dates are illustrative.</p>
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="w-full min-w-0 sm:w-auto sm:flex-1">{current[2]}</span>
      {index > 0 && <Button size="sm" onClick={() => navigate(steps[index - 1][0])}>Back</Button>}
      <Button size="sm" onClick={() => navigate(steps[(index + 1) % steps.length][0])}>{index === steps.length - 1 ? 'Back to dashboard' : `Next: ${steps[(index + 1) % steps.length][1].replace(/^\d+\. /, '')}`}</Button>
    </div>
    {expanded && <nav aria-label="Demo walkthrough" className="mt-3 flex flex-wrap gap-2">{steps.map(([path,label]) => <a className="rounded border border-violet-200 bg-white px-2 py-1 text-xs hover:underline" key={path} href={`#/${path}`}>{label}</a>)}</nav>}
  </section>;
}
