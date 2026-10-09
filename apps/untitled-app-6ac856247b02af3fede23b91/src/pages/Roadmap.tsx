import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useBundle, type Bundle } from '../lib/bundle';
import { ROADMAP_CATEGORIES } from '../lib/constants';
import { deleteRow, fmtDate, insertRow, insertRows } from '../lib/data';
import { hashParam, setHashParam } from '../lib/router';
import type { Interview } from '../lib/types';
import { ProjectPicker, TaskList } from '../components/ProjectParts';
import { Badge, Button, Card, Empty, Field, Input, Modal, Notice, PageHeader, Select, Tabs, Textarea, useAsync } from '../components/ui';

const SUGGESTED: Record<string, string[]> = {
  customer_discovery: ['Complete 10 customer-discovery interviews', 'Identify the economic buyer and decision process'],
  demand_evidence: ['Obtain 2 letters of support', 'Get a signed LOI or paid pilot commitment'],
  prototype: ['Build a first working prototype'],
  technical_performance: ['Demonstrate key performance metric vs. baseline'],
  ip_licensing: ['Sign option or license agreement', 'File any improvement patents'],
  regulatory: ['Identify applicable regulations / certifications'],
  pilots: ['Run first pilot with a customer'],
  manufacturing: ['Identify manufacturing or deployment partner'],
  partners: ['Sign first strategic partner agreement'],
  phase2: ['Identify Phase II opportunity and requirements'],
  phase3: ['Identify Phase III / non-SBIR funding or contract channels'],
  revenue: ['First paying customer', 'Reach first $100k in revenue'],
};

export function Roadmap() {
  return (
    <div>
      <PageHeader title="Commercialization roadmap" subtitle="Milestones from customer discovery to revenue. It continues after any SBIR/STTR award — Phase III and commercial sales are never automatic." />
      <ProjectPicker>{id => <RoadmapFor id={id} />}</ProjectPicker>
    </div>
  );
}

function RoadmapFor({ id }: { id: string }) {
  const b = useBundle(id);
  const tab = (hashParam('tab') as 'milestones' | 'interviews') || 'milestones';
  if (!b.project) return <p className="text-sm text-slate-500">Loading…</p>;
  const ms = b.tasks.filter(t => t.kind === 'milestone');
  const doneIds = new Set(b.tasks.filter(t => t.status === 'done').map(t => t.id));
  const next = ms.filter(t => t.status !== 'done' && t.status !== 'skipped' && (!t.depends_on || doneIds.has(t.depends_on)))
    .sort((a, c) => (a.due_date ?? '9999').localeCompare(c.due_date ?? '9999') || a.priority - c.priority)[0];
  return (
    <div>
      <Card className="mb-4" title="Next milestone">
        {next ? <div><div className="font-medium">{next.title}</div><div className="text-sm text-slate-500">{ROADMAP_CATEGORIES.find(c => c.key === next.roadmap_category)?.label}{next.due_date && ` · target ${fmtDate(next.due_date)}`}</div></div>
          : <p className="text-sm text-slate-600">{ms.length ? 'All milestones are complete or blocked by dependencies.' : 'No milestones yet. Add suggested milestones below.'}</p>}
        {b.interviews.length < 5 && <p className="mt-2 text-sm text-amber-800">Customer evidence is thin ({b.interviews.length} interviews logged). Most later milestones depend on it.</p>}
      </Card>
      <Tabs tabs={[['milestones', `Milestones (${ms.length})`], ['interviews', `Customer interviews (${b.interviews.length})`]]} value={tab} onChange={v => setHashParam('tab', v)} />
      <div className="mt-4">
        {tab === 'milestones' && <Milestones b={b} />}
        {tab === 'interviews' && <Interviews b={b} />}
      </div>
    </div>
  );
}

