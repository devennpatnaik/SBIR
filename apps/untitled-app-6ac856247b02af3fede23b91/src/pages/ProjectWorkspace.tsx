import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { useBundle } from '../lib/bundle';
import { PATHWAYS, PROJECT_LICENSING_STATUS, statusLabel } from '../lib/constants';
import { fmtDate, nowIso, updateRow } from '../lib/data';
import { hashParam, navigate, setActiveProject, setHashParam } from '../lib/router';
import { summarize } from '../lib/scoring';
import { DeadlinesAndBlockers, NextActionPanel, QuestionList, StageBar, TaskList } from '../components/ProjectParts';
import { SourcesPanel } from '../components/Sources';
import { ConfidenceBadge } from '../components/Scoring';
import { Badge, Button, Card, ErrorNote, InlineText, PageHeader, SampleBadge, SourceLink, Tabs } from '../components/ui';

type Tab = 'overview' | 'tasks' | 'questions' | 'evidence' | 'history';

export function ProjectWorkspace({ id }: { id: string }) {
  const b = useBundle(id);
  const tab = (hashParam('tab') as Tab) || 'overview';
  useEffect(() => { setActiveProject(id); }, [id]);
  if (b.loading) return <p className="text-sm text-slate-500">Loading project…</p>;
  if (!b.project) return <ErrorNote error={b.error ?? 'Project not found.'} />;
  const p = b.project, t = b.tech;
  const save = (field: string) => async (v: string) => updateRow('projects', p.id, { [field]: v, updated_at: nowIso() });
  const s = summarize(b.evaluation, t);
  const openTasks = b.tasks.filter(x => x.status !== 'done' && x.status !== 'skipped').length;
  const openQ = b.questions.filter(q => q.status === 'open').length;

  return (
    <div>
      <button type="button" onClick={() => navigate('projects')} className="mb-2 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft className="size-4" />All projects</button>
      <PageHeader title={p.name} subtitle={<span className="flex items-center gap-2">{t?.is_sample && <SampleBadge />}{t?.lab_name}{t?.agency && ` · ${t.agency}`}{t?.source_url && <SourceLink url={t.source_url} label="Original listing" />}</span>}
        actions={<Button onClick={() => updateRow('projects', p.id, { archived: !p.archived })}>{p.archived ? 'Restore project' : 'Archive project'}</Button>} />
      <Card className="mb-4"><StageBar project={p} /></Card>
      <div className="mb-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <NextActionPanel bundle={b} />
        <Card title="Snapshot">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2"><dt className="text-slate-500">Score</dt><dd>{s.overall == null ? 'not scored' : `${s.overall}/100`} <ConfidenceBadge c={s.confidence} /></dd></div>
            <div className="flex justify-between gap-2"><dt className="text-slate-500">Licensing</dt><dd className="text-right">{PROJECT_LICENSING_STATUS[p.licensing_status]}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-slate-500">Pathway</dt><dd>{PATHWAYS[p.licensing_pathway]?.label}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-slate-500">Tech-transfer contact</dt><dd className="text-right">{b.contacts[0] ? `${b.contacts[0].name}${b.contacts[0].email ? ` · ${b.contacts[0].email}` : ''}` : b.lab?.tto_email || <a className="text-blue-700 underline" href="#/licensing?tab=office">add</a>}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-slate-500">Funding opportunities</dt><dd>{b.links.filter(l => l.status !== 'rejected').length} linked</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-slate-500">Customer interviews</dt><dd>{b.interviews.length}</dd></div>
          </dl>
        </Card>
      </div>
      <div className="mb-4"><DeadlinesAndBlockers bundle={b} /></div>

      <Tabs tabs={[['overview', 'Business thesis'], ['tasks', `Tasks (${openTasks})`], ['questions', `Questions & risks (${openQ})`], ['evidence', 'Sources & evidence'], ['history', 'Stage history']]} value={tab} onChange={v => setHashParam('tab', v)} />
      <div className="mt-4">
        {tab === 'overview' && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Technology">
              <p className="whitespace-pre-wrap text-sm text-slate-700">{t?.description || 'No description.'}</p>
              <a href={`#/tech/${p.technology_id}`} className="mt-2 inline-block text-sm text-blue-700 hover:underline">Technology details and scores →</a>
            </Card>
            <Card title="Proposed commercial application">
              <div className="space-y-3">
                <InlineText label="Commercial application" multiline value={p.application_summary} onSave={save('application_summary')} placeholder="What product will you build on this technology?" />
                <InlineText label="Target customer" multiline value={p.target_customer} onSave={save('target_customer')} placeholder="Who buys it? Be specific (role, organization type)." />
                <InlineText label="Problem to solve" multiline value={p.problem} onSave={save('problem')} placeholder="What painful problem does the customer have today?" />
              </div>
            </Card>
            <Card title="Preliminary business thesis" className="lg:col-span-2">
              <InlineText label="Business thesis" multiline rows={4} value={p.business_thesis} onSave={save('business_thesis')} placeholder="For [customer] who [problem], [product] uses [lab technology] to [benefit], unlike [alternative]. We will license it via [pathway] and fund development through [SBIR topic / other]." />
              <p className="mt-2 text-xs text-slate-500">This is your hypothesis. Test it through customer interviews before relying on it.</p>
            </Card>
            <Card title="Risks" className="lg:col-span-2">
              <InlineText label="Key risks (summary)" multiline value={p.risks} onSave={save('risks')} placeholder="Technical, market, IP, regulatory, team, funding risks." />
              <p className="mt-2 text-xs text-slate-500">Track individual risks on the Questions & risks tab.</p>
            </Card>
          </div>
        )}
        {tab === 'tasks' && <Card><TaskList projectId={p.id} tasks={b.tasks} /></Card>}
        {tab === 'questions' && <Card><QuestionList projectId={p.id} questions={b.questions} /></Card>}
        {tab === 'evidence' && <Card><SourcesPanel scope={{ project_id: p.id }} /></Card>}
        {tab === 'history' && (
          <Card>
            <ul className="space-y-3">{b.history.map(h => (
              <li key={h.id} className="text-sm"><div><Badge tone="blue">{statusLabel(h.to_status)}</Badge> <span className="text-xs text-slate-500">{fmtDate(h.created_at)}{h.from_status && ` · from ${statusLabel(h.from_status)}`}</span></div>{h.reason && <p className="mt-1 text-slate-700">{h.reason}</p>}</li>
            ))}</ul>
          </Card>
        )}
      </div>
    </div>
  );
}
