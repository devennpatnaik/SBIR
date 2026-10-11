import { useState } from 'react';
import { CalendarClock, CheckCircle2, LifeBuoy, Mail } from 'lucide-react';
import { addProgramTask, saveTrackingNotes, trackProgram, untrackProgram, useHelp } from '../lib/help';
import { useQuery } from '../lib/data';
import {
  AGENCIES, AREA_LABEL, CHECKED_ON, KIND_LABEL, STAGE_LABEL, TRACK_STATUS, programDaysLeft,
  type Agency, type Area, type HelpProfile, type Ranked, type Stage,
} from '../lib/programs';
import { saveSettings } from '../lib/settings';
import { fmtDate } from '../lib/data';
import type { ProgramTracking, Project } from '../lib/types';
import { Badge, Button, Card, ErrorNote, Modal, Select, SourceLink, Textarea, useAsync } from './ui';

const CONFIRM_REAL_WORLD = new Set(['applied_confirmed', 'accepted_confirmed']);

export function TimingBadge({ ranked }: { ranked: Ranked }) {
  const t = ranked.program.timing;
  if (t.type === 'deadline') {
    const d = programDaysLeft(ranked.program);
    if (d === null) return null;
    if (d < 0) return <Badge tone="slate">Deadline passed {fmtDate(t.date)}</Badge>;
    return <Badge tone={d <= 7 ? 'red' : 'amber'} title={t.label}><CalendarClock className="mr-1 inline size-3" />{d === 0 ? 'Due today' : `${d}d left`} · {fmtDate(t.date)}</Badge>;
  }
  if (t.type === 'closed') return <Badge tone="slate">No open cycle</Badge>;
  if (t.type === 'rolling') return <Badge tone="green">Anytime</Badge>;
  if (t.type === 'with_proposal') return <Badge tone="blue">In your proposal</Badge>;
  return <Badge tone="slate">Periodic</Badge>;
}