function Milestones({ b }: { b: Bundle }) {
  const p = b.project!;
  const ms = b.tasks.filter(t => t.kind === 'milestone');
  const [cat, setCat] = useState('');
  const { busy, run } = useAsync();
  return (
    <div className="space-y-4">
      <div className="grid gap-2 md:grid-cols-4">
        {ROADMAP_CATEGORIES.map(c => {
          const list = ms.filter(m => m.roadmap_category === c.key);
          const done = list.filter(m => m.status === 'done').length;
          return (
            <button key={c.key} type="button" onClick={() => setCat(cat === c.key ? '' : c.key)} className={`rounded-lg border p-2 text-left text-sm ${cat === c.key ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
              <div className="font-medium">{c.label}</div><div className="text-xs text-slate-500">{list.length ? `${done}/${list.length} done` : 'none yet'}</div>
            </button>
          );
        })}
      </div>
      {cat && !ms.some(m => m.roadmap_category === cat) && (
        <Notice tone="blue">Suggested for this category: {SUGGESTED[cat]?.join(' · ')}{' '}
          <Button size="sm" busy={busy} onClick={() => run(() => insertRows('tasks', (SUGGESTED[cat] ?? []).map(title => ({ project_id: p.id, title, kind: 'milestone', area: 'commercialization', roadmap_category: cat, created_by: 'template' }))))}>Add these</Button>
        </Notice>
      )}
      <Card title={cat ? ROADMAP_CATEGORIES.find(c => c.key === cat)?.label : 'All milestones'}>
        <TaskList key={cat} projectId={p.id} tasks={cat ? b.tasks.filter(t => t.roadmap_category === cat || t.kind !== 'milestone') : b.tasks} milestones defaultCategory={cat || undefined} />
      </Card>
    </div>
  );
}

function Interviews({ b }: { b: Bundle }) {
  const [open, setOpen] = useState(false);
  const iv = b.interviews;
  const yes = iv.filter(i => i.problem_confirmed === 'yes').length;
  const pilots = iv.filter(i => i.pilot_interest).length;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Card><div className="text-xs text-slate-500">Interviews</div><div className="text-2xl font-semibold">{iv.length}</div></Card>
        <Card><div className="text-xs text-slate-500">Confirmed the problem</div><div className="text-2xl font-semibold">{yes}{iv.length ? <span className="text-sm font-normal text-slate-500"> ({Math.round((yes / iv.length) * 100)}%)</span> : null}</div></Card>
        <Card><div className="text-xs text-slate-500">Interested in a pilot</div><div className="text-2xl font-semibold">{pilots}</div></Card>
      </div>
      <Button variant="primary" onClick={() => setOpen(true)}>Log an interview</Button>
      {!iv.length ? <Empty title="No interviews logged">Talk to potential customers before you invest heavily. Ask about the problem and what they do today — not whether they like your idea.</Empty> : (
        <div className="space-y-2">{iv.map(i => (
          <Card key={i.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium">{i.interviewee} <span className="font-normal text-slate-500">{i.role}{i.organization && `, ${i.organization}`}</span></div>
                <div className="mt-1 flex flex-wrap gap-1 text-xs">{i.segment && <Badge>{i.segment}</Badge>}<Badge tone={i.problem_confirmed === 'yes' ? 'green' : i.problem_confirmed === 'no' ? 'red' : 'slate'}>problem: {i.problem_confirmed}</Badge>{i.pilot_interest && <Badge tone="blue">pilot interest</Badge>}<span className="text-slate-500">{fmtDate(i.interview_date)}</span></div>
                {i.current_solution && <p className="mt-1 text-sm"><b>Today they use:</b> {i.current_solution}</p>}
                {i.willingness_to_pay && <p className="text-sm"><b>Willingness to pay:</b> {i.willingness_to_pay}</p>}
                {i.key_quotes && <p className="mt-1 text-sm italic text-slate-700">“{i.key_quotes}”</p>}
                {i.notes && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{i.notes}</p>}
                {i.next_step && <p className="text-sm"><b>Next step:</b> {i.next_step}</p>}
              </div>
              <Button size="sm" variant="ghost" aria-label={`Delete interview ${i.interviewee}`} onClick={() => deleteRow('interviews', i.id)}><Trash2 className="size-3.5" /></Button>
            </div>
          </Card>
        ))}</div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Log a customer interview" wide><InterviewForm projectId={b.project!.id} onDone={() => setOpen(false)} /></Modal>
    </div>
  );
}

function InterviewForm({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const [v, setV] = useState<Partial<Interview>>({ problem_confirmed: 'unclear', interview_date: new Date().toISOString().slice(0, 10), pilot_interest: false });
  const { busy, run } = useAsync();
  const set = (k: keyof Interview, val: unknown) => setV({ ...v, [k]: val });
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Interviewee"><Input aria-label="Interviewee" value={v.interviewee ?? ''} onChange={e => set('interviewee', e.target.value)} /></Field>
      <Field label="Organization"><Input aria-label="Organization" value={v.organization ?? ''} onChange={e => set('organization', e.target.value)} /></Field>
      <Field label="Role"><Input aria-label="Role" value={v.role ?? ''} onChange={e => set('role', e.target.value)} /></Field>
      <Field label="Customer segment"><Input aria-label="Segment" value={v.segment ?? ''} onChange={e => set('segment', e.target.value)} /></Field>
      <Field label="Date"><Input aria-label="Interview date" type="date" value={v.interview_date ?? ''} onChange={e => set('interview_date', e.target.value)} /></Field>
      <Field label="Did they confirm the problem?"><Select aria-label="Problem confirmed" value={v.problem_confirmed} onChange={e => set('problem_confirmed', e.target.value)} options={{ yes: 'Yes', partly: 'Partly', no: 'No', unclear: 'Unclear' }} /></Field>
      <Field label="What do they use today?" className="md:col-span-2"><Input aria-label="Current solution" value={v.current_solution ?? ''} onChange={e => set('current_solution', e.target.value)} /></Field>
      <Field label="Willingness to pay (their words)" className="md:col-span-2"><Input aria-label="Willingness to pay" value={v.willingness_to_pay ?? ''} onChange={e => set('willingness_to_pay', e.target.value)} /></Field>
      <Field label="Key quotes" className="md:col-span-2"><Textarea aria-label="Key quotes" rows={2} value={v.key_quotes ?? ''} onChange={e => set('key_quotes', e.target.value)} /></Field>
      <Field label="Notes" className="md:col-span-2"><Textarea aria-label="Interview notes" rows={4} value={v.notes ?? ''} onChange={e => set('notes', e.target.value)} /></Field>
      <Field label="Next step"><Input aria-label="Next step" value={v.next_step ?? ''} onChange={e => set('next_step', e.target.value)} /></Field>
      <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={!!v.pilot_interest} onChange={e => set('pilot_interest', e.target.checked)} />Interested in a pilot</label>
      <div className="md:col-span-2"><Button variant="primary" busy={busy} disabled={!v.interviewee?.trim()} onClick={() => run(async () => { await insertRow('interviews', { ...v, project_id: projectId, interview_date: v.interview_date || null }); onDone(); })}>Save interview</Button></div>
    </div>
  );
}
