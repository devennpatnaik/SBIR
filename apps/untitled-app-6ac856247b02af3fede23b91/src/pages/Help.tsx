import { useMemo, useState } from 'react';
import { LifeBuoy } from 'lucide-react';
import { HelpProfileForm, ProgramCard } from '../components/Help';
import { useHelp } from '../lib/help';
import { ACTIVE_TRACK, AREA_LABEL, CHECKED_ON, KIND_LABEL, STAGE_LABEL, programDaysLeft, type Kind, type Ranked, type Stage } from '../lib/programs';
import { hashParam, useActiveProjectId } from '../lib/router';
import { fmtDate, useQuery } from '../lib/data';
import type { Project } from '../lib/types';
import { Card, Input, Notice, PageHeader, Select, Tabs } from '../components/ui';

type Show = 'fits' | 'all' | 'tracked';

export function Help() {
  const projects = useQuery<Project>('projects', q => q.eq('archived', false).order('updated_at', { ascending: false }));
  const [activeId, setActive] = useActiveProjectId();
  const project = projects.data.find(p => p.id === activeId) ?? projects.data[0];
  const h = useHelp(project?.id);
  const stageParam = hashParam('stage') as Stage | null;
  const focus = hashParam('program');
  const [stage, setStage] = useState<Stage | 'all'>(stageParam && stageParam in STAGE_LABEL ? stageParam : 'all');
  const [kind, setKind] = useState<Kind | 'all'>('all');
  const [show, setShow] = useState<Show>(focus ? 'all' : 'fits');
  const [q, setQ] = useState('');
  const [editProfile, setEditProfile] = useState(false);

  const tracked = useMemo(() => new Map(h.tracking.map(t => [t.program_id, t])), [h.tracking]);
  const filtered = h.ranked.filter(r =>
    (stage === 'all' || r.program.stages.includes(stage))
    && (kind === 'all' || r.program.kind === kind)
    && (!q.trim() || `${r.program.name} ${r.program.sponsor} ${r.program.summary}`.toLowerCase().includes(q.trim().toLowerCase()))
    && (show !== 'tracked' || tracked.has(r.program.id))
);
  const groups: [string, Ranked[]][] = show === 'fits'
    ? [['Good fit now', filtered.filter(r => r.fit.level === 'now')], ['Useful later in your journey', filtered.filter(r => r.fit.level === 'later')]]
    : [['', filtered]];
  const hiddenNo = show === 'fits' ? filtered.filter(r => r.fit.level === 'no').length : 0;
  const urgent = h.ranked.filter(r => r.fit.level !== 'no' && (programDaysLeft(r.program) ?? 99) >= 0 && (programDaysLeft(r.program) ?? 99) <= 30);
  const activeTracked = h.tracking.filter(t => ACTIVE_TRACK.has(t.status)).length;

  return (
    <div>
      <PageHeader title="Free help & programs"
        subtitle={<>Government-funded programs that do part of this work with you — finding a technology, licensing it, writing the proposal, and building the business. Most are free. Each entry was checked against its official page on {fmtDate(CHECKED_ON)}; always confirm on that page before relying on it.</>}
        actions={projects.data.length > 1 && <Select aria-label="Project" value={project?.id ?? ''} onChange={e => setActive(e.target.value)} options={projects.data.map(p => [p.id, p.name] as [string, string])} className="w-64" />} />

      {urgent.map(r => (
        <div key={r.program.id} className="mb-3"><Notice tone="amber"><strong>Deadline soon:</strong> {r.program.name} — {r.program.timing.label}. <a className="font-medium underline" href={r.program.url} target="_blank" rel="noreferrer">Official page ↗</a></Notice></div>
      ))}

      <Card className="mb-4" title={<span className="flex items-center gap-1.5"><LifeBuoy className="size-4 text-emerald-700" />What help fits you?</span>}
        actions={h.profileSet && !editProfile && <button type="button" className="text-xs text-blue-700 hover:underline" onClick={() => setEditProfile(true)}>Edit answers</button>}>
        {!h.profileSet || editProfile ? (
          <>
            <p className="mb-3 text-sm text-slate-600">Answer a few questions so the list shows what you can actually use. {project ? <>We also use your project <strong>{project.name}</strong>: its stage ({STAGE_LABEL[h.ctx.stage].toLowerCase()}){h.ctx.techAgency ? <>, the technology’s agency ({h.ctx.techAgency})</> : null} and agencies of opportunities you saved.</> : 'Select a technology to make matches more precise.'}</p>
            <HelpProfileForm key={JSON.stringify(h.profile)} profile={h.profile} onSaved={() => setEditProfile(false)} />
          </>
        ) : (
          <p className="text-sm text-slate-700">
            Matching for <strong>{project?.name ?? 'you (no project yet)'}</strong> · stage: {STAGE_LABEL[h.ctx.stage]}
            {h.ctx.techAgency && <> · technology from {h.ctx.techAgency}</>}
            {h.ctx.targetAgencies.size > 0 && <> · funding targets: {[...h.ctx.targetAgencies].join(', ')}</>}
            {!!h.profile.areas?.length && <> · area: {h.profile.areas.map(a => AREA_LABEL[a]).join(', ')}</>}
            {h.profile.award && <> · award: {h.profile.award === 'none' ? 'none yet' : h.profile.award === 'phase1' ? 'Phase I' : 'Phase II'}</>}
          </p>
        )}
      </Card>

      <div className="mb-3 flex flex-wrap items-end gap-2">
        <Tabs<Show> tabs={[['fits', 'Matches for me'], ['all', 'All programs'], ['tracked', `Tracking (${activeTracked})`]]} value={show} onChange={setShow} />
        <div className="ml-auto flex flex-wrap gap-2">
          <Select aria-label="Stage" value={stage} onChange={e => setStage(e.target.value as Stage | 'all')} options={[['all', 'Any stage'], ...Object.entries(STAGE_LABEL)] as [string, string][]} className="w-48" />
          <Select aria-label="Type of help" value={kind} onChange={e => setKind(e.target.value as Kind | 'all')} options={[['all', 'Any type of help'], ...Object.entries(KIND_LABEL)] as [string, string][]} className="w-52" />
          <Input aria-label="Search programs" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} className="w-44" />
        </div>
      </div>

      {groups.map(([label, list]) => (
        <section key={label || 'all'} className="mb-6">
          {label && <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{label} ({list.length})</h2>}
          {!list.length ? <p className="text-sm text-slate-500">{show === 'tracked' ? 'You are not tracking any programs yet. Use “Track this…” on a program.' : 'Nothing here with these filters.'}</p> : (
            <div className="grid gap-3 lg:grid-cols-2">
              {list.map(r => <ProgramCard key={`${r.program.id}-${project?.id ?? 'none'}`} ranked={r} projectId={project?.id ?? null} row={tracked.get(r.program.id)} defaultOpen={focus === r.program.id} />)}
            </div>
          )}
        </section>
      ))}
      {hiddenNo > 0 && <p className="text-sm text-slate-500">{hiddenNo} program{hiddenNo === 1 ? '' : 's'} hidden because they don’t match your answers. <button type="button" className="text-blue-700 hover:underline" onClick={() => setShow('all')}>Show all programs</button></p>}

      <p className="mt-6 text-xs text-slate-500">Missing a program — a state SBIR matching grant, a university accelerator, a lab’s own entrepreneur program? Ask the research assistant to look it up from official sources and add it as a task or note. This list is general information, not legal advice.</p>
    </div>
  );
}
