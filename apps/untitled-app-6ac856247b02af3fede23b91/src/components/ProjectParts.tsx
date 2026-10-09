import { useState } from 'react';
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { AREAS, CONFIRM_STATUSES, PROJECT_STATUSES, ROADMAP_CATEGORIES, TASK_STATUS, statusIndex, statusLabel } from '../lib/constants';
import { daysUntil, deleteRow, fmtDate, insertRow, nowIso, updateRow, useQuery } from '../lib/data';
import { recordStatusChange } from '../lib/actions';
import { analyze } from '../lib/nextAction';
import { navigate, useActiveProjectId } from '../lib/router';
import type { Bundle } from '../lib/bundle';
import type { Project, Question, Task } from '../lib/types';
import { Badge, Button, Card, Empty, ErrorNote, Field, Input, Modal, Notice, Select, Textarea, useAsync } from './ui';
import { cn } from '../lib/utils';

export function StageBar({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const idx = statusIndex(project.status);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <div className="text-sm"><span className="text-slate-500">Stage {idx + 1} of 12:</span> <b>{statusLabel(project.status)}</b></div>
        <Button size="sm" onClick={() => setOpen(true)}>Change stage</Button>
      </div>
      <div className="flex gap-0.5" aria-label="Project stage progress">
        {PROJECT_STATUSES.map((s, i) => <div key={s.key} title={s.label} className={cn('h-2 flex-1 rounded-sm', i < idx ? 'bg-blue-300' : i === idx ? 'bg-blue-700' : 'bg-slate-200')} />)}
      </div>
      <StatusModal open={open} onClose={() => setOpen(false)} project={project} />
    </div>
  );
}

