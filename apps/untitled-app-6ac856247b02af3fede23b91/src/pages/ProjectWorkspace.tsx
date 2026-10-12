import { ArrowLeft, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useBundle } from '../lib/bundle';
import { PATHWAYS, PROJECT_LICENSING_STATUS, statusLabel } from '../lib/constants';
import { fmtDate, nowIso, updateRow } from '../lib/data';
import { hashParam, navigate, setActiveProject, setHashParam } from '../lib/router';
import { summarize } from '../lib/scoring';
import { DeadlinesAndBlockers, NextActionPanel, QuestionList, StageBar, TaskList } from '../components/ProjectParts';
import { SourcesPanel } from '../components/Sources';
import { ConfidenceBadge } from '../components/Scoring';
import { Badge, Button, Card, Disclosure, displayName, displaySummary, ErrorNote, InlineText, PageHeader, SampleBadge, SourceLink, Tabs, Textarea, useAsync } from '../components/ui';

type Tab = 'overview' | 'tasks' | 'questions' | 'evidence' | 'history';

export function ProjectWorkspace({ id }: { id: string }) {
  const b = useBundle(id);
  const [editing, setEditing] = useState(false);
  const [idea, setIdea] = useState({business_thesis:'',target_customer:'',problem:''});
  const editAction = useAsync();
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
      <PageHeader title={p.name} subtitle={<span className="flex items-center gap-2">{t?.is_sample && <SampleBadge />}{displayName(t?.lab_name ?? '')}{t?.source_url && <SourceLink url={t.source_url} label="Original listing" />}</span>}
        actions={<Button onClick={() => updateRow('projects', p.id, { archived: !p.archived })}>{p.archived ? 'Restore project' : 'Archive project'}</Button>} />
      <div className="project-context"><span>{statusLabel(p.status)}</span><span>{openTasks} open tasks</span><span>{openQ} questions to explore</span></div>
      <Tabs tabs={[['overview', 'Business thesis'], ['tasks', `Tasks (${openTasks})`], ['questions', `Questions & risks (${openQ})`], ['evidence', 'Sources & evidence'], ['history', 'Stage history']]} value={tab} onChange={v => setHashParam('tab', v)} />
      <div className="mt-4">
        {tab === 'overview' && (
          <div className="project-overview"><ErrorNote error={editAction.error}/>
            <section className="project-story"><div className="section-heading"><p className="eyebrow !mb-0">THE BUSINESS IDEA</p><div className="flex gap-2">{editing&&<Button size="sm" disabled={editAction.busy} onClick={()=>setEditing(false)}>Cancel</Button>}<Button size="sm" busy={editAction.busy} variant={editing?'primary':'secondary'} onClick={()=>{if(!editing){setIdea({business_thesis:p.business_thesis,target_customer:p.target_customer,problem:p.problem});setEditing(true);}else void editAction.run(async()=>{await updateRow('projects',p.id,{...idea,updated_at:nowIso()});setEditing(false);});}}><Pencil size={13}/>{editing?'Save idea':'Edit your idea'}</Button></div></div>{editing?<Textarea aria-label="Business thesis" rows={6} value={idea.business_thesis} onChange={e=>setIdea({...idea,business_thesis:e.target.value})}/>:<p className="editorial thesis-text">{displayName(p.business_thesis)||'Who has the problem, and how will you solve it?'}</p>}<p className="mt-6 text-xs text-slate-500">A working hypothesis, not a proven business. Test it with customers.</p></section>
            <div className="grid gap-5 md:grid-cols-2"><Card title="Who is it for?">{editing?<Textarea aria-label="Target customer" value={idea.target_customer} onChange={e=>setIdea({...idea,target_customer:e.target.value})}/>:<p className="text-sm leading-relaxed text-slate-600">{displayName(p.target_customer)||'Describe your first customer.'}</p>}</Card><Card title="What changes for them?">{editing?<Textarea aria-label="Problem to solve" value={idea.problem} onChange={e=>setIdea({...idea,problem:e.target.value})}/>:<p className="text-sm leading-relaxed text-slate-600">{displayName(p.problem)||'Describe the problem you want to solve.'}</p>}</Card></div>
            <Disclosure title="The product and the technology"><div className="grid gap-5 md:grid-cols-2"><Card title="Commercial application"><InlineText label="Commercial application" multiline value={p.application_summary} onSave={save('application_summary')}/></Card><Card title="Technology"><p className="text-sm leading-relaxed">{displaySummary(t?.description||'No description recorded.')}</p><a href={`#/tech/${p.technology_id}`} className="mt-4 inline-block text-sm text-blue-700">Open technology ↗</a></Card></div></Disclosure>
            <Disclosure title="Risks to keep in mind"><InlineText label="Key risks (summary)" multiline value={p.risks} onSave={save('risks')}/></Disclosure>
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
      <Disclosure title="Project status, next actions & deadlines">
      <Card className="mb-4"><StageBar project={p} /></Card>
      <div className="mb-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <NextActionPanel bundle={b} limit={2} />
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

      </Disclosure>
    </div>
  );
}
