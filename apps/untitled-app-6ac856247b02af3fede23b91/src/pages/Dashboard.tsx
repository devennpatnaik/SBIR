import { DemoLauncher } from '../components/Demo';
import { useBundle } from '../lib/bundle';
import { PROJECT_LICENSING_STATUS, statusIndex, statusLabel } from '../lib/constants';
import { useQuery } from '../lib/data';
import { navigate, useActiveProjectId } from '../lib/router';
import type { Project, Technology } from '../lib/types';
import { DeadlinesAndBlockers, NextActionPanel, StageBar } from '../components/ProjectParts';
import { HelpSuggestions } from '../components/Help';
import { Button, Card, Empty, PageHeader, SampleBadge, Select } from '../components/ui';

export function Dashboard() {
  const projects = useQuery<Project>('projects', q => q.eq('archived', false).order('updated_at', { ascending: false }));
  const techs = useQuery<Technology>('technologies', q => q.select('id,shortlisted,archived'));
  const [active, setActive] = useActiveProjectId();
  const current = projects.data.find(p => p.id === active) ?? projects.data[0];
  const b = useBundle(current?.id);

  if (projects.loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!current) {
    const n = techs.data.filter(t => !t.archived).length;
    const steps = [
      { done: n > 0, title: 'Add technologies', text: 'Paste a technology page URL from TechLink, DOE LPS, FLC, or a lab site.', link: 'discover' },
      { done: n > 1, title: 'Score and compare', text: 'Rate each candidate on 10 commercial dimensions with evidence.', link: 'compare' },
      { done: false, title: 'Select one technology', text: 'Creates your project with a roadmap and next actions.', link: 'compare' },
    ];
    return (
      <div>
        <PageHeader title="Welcome" subtitle="This workspace takes you from a federal-lab technology to a license, an SBIR/STTR proposal, and a commercial product — one next action at a time." />
        <DemoLauncher welcome />
        <Card title="Or start your own project">
          <ol className="space-y-3">{steps.map((s, i) => (
            <li key={s.title} className="flex items-start gap-3">
              <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${s.done ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>{s.done ? '✓' : i + 1}</span>
              <div className="flex-1"><div className="font-medium">{s.title}</div><div className="text-sm text-slate-600">{s.text}</div></div>
              <Button size="sm" variant={!s.done && (i === 0 || steps[i - 1]!.done) ? 'primary' : 'secondary'} onClick={() => navigate(s.link)}>Go</Button>
            </li>
          ))}</ol>
        </Card>
        <div className="mt-4"><HelpSuggestions projectId={null} stage="discover" limit={4} title="Free help finding and evaluating a technology" /></div>
        <div className="mt-4"><Empty title="You are not pursuing a technology yet">Once you select a technology, this dashboard shows its stage, your next action, approaching deadlines, and what is blocking progress.</Empty></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Dashboard" actions={projects.data.length > 1 && <Select aria-label="Active project" value={current.id} onChange={e => setActive(e.target.value)} options={projects.data.map(p => [p.id, p.name] as [string, string])} className="w-72" />} />
      <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card title="Which technology am I pursuing?">
          <a href={`#/projects/${current.id}`} className="text-lg font-semibold text-slate-900 hover:underline">{current.name}</a>
          <div className="mt-1 text-sm font-medium text-slate-700">Technology: {b.tech?.name ?? 'Loading…'}</div>
          {b.tech?.is_sample && <div className="mt-1"><SampleBadge /></div>}
          <div className="mt-1 text-sm text-slate-600">{b.tech?.lab_name}{b.tech?.agency && ` · ${b.tech.agency}`}</div>
          {current.business_thesis ? <p className="mt-3 line-clamp-4 text-sm text-slate-700">{current.business_thesis}</p> : <p className="mt-3 text-sm text-slate-500">No business thesis yet.</p>}
          <div className="mt-3 text-sm"><span className="text-slate-500">Licensing:</span> {PROJECT_LICENSING_STATUS[current.licensing_status]}</div>
          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="mb-2 text-xs font-medium uppercase text-slate-500">What stage is it in?</div>
            <div className="text-sm font-medium">Stage {statusIndex(current.status) + 1}: {statusLabel(current.status)}</div>
          </div>
        </Card>
        <NextActionPanel bundle={b} limit={3} />
      </div>
      <Card className="mb-4"><StageBar project={current} /></Card>
      <HelpSuggestions projectId={current.id} limit={3} title="Free help that fits right now" />
      <DeadlinesAndBlockers bundle={b} />
    </div>
  );
}