function StatusModal({ open, onClose, project }: { open: boolean; onClose: () => void; project: Project }) {
  const [to, setTo] = useState(project.status);
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const { busy, error, run, setError } = useAsync();
  const needsConfirm = CONFIRM_STATUSES.has(to);
  return (
    <Modal open={open} onClose={onClose} title="Change project stage">
      <div className="space-y-3">
        <p className="text-sm text-slate-600">Stages can overlap — pick the one that best describes where most of your effort is. Record why so you can look back later.</p>
        <Field label="New stage"><Select aria-label="New stage" value={to} onChange={e => { setTo(e.target.value); setConfirmed(false); }} options={PROJECT_STATUSES.map((s, i) => [s.key, `${i + 1}. ${s.label}`] as [string, string])} /></Field>
        <Field label="Reason (required)"><Textarea aria-label="Reason for stage change" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. TTO confirmed the patent is available for non-exclusive license" /></Field>
        {needsConfirm && (
          <label className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-sm text-amber-900">
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1" />
            I confirm this actually happened ({statusLabel(to).toLowerCase()}) — e.g. I have a submission confirmation or award notice.
          </label>
        )}
        <ErrorNote error={error} />
        <div className="flex gap-2">
          <Button variant="primary" busy={busy} onClick={() => {
            if (!reason.trim()) { setError('Add a short reason.'); return; }
            if (needsConfirm && !confirmed) { setError('Please confirm this event happened.'); return; }
            void run(async () => { await recordStatusChange(project, to, reason); setReason(''); onClose(); });
          }}>Save stage</Button>
          <Button onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

export function NextActionPanel({ bundle, limit = 5 }: { bundle: Bundle; limit?: number }) {
  const { actions } = analyze(bundle);
  if (!bundle.project) return null;
  const [first, ...rest] = actions;
  return (
    <Card title="What to do next" className="border-blue-200">
      {!first ? <p className="text-sm text-slate-600">No open actions. Add tasks or move the project to its next stage.</p> : (
        <div className="space-y-3">
          <button type="button" onClick={() => navigate(first.link)} className="flex w-full items-start gap-3 rounded-md bg-blue-700 p-3 text-left text-white hover:bg-blue-800">
            <ArrowRight className="mt-0.5 size-5 shrink-0" />
            <div><div className="font-semibold">{first.title}</div><div className="text-sm text-blue-100">{first.why}</div></div>
          </button>
          <ul className="space-y-1">
            {rest.slice(0, limit - 1).map(a => (
              <li key={a.title}>
                <button type="button" onClick={() => navigate(a.link)} className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-slate-50">
                  <Circle className={cn('mt-1 size-2.5 shrink-0', a.urgency === 'now' ? 'fill-red-500 text-red-500' : a.urgency === 'soon' ? 'fill-amber-400 text-amber-400' : 'fill-slate-300 text-slate-300')} />
                  <span><span className="font-medium">{a.title}</span> <span className="text-slate-500">— {a.why}</span></span>
                </button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-400">Recommendations are recalculated from your project records each time they change.</p>
        </div>
      )}
    </Card>
  );
}

export function DeadlinesAndBlockers({ bundle }: { bundle: Bundle }) {
  const { deadlines, blockers } = analyze(bundle);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title={<span className="flex items-center gap-1.5"><CalendarClock className="size-4" />Approaching deadlines</span>}>
        {!deadlines.length ? <p className="text-sm text-slate-500">No deadlines in the next 30 days. Add due dates to tasks and close dates to funding opportunities.</p> : (
          <ul className="space-y-2">{deadlines.slice(0, 6).map(d => (
            <li key={d.label + d.date} className="flex items-start justify-between gap-2 text-sm">
              <a href={`#/${d.link}`} className="hover:underline">{d.label}</a>
              <span className="flex shrink-0 items-center gap-1">
                {!d.verified && <Badge tone="amber" title="Not confirmed against a current official source">unverified</Badge>}
                <Badge tone={d.days < 0 ? 'red' : d.days <= 7 ? 'amber' : 'slate'}>{d.days < 0 ? `${-d.days}d overdue` : d.days === 0 ? 'today' : `${d.days}d`} · {fmtDate(d.date)}</Badge>
              </span>
            </li>))}
          </ul>
        )}
      </Card>
      <Card title={<span className="flex items-center gap-1.5"><AlertTriangle className="size-4" />What is blocking progress</span>}>
        {!blockers.length ? <p className="text-sm text-slate-500">Nothing marked as blocked. Mark a task "Blocked" or a question "blocking" to surface it here.</p> : (
          <ul className="space-y-1.5">{blockers.slice(0, 6).map(b => <li key={b.label} className="text-sm"><a href={`#/${b.link}`} className="text-red-800 hover:underline">{b.label}</a></li>)}</ul>
        )}
      </Card>
    </div>
  );
}

export function TaskList({ projectId, tasks, area, milestones, proposalId, defaultCategory }: { projectId: string; tasks: Task[]; area?: string; milestones?: boolean; proposalId?: string; defaultCategory?: string }) {
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [taskArea, setTaskArea] = useState(area ?? 'general');
  const [cat, setCat] = useState(defaultCategory ?? 'customer_discovery');
  const [showDone, setShowDone] = useState(false);
  const { busy, error, run } = useAsync();
  const list = tasks.filter(t => (!area || t.area === area) && (milestones === undefined || (t.kind === 'milestone') === milestones) && (!proposalId || t.proposal_id === proposalId));
  const open = list.filter(t => t.status !== 'done' && t.status !== 'skipped');
  const done = list.filter(t => t.status === 'done' || t.status === 'skipped');
  const titleOf = (id: string | null) => tasks.find(t => t.id === id)?.title;

  const add = () => run(async () => {
    await insertRow('tasks', { project_id: projectId, title: title.trim(), due_date: due || null, area: milestones ? 'commercialization' : taskArea, kind: milestones ? 'milestone' : 'task', roadmap_category: milestones ? cat : '', proposal_id: proposalId ?? null });
    setTitle(''); setDue('');
  });

  return (
    <div className="space-y-3">
      <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); if (title.trim()) void add(); }}>
        <Input aria-label={milestones ? 'New milestone' : 'New task'} placeholder={milestones ? 'Add a milestone…' : 'Add a task…'} value={title} onChange={e => setTitle(e.target.value)} className="min-w-64 flex-1" />
        {milestones ? <Select aria-label="Roadmap category" value={cat} onChange={e => setCat(e.target.value)} options={ROADMAP_CATEGORIES.map(c => [c.key, c.label] as [string, string])} className="w-52" />
          : !area && <Select aria-label="Task area" value={taskArea} onChange={e => setTaskArea(e.target.value)} options={AREAS} className="w-44" />}
        <Input aria-label="Due date" type="date" value={due} onChange={e => setDue(e.target.value)} className="w-40" />
        <Button type="submit" busy={busy} disabled={!title.trim()}>Add</Button>
      </form>
      <ErrorNote error={error} />
      {!open.length && !done.length ? <Empty title={milestones ? 'No milestones yet' : 'No tasks here yet'}>{milestones ? 'Add milestones such as "First pilot customer signed" or "Prototype meets 90% detection accuracy".' : 'Add the next concrete step above.'}</Empty> : (
        <ul className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-white">
          {open.map(t => <TaskRow key={t.id} t={t} all={tasks} dependsTitle={titleOf(t.depends_on)} />)}
        </ul>
      )}
      {!!done.length && (
        <div>
          <button type="button" className="text-xs text-slate-500 underline" onClick={() => setShowDone(!showDone)}>{showDone ? 'Hide' : 'Show'} {done.length} completed</button>
          {showDone && <ul className="mt-2 divide-y divide-slate-100 rounded-md border border-slate-200 bg-white opacity-70">{done.map(t => <TaskRow key={t.id} t={t} all={tasks} dependsTitle={titleOf(t.depends_on)} />)}</ul>}
        </div>
      )}
    </div>
  );
}

function TaskRow({ t, all, dependsTitle }: { t: Task; all: Task[]; dependsTitle?: string }) {
  const [edit, setEdit] = useState(false);
  const d = daysUntil(t.due_date);
  const isDone = t.status === 'done';
  const depOpen = t.depends_on && all.find(x => x.id === t.depends_on)?.status !== 'done';
  return (
    <li className="px-3 py-2">
      <div className="flex items-start gap-2">
        <button type="button" aria-label={isDone ? `Reopen ${t.title}` : `Complete ${t.title}`} onClick={() => updateRow('tasks', t.id, { status: isDone ? 'todo' : 'done', completed_at: isDone ? null : nowIso() })} className="mt-0.5">
          {isDone ? <CheckCircle2 className="size-4 text-emerald-600" /> : <Circle className="size-4 text-slate-400 hover:text-blue-700" />}
        </button>
        <div className="min-w-0 flex-1">
          <button type="button" onClick={() => setEdit(!edit)} className={cn('text-left text-sm', isDone && 'line-through')}>{t.title}</button>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            {t.kind === 'milestone' && <Badge tone="purple">milestone</Badge>}
            <Badge>{AREAS[t.area] ?? t.area}</Badge>
            {t.status === 'blocked' && <Badge tone="red">blocked{t.blocker && `: ${t.blocker}`}</Badge>}
            {t.status === 'in_progress' && <Badge tone="blue">in progress</Badge>}
            {t.due_date && <Badge tone={!isDone && d !== null && d < 0 ? 'red' : !isDone && d !== null && d <= 7 ? 'amber' : 'slate'}>due {fmtDate(t.due_date)}</Badge>}
            {dependsTitle && <span className={depOpen ? 'text-amber-700' : ''}>after: {dependsTitle}</span>}
            {t.created_by === 'assistant' && <Badge tone="slate">from assistant</Badge>}
          </div>
          {t.description && !edit && <p className="mt-0.5 text-xs text-slate-500">{t.description}</p>}
        </div>
      </div>
      {edit && <TaskEditor t={t} all={all} onClose={() => setEdit(false)} />}
    </li>
  );
}

function TaskEditor({ t, all, onClose }: { t: Task; all: Task[]; onClose: () => void }) {
  const [v, setV] = useState({ title: t.title, description: t.description, status: t.status, due_date: t.due_date ?? '', blocker: t.blocker, depends_on: t.depends_on ?? '', evidence: t.evidence, roadmap_category: t.roadmap_category });
  const { busy, run } = useAsync();
  return (
    <div className="ml-6 mt-2 grid gap-2 rounded-md bg-slate-50 p-3 md:grid-cols-2">
      <Field label="Title" className="md:col-span-2"><Input aria-label="Task title" value={v.title} onChange={e => setV({ ...v, title: e.target.value })} /></Field>
      <Field label="Notes" className="md:col-span-2"><Textarea aria-label="Task notes" rows={2} value={v.description} onChange={e => setV({ ...v, description: e.target.value })} /></Field>
      <Field label="Status"><Select aria-label="Task status" value={v.status} onChange={e => setV({ ...v, status: e.target.value })} options={TASK_STATUS} /></Field>
      <Field label="Due date"><Input aria-label="Task due date" type="date" value={v.due_date} onChange={e => setV({ ...v, due_date: e.target.value })} /></Field>
      {v.status === 'blocked' && <Field label="What is blocking it?" className="md:col-span-2"><Input aria-label="Blocker" value={v.blocker} onChange={e => setV({ ...v, blocker: e.target.value })} /></Field>}
      <Field label="Depends on"><Select aria-label="Depends on" value={v.depends_on} onChange={e => setV({ ...v, depends_on: e.target.value })} options={[['', 'Nothing'], ...all.filter(x => x.id !== t.id).map(x => [x.id, x.title] as [string, string])]} /></Field>
      {t.kind === 'milestone' && <Field label="Roadmap category"><Select aria-label="Milestone category" value={v.roadmap_category} onChange={e => setV({ ...v, roadmap_category: e.target.value })} options={ROADMAP_CATEGORIES.map(c => [c.key, c.label] as [string, string])} /></Field>}
      <Field label="Evidence / outcome" className="md:col-span-2"><Textarea aria-label="Task evidence" rows={2} value={v.evidence} onChange={e => setV({ ...v, evidence: e.target.value })} placeholder="What proves this is done? Link or note." /></Field>
      <div className="flex gap-2 md:col-span-2">
        <Button size="sm" variant="primary" busy={busy} onClick={() => run(async () => { await updateRow('tasks', t.id, { ...v, due_date: v.due_date || null, depends_on: v.depends_on || null, completed_at: v.status === 'done' ? (t.completed_at ?? nowIso()) : null }); onClose(); })}>Save</Button>
        <Button size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" variant="danger" className="ml-auto" onClick={() => deleteRow('tasks', t.id)}><Trash2 className="size-3.5" />Delete</Button>
      </div>
    </div>
  );
}

const QKIND: Record<string, string> = { question: 'Open question', risk: 'Risk', eligibility: 'Eligibility question', assumption: 'Assumption' };
export function QuestionList({ projectId, questions, kind, opportunityId, area, title }: { projectId: string; questions: Question[]; kind?: string; opportunityId?: string; area?: string; title?: string }) {
  const [text, setText] = useState('');
  const [k, setK] = useState(kind ?? 'question');
  const { busy, run } = useAsync();
  const list = questions.filter(q => (!kind || q.kind === kind) && (!opportunityId || q.opportunity_id === opportunityId));
  return (
    <div className="space-y-3">
      {title && <h4 className="text-sm font-semibold">{title}</h4>}
      <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); if (text.trim()) void run(async () => { await insertRow('questions', { project_id: projectId, opportunity_id: opportunityId ?? null, kind: k, text: text.trim(), area: area ?? 'general' }); setText(''); }); }}>
        <Input aria-label={`New ${QKIND[k]?.toLowerCase() ?? 'question'}`} placeholder={`Add ${QKIND[k]?.toLowerCase() ?? 'question'}…`} value={text} onChange={e => setText(e.target.value)} className="min-w-64 flex-1" />
        {!kind && <Select aria-label="Question type" value={k} onChange={e => setK(e.target.value)} options={QKIND} className="w-48" />}
        <Button type="submit" busy={busy} disabled={!text.trim()}>Add</Button>
      </form>
      {!list.length ? <p className="text-sm text-slate-500">None recorded.</p> : (
        <ul className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-white">{list.map(q => <QuestionRow key={q.id} q={q} />)}</ul>
      )}
    </div>
  );
}