/** One program: what it is, whether it fits, and the user's tracking for the project. */
export function ProgramCard({ ranked, projectId, row, defaultOpen }: { ranked: Ranked; projectId: string | null; row?: ProgramTracking; defaultOpen?: boolean }) {
  const { program: p, fit } = ranked;
  const [open, setOpen] = useState(!!defaultOpen);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [notes, setNotes] = useState(row?.notes ?? '');
  const { busy, error, run } = useAsync();
  const setStatus = (status: string) => {
    if (status === '') return run(() => (row ? untrackProgram(row) : Promise.resolve()));
    if (CONFIRM_REAL_WORLD.has(status)) { setConfirm(status); return; }
    return run(() => trackProgram(projectId, p.id, status, row));
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4" data-program={p.id}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <button type="button" className="text-left font-semibold text-slate-900 hover:underline" onClick={() => setOpen(o => !o)} aria-expanded={open}>{p.name}</button>
          <div className="text-xs text-slate-500">{p.sponsor}</div>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Badge tone="purple">{KIND_LABEL[p.kind]}</Badge>
          {p.free ? <Badge tone="green">Free</Badge> : <Badge tone="slate" title={p.cost}>Cost varies</Badge>}
          <TimingBadge ranked={ranked} />
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-700">{p.summary}</p>
      {fit.reasons.length > 0 && (
        <p className={`mt-2 text-xs ${fit.level === 'now' ? 'text-emerald-800' : fit.level === 'later' ? 'text-slate-600' : 'text-slate-500'}`}>
          {fit.level === 'now' ? 'Why it fits: ' : fit.level === 'later' ? 'When it helps: ' : 'Why probably not: '}{fit.reasons.join(' ')}
        </p>
      )}
      {open && (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm">
          <div><span className="font-medium">What you get</span><ul className="ml-5 list-disc text-slate-700">{p.gives.map(g => <li key={g}>{g}</li>)}</ul></div>
          <div><span className="font-medium">Who is eligible: </span><span className="text-slate-700">{p.eligibility}</span></div>
          <div><span className="font-medium">Cost: </span><span className="text-slate-700">{p.cost}</span></div>
          <div><span className="font-medium">Timing: </span><span className="text-slate-700">{p.timing.label}</span>
            {p.timing.type === 'deadline' && <Badge tone="green" className="ml-1" title={`Checked against the official page on ${fmtDate(CHECKED_ON)}`}>verified {fmtDate(CHECKED_ON)}</Badge>}</div>
          {p.contact && <div className="flex items-center gap-1 text-slate-700"><Mail className="size-3.5" /><a className="text-blue-700 hover:underline" href={`mailto:${p.contact}`}>{p.contact}</a></div>}
          <div className="flex flex-wrap gap-3">{p.links?.map(l => <SourceLink key={l.url} url={l.url} label={l.label} />)}</div>
          <p className="text-xs text-slate-500">Summarized from the official page on {fmtDate(CHECKED_ON)}. Rules and dates change — confirm on the official page before you rely on them. General information, not legal advice.</p>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-md bg-blue-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-800">Official page ↗</a>
        <Select aria-label={`Track ${p.name}`} value={row?.status ?? ''} onChange={e => void setStatus(e.target.value)} disabled={busy}
          options={[['', row ? 'Stop tracking' : 'Track this…'], ...Object.entries(TRACK_STATUS)] as [string, string][]} className="w-52 py-1 text-xs" />
        {projectId && !row?.task_id && <Button size="sm" busy={busy} onClick={() => run(() => addProgramTask(projectId, p, row))}>Add to my tasks{p.timing.type === 'deadline' ? ' (with deadline)' : ''}</Button>}
        {row?.task_id && <span className="flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="size-3.5" />In your tasks</span>}
        {!open && <button type="button" className="text-xs text-slate-600 hover:underline" onClick={() => setOpen(true)}>Details</button>}
      </div>
      {row && open && (
        <div className="mt-2">
          <Textarea aria-label={`Notes for ${p.name}`} rows={2} placeholder="Notes (who you talked to, what they said, next step)…" value={notes} onChange={e => setNotes(e.target.value)} onBlur={() => notes !== row.notes && void run(() => saveTrackingNotes(row, notes))} />
        </div>
      )}
      <ErrorNote error={error} />
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Confirm a real-world step">
        <p className="text-sm text-slate-700">Mark <strong>{p.name}</strong> as <strong>{confirm ? TRACK_STATUS[confirm] : ''}</strong>? Only do this if it has actually happened — the app does not submit anything for you.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant="primary" busy={busy} onClick={() => { const s = confirm!; setConfirm(null); void run(() => trackProgram(projectId, p.id, s, row)); }}>Yes, it happened</Button>
        </div>
      </Modal>
    </div>
  );
}

function Chips<T extends string>({ label, options, value, onChange }: { label: string; options: [T, string][]; value: T[]; onChange: (v: T[]) => void }) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([k, l]) => {
          const on = value.includes(k);
          return <button key={k} type="button" aria-pressed={on} onClick={() => onChange(on ? value.filter(x => x !== k) : [...value, k])}
            className={`rounded-full border px-2.5 py-1 text-xs ${on ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>{l}</button>;
        })}
      </div>
    </fieldset>
  );
}

/** The few questions that decide which programs fit. Saved to the user's settings. */
export function HelpProfileForm({ profile, onSaved }: { profile: HelpProfile; onSaved?: () => void }) {
  const [v, setV] = useState<HelpProfile>(profile);
  const { busy, error, run } = useAsync();
  const set = (patch: Partial<HelpProfile>) => setV(x => ({ ...x, ...patch }));
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">Have you formed a company yet?
          <Select value={v.company ?? ''} onChange={e => set({ company: (e.target.value || undefined) as HelpProfile['company'] })} options={[['', 'Choose…'], ['formed', 'Yes, a U.S. small business'], ['not_yet', 'Not yet']]} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">Any SBIR/STTR award so far?
          <Select value={v.award ?? ''} onChange={e => set({ award: (e.target.value || undefined) as HelpProfile['award'] })} options={[['', 'Choose…'], ['none', 'No award yet'], ['phase1', 'Phase I'], ['phase2', 'Phase II']]} />
        </label>
      </div>
      {v.award && v.award !== 'none' && <Chips<Agency> label="Which agency made the award?" options={AGENCIES.map(a => [a, a])} value={v.awardAgencies ?? []} onChange={awardAgencies => set({ awardAgencies })} />}
      <Chips<Agency> label="Which agencies might fund you? (pick any — saved opportunities are added automatically)" options={AGENCIES.map(a => [a, a])} value={v.agencies ?? []} onChange={agencies => set({ agencies })} />
      <Chips<Area> label="What area is your technology in?" options={Object.entries(AREA_LABEL) as [Area, string][]} value={v.areas ?? []} onChange={areas => set({ areas })} />
      <ErrorNote error={error} />
      <Button variant="primary" busy={busy} onClick={() => run(async () => { await saveSettings({ help_profile: v }); onSaved?.(); })}>Save and update matches</Button>
    </div>
  );
}

/** A short "free help for this step" panel for other pages. */
export function HelpSuggestions({ projectId, stage, limit = 3, title }: { projectId: string | null | undefined; stage?: Stage; limit?: number; title?: string }) {
  // Without an explicit project, use the most recently updated one (same fallback as the other pages).
  const recent = useQuery<Project>('projects', q => q.select('id').eq('archived', false).order('updated_at', { ascending: false }).limit(1), [], !projectId);
  const h = useHelp(projectId || recent.data[0]?.id, stage);
  if (h.loading) return null;
  const st = stage ?? h.ctx.stage;
  const tracked = new Map(h.tracking.map(t => [t.program_id, t]));
  const fits = h.ranked.filter(r => r.fit.level === 'now' && r.program.stages.includes(st));
  const show = fits.slice(0, limit);
  if (!show.length) return null;
  return (
    <Card className="mb-4" title={<span className="flex items-center gap-1.5"><LifeBuoy className="size-4 text-emerald-700" />{title ?? `Free help for ${STAGE_LABEL[st].toLowerCase()}`}</span>}
      actions={<a href={`#/help?stage=${st}`} className="text-xs text-blue-700 hover:underline">See all {fits.length > limit ? `${fits.length} matches` : 'programs'} →</a>}>
      {!h.profileSet && <p className="mb-2 text-xs text-slate-500">Matches improve when you <a className="text-blue-700 hover:underline" href="#/help">answer 3 quick questions</a>.</p>}
      <ul className="space-y-2">
        {show.map(r => (
          <li key={r.program.id} className="flex flex-wrap items-start justify-between gap-2 text-sm">
            <div className="min-w-0 flex-1">
              <a href={`#/help?program=${r.program.id}`} className="font-medium text-slate-900 hover:underline">{r.program.name}</a>
              <div className="text-xs text-slate-600">{r.fit.reasons[0] ?? r.program.summary}</div>
            </div>
            <div className="flex items-center gap-1">
              {tracked.get(r.program.id) && <Badge tone="blue">{TRACK_STATUS[tracked.get(r.program.id)!.status]}</Badge>}
              <TimingBadge ranked={r} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
