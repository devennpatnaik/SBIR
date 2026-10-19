import { useState } from 'react';
import { ArrowLeft, Star } from 'lucide-react';
import { deleteRow, fmtDate, nowIso, updateRow, useQuery } from '../lib/data';
import { TECH_LICENSING_STATUS } from '../lib/constants';
import { navigate } from '../lib/router';
import { summarize } from '../lib/scoring';
import { useSettings } from '../lib/settings';
import type { Evaluation, Project, Technology } from '../lib/types';
import { TECH_FIELDS, TechForm } from '../components/TechForm';
import { ConfidenceBadge, ScoreEditor } from '../components/Scoring';
import { SelectTechButton } from '../components/SelectTech';
import { SourcesPanel } from '../components/Sources';
import { OutcomesForm } from '../components/Outcomes';
import { Badge, Button, Card, Disclosure, displayName, displaySummary, ErrorNote, Notice, PageHeader, SampleBadge, SourceLink, Tabs } from '../components/ui';

export function TechnologyDetail({ id, trackMode = 'sbir' }: { id: string; trackMode?: 'sbir' | 'patents' }) {
  const patentsTrack = trackMode === 'patents';
  const q = useQuery<Technology>('technologies', b => b.eq('id', id), [id]);
  const ev = useQuery<Evaluation>('evaluations', b => b.eq('technology_id', id), [id]);
  const pr = useQuery<Project>('projects', b => b.eq('technology_id', id), [id]);
  const settings = useSettings();
  const [tab, setTab] = useState<'overview' | 'edit' | 'score' | 'outcomes' | 'evidence' | 'source'>('overview');
  const t = q.data[0];
  if (q.loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!t) return <ErrorNote error={q.error ?? 'Technology not found.'} />;
  const s = summarize(ev.data[0], t);
  const tabs = patentsTrack
    ? ([['overview', 'Overview'], ['edit', 'Edit details'], ['outcomes', 'Notes'], ['evidence', 'Sources'], ['source', 'Original text']] as const)
    : ([['overview', 'Overview'], ['edit', 'Edit details'], ['score', 'Score'], ['outcomes', 'What happened'], ['evidence', 'Sources & evidence'], ['source', 'Original source text']] as const);

  return (
    <div>
      <button type="button" onClick={() => navigate(patentsTrack ? 'shortlist' : 'discover')} className="mb-2 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft className="size-4" />{patentsTrack ? 'Back to shortlist' : 'All technologies'}</button>
      <PageHeader title={t.name}
        subtitle={<span className="flex flex-wrap items-center gap-2">{t.is_sample && <SampleBadge />}{displayName(t.lab_name)}{t.source_url && <SourceLink url={t.source_url} label="Original listing" />}<span className="text-xs text-slate-500">Last reviewed {fmtDate(t.last_reviewed_at)}</span></span>}
        actions={<>
          <Button onClick={() => updateRow('technologies', t.id, { shortlisted: !t.shortlisted })}><Star className={t.shortlisted ? 'size-4 fill-amber-400 text-amber-500' : 'size-4'} />{t.shortlisted ? 'Shortlisted' : 'Shortlist'}</Button>
          <Button onClick={() => updateRow('technologies', t.id, { last_reviewed_at: nowIso() })}>Mark reviewed today</Button>
          {!patentsTrack && <SelectTechButton tech={t} evaluation={ev.data[0]} project={pr.data[0]} />}
        </>} />
      <Tabs tabs={[...tabs]} value={tab} onChange={setTab} />
      <div className="mt-4">
        {tab === 'overview' && (
          <div><section className="project-story"><p className="eyebrow">THE TECHNOLOGY, IN PLAIN ENGLISH</p><p className="editorial thesis-text">{displaySummary(t.description)||'Add a description from the official listing.'}</p></section><div className="grid gap-5 md:grid-cols-2"><Card title="Where it could help"><p className="text-sm leading-relaxed">{displayName(t.applications)||'Applications not recorded.'}</p></Card><Card title="Who might use it"><p className="text-sm leading-relaxed">{displayName(t.customers)||'Potential customers not recorded.'}</p></Card></div>
          <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4 md:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">LEARNING LOOP</p>
                <h3 className="text-lg font-semibold text-slate-900">What happened with this technology?</h3>
                <p className="mt-1 text-sm text-slate-600">Log lab response, license, diligence, SBIR, and customer interest in one place.</p>
              </div>
              <Button onClick={() => setTab('outcomes')}>Record outcomes</Button>
            </div>
          </section>
          <Disclosure title="Scoring, licensing & missing information">
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Card><div className="text-xs text-slate-500">Score</div><div className="text-2xl font-semibold">{s.overall == null ? '—' : `${s.overall}/100`}</div><div className="mt-1 flex items-center gap-2 text-xs text-slate-500">{s.scored}/10 dimensions <ConfidenceBadge c={s.confidence} /></div></Card>
        <Card><div className="text-xs text-slate-500">Licensing status</div><div className="mt-1 text-sm font-medium">{TECH_LICENSING_STATUS[t.licensing_status]}</div>{t.licensing_status_source && <div className="mt-1 text-xs text-slate-500">Source: {t.licensing_status_source}</div>}</Card>
        <Card><div className="text-xs text-slate-500">Missing information</div><ul className="mt-1 list-disc pl-4 text-xs text-slate-700">{s.missing.filter(m => !m.startsWith('No score')).slice(0, 4).map(m => <li key={m}>{m}</li>)}{!s.missing.filter(m => !m.startsWith('No score')).length && <li>None flagged</li>}</ul></Card>
      </div>
</Disclosure><Disclosure title="All technical and source details"><Card>
            <dl className="grid gap-x-6 gap-y-4 md:grid-cols-2">
              {TECH_FIELDS.filter(f => f.key !== 'name' && f.key !== 'source_url').map(f => (
                <div key={f.key} className={f.multiline ? 'md:col-span-2' : ''}>
                  <dt className="text-xs font-medium uppercase text-slate-500">{f.label}</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-sm text-slate-800">{String(t[f.key] ?? '') || <span className="text-slate-400">Not recorded</span>}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex gap-2 border-t border-slate-100 pt-4">
              <Button onClick={() => updateRow('technologies', t.id, { archived: !t.archived })}>{t.archived ? 'Restore' : 'Archive'}</Button>
              {!pr.data.length && <Button variant="danger" onClick={async () => { if (confirm(`Delete ${t.name}? This cannot be undone.`)) { await deleteRow('technologies', t.id); navigate('discover'); } }}>Delete</Button>}
            </div>
          </Card></Disclosure></div>
        )}
        {tab === 'edit' && <Card><TechForm key={t.updated_at} initial={t} submitLabel="Save changes" onSubmit={async d => {
          const { id: _i, user_id: _u, created_at: _c, ...rest } = d as Technology;
          void _i; void _u; void _c;
          await updateRow('technologies', t.id, { ...rest, updated_at: nowIso(), last_reviewed_at: nowIso() }); setTab('overview');
        }} /></Card>}
        {tab === 'score' && <Card><ScoreEditor tech={t} evaluation={ev.data[0]} weights={settings.weights} /></Card>}
        {tab === 'outcomes' && (
          <Card>
            <OutcomesForm technologyId={t.id} projectId={pr.data[0]?.id} isSample={t.is_sample} />
          </Card>
        )}
        {tab === 'evidence' && <Card><SourcesPanel scope={{ technology_id: t.id }} /></Card>}
        {tab === 'source' && (
          <Card>
            <Notice tone="slate">This is the text as read from the original page{t.source_fetched_at ? ` on ${fmtDate(t.source_fetched_at)}` : ''}. It is kept unchanged and separate from your summary and any AI-generated content.</Notice>
            {t.source_text ? <pre className="mt-3 max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded bg-slate-50 p-3 text-xs text-slate-700">{t.source_text}</pre> : <p className="mt-3 text-sm text-slate-500">No source text was captured. {t.source_url && <>Open the <SourceLink url={t.source_url} label="original listing" />.</>}</p>}
            <div className="mt-2"><Badge>{t.source_name || 'unknown source'}</Badge></div>
          </Card>
        )}
      </div>
    </div>
  );
}