function QuestionRow({ q }: { q: Question }) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState(q.answer);
  const [url, setUrl] = useState(q.answer_source_url);
  return (
    <li className="px-3 py-2 text-sm">
      <div className="flex items-start justify-between gap-2">
        <button type="button" className="text-left" onClick={() => setOpen(!open)}>
          <span className={q.status !== 'open' ? 'text-slate-500 line-through' : ''}>{q.text}</span>
          <span className="ml-2 inline-flex gap-1">{q.kind !== 'question' && <Badge tone={q.kind === 'risk' ? 'red' : q.kind === 'eligibility' ? 'amber' : 'slate'}>{QKIND[q.kind]}</Badge>}{q.blocking && q.status === 'open' && <Badge tone="red">blocking</Badge>}{q.status === 'answered' && <Badge tone="green">answered</Badge>}</span>
        </button>
        <div className="flex shrink-0 gap-1">
          <Button size="sm" variant="ghost" onClick={() => updateRow('questions', q.id, { blocking: !q.blocking })}>{q.blocking ? 'Unblock' : 'Mark blocking'}</Button>
          <Button size="sm" variant="ghost" aria-label={`Delete ${q.text}`} onClick={() => deleteRow('questions', q.id)}><Trash2 className="size-3.5" /></Button>
        </div>
      </div>
      {q.answer && !open && <p className="mt-1 text-xs text-slate-600">→ {q.answer}</p>}
      {open && (
        <div className="mt-2 space-y-2 rounded bg-slate-50 p-2">
          <Textarea aria-label="Answer" rows={2} placeholder="What did you learn?" value={answer} onChange={e => setAnswer(e.target.value)} />
          <Input aria-label="Answer source URL" placeholder="Source (URL or 'email from TTO, date')" value={url} onChange={e => setUrl(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" variant="primary" onClick={async () => { await updateRow('questions', q.id, { answer, answer_source_url: url, status: answer.trim() ? 'answered' : 'open', answered_at: answer.trim() ? nowIso() : null, blocking: answer.trim() ? false : q.blocking }); setOpen(false); }}>Save answer</Button>
            {q.status === 'open' ? <Button size="sm" onClick={() => updateRow('questions', q.id, { status: 'closed' })}>Close without answer</Button> : <Button size="sm" onClick={() => updateRow('questions', q.id, { status: 'open' })}>Reopen</Button>}
          </div>
        </div>
      )}
    </li>
  );
}

/** Lets section pages (Licensing, Funding, etc.) work on the active project. */
export function ProjectPicker({ children }: { children: (projectId: string) => React.ReactNode }) {
  const projects = useQuery<Project>('projects', q => q.eq('archived', false).order('updated_at', { ascending: false }));
  const [active, setActive] = useActiveProjectId();
  if (projects.loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!projects.data.length) return <Empty title="No commercialization project yet" action={<Button variant="primary" onClick={() => navigate('compare')}>Compare and select a technology</Button>}>This section works on a project. Select a technology on the Compare page to create one.</Empty>;
  const current = projects.data.find(p => p.id === active) ?? projects.data[0]!;
  return (
    <div>
      {projects.data.length > 1 && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <span className="text-slate-500">Project:</span>
          <Select aria-label="Active project" value={current.id} onChange={e => setActive(e.target.value)} options={projects.data.map(p => [p.id, p.name] as [string, string])} className="w-80" />
        </div>
      )}
      {children(current.id)}
    </div>
  );
}

export { Notice };
