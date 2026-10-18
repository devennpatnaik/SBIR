import { useEffect, useState } from 'react';
import { applyLearningScore, type CohortInsights } from '@project/learning';
import { DIMENSIONS, TECH_LICENSING_STATUS, defaultWeights } from '../lib/constants';
import { useQuery } from '../lib/data';
import { insightsForTech } from '../lib/learning';
import { hashParam, navigate } from '../lib/router';
import { summarize } from '../lib/scoring';
import { saveSettings, useSettings } from '../lib/settings';
import type { Evaluation, Project, Technology } from '../lib/types';
import { ConfidenceBadge, ScoreEditor } from '../components/Scoring';
import { SelectTechButton } from '../components/SelectTech';
import { Button, Card, Disclosure, displayName, Empty, Input, Modal, PageHeader, SampleBadge, useAsync } from '../components/ui';
import { cn } from '../lib/utils';

export function Compare() {
  const techs = useQuery<Technology>('technologies', q => q.eq('archived', false).order('created_at', { ascending: false }));
  const evals = useQuery<Evaluation>('evaluations', q => q);
  const projects = useQuery<Project>('projects', q => q);
  const settings = useSettings();
  const [picked, setPicked] = useState<string[] | null>(null);
  const [scoring, setScoring] = useState<string | null>(hashParam('score'));
  const [weightsOpen, setWeightsOpen] = useState(false);
  const [insights, setInsights] = useState<Record<string, CohortInsights | null>>({});

  const defaults = techs.data.filter(t => t.shortlisted).map(t => t.id);
  const ids = picked ?? (defaults.length ? defaults : techs.data.slice(0, 4).map(t => t.id));
  const cols = techs.data.filter(t => ids.includes(t.id));
  const evalOf = (id: string) => evals.data.find(e => e.technology_id === id);
  const sums = Object.fromEntries(cols.map(t => [t.id, summarize(evalOf(t.id) && { ...evalOf(t.id)!, weights: settings.weights }, t)]));
  useEffect(() => {
    let alive = true;
    void (async () => {
      const next: Record<string, CohortInsights | null> = {};
      await Promise.all(cols.map(async t => {
        next[t.id] = await insightsForTech(t.agency || '', t.category || '');
      }));
      if (alive) setInsights(next);
    })();
    return () => { alive = false; };
  }, [cols.map(t => `${t.id}:${t.agency}:${t.category}`).join('|')]);
  const learned = Object.fromEntries(cols.map(t => [t.id, applyLearningScore(sums[t.id]?.overall ?? null, insights[t.id])]));
  const ranked = [...cols].sort((a, b) => (learned[b.id]?.score ?? -1) - (learned[a.id]?.score ?? -1));
  const scoringTech = techs.data.find(t => t.id === scoring);

  if (!techs.loading && !techs.data.length) {
    return <div><PageHeader title="Compare technologies" /><Empty title="Nothing to compare yet" action={<Button variant="primary" onClick={() => navigate('discover')}>Add technologies</Button>}>Add at least two technologies on the Discover page, score them here, then select the one to pursue.</Empty></div>;
  }

  return (
    <div>
      <PageHeader title="Which idea fits best?" subtitle="Compare the possibilities, not just the scores. Evidence and uncertainty matter as much as the ranking."
        actions={<Button onClick={() => setWeightsOpen(true)}>Adjust weights</Button>} />

      <div className="mb-3 flex flex-wrap gap-2" aria-label="Technologies to compare">
        {techs.data.map(t => (
          <label key={t.id} className={cn('flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-xs', ids.includes(t.id) ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-slate-300 bg-white')}>
            <input type="checkbox" checked={ids.includes(t.id)} onChange={() => setPicked(ids.includes(t.id) ? ids.filter(x => x !== t.id) : [...ids, t.id])} />
            {displayName(t.name).length > 40 ? displayName(t.name).slice(0,40)+'…' : displayName(t.name)}
          </label>
        ))}
      </div>

      {!!cols.length && <div className="compare-summaries">{ranked.map((t,i)=>{const L=learned[t.id];const delta=L?.delta??0;return <article key={t.id} className={`compare-summary ${i===0?'leading':''}`}><div className="eyebrow">{i===0?'HIGHEST EVIDENCE-ADJUSTED SCORE':`OPTION ${i+1}`}</div><h2 className="editorial">{displayName(t.name)}</h2><div className="comparison-score">{L?.score ?? sums[t.id]?.overall ?? '—'}<span>/ 100</span></div><p className="text-xs text-slate-500">{sums[t.id]?.scored}/10 dimensions · {sums[t.id]?.confidence} confidence{t.is_sample?' · Sample':''}{delta!==0?` · ${delta>0?'+':''}${delta} from similar outcomes`:insights[t.id]?.sampleSize?` · ${insights[t.id]!.sampleSize} similar cases`:''}</p><p className="mt-5 text-sm leading-relaxed text-slate-600">{L?.reasons[0] || sums[t.id]?.risks[0] || 'Review the evidence before deciding.'}</p><div className="mt-auto flex flex-wrap gap-2 pt-6"><Button size="sm" onClick={()=>setScoring(t.id)}>Review scores</Button><Button size="sm" onClick={()=>navigate(`tech/${t.id}`)}>Log outcomes</Button><SelectTechButton size="sm" tech={t} evaluation={evalOf(t.id)} project={projects.data.find(p=>p.technology_id===t.id)}/></div></article>;})}</div>}
      <Disclosure title="Compare all 10 dimensions and the evidence">
      {!cols.length ? <Empty title="Pick technologies to compare above" /> : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 align-top">
                <th className="w-64 px-3 py-3 text-left text-xs uppercase text-slate-500">Dimension (weight)</th>
                {ranked.map((t, i) => (
                  <th key={t.id} className="min-w-52 px-3 py-3 text-left">
                    <div className="text-xs font-normal text-slate-500">#{i + 1}</div>
                    <a href={`#/tech/${t.id}`} className="font-semibold text-slate-900 hover:underline">{t.name}</a>
                    {t.is_sample && <div><SampleBadge /></div>}
                    <div className="mt-1 text-xs font-normal text-slate-500">{t.lab_name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200 bg-blue-50/40">
                <td className="px-3 py-2 font-medium">Overall score</td>
                {ranked.map(t => { const s = sums[t.id]!; return (
                  <td key={t.id} className="px-3 py-2">
                    <div className="text-lg font-semibold">{s.overall == null ? '—' : `${s.overall}/100`}</div>
                    <div className="flex flex-wrap items-center gap-1 text-xs text-slate-500">{s.scored}/10 scored <ConfidenceBadge c={s.confidence} /></div>
                  </td>
                ); })}
              </tr>
              {DIMENSIONS.map(d => (
                <tr key={d.key} className="border-b border-slate-100 align-top">
                  <td className="px-3 py-2 text-xs"><div className="font-medium text-slate-800">{d.label}</div><div className="text-slate-500">weight {settings.weights[d.key]}</div></td>
                  {ranked.map(t => { const e = evalOf(t.id)?.scores[d.key]; return (
                    <td key={t.id} className="px-3 py-2 text-xs">
                      {e?.score ? <span className={cn('mr-1 inline-block rounded px-1.5 font-semibold', e.score >= 4 ? 'bg-emerald-100 text-emerald-800' : e.score <= 2 ? 'bg-red-100 text-red-800' : 'bg-slate-100')}>{e.score}</span> : <span className="text-slate-400">—</span>}
                      {e?.score ? <span className="text-slate-500">{e.confidence}{!e.evidence.trim() && ' · assumption'}</span> : null}
                      {e?.rationale && <p className="mt-1 line-clamp-3 text-slate-600" title={e.rationale}>{e.rationale}</p>}
                    </td>
                  ); })}
                </tr>
              ))}
              <tr className="border-b border-slate-100 align-top"><td className="px-3 py-2 text-xs font-medium">Licensing status</td>{ranked.map(t => <td key={t.id} className="px-3 py-2 text-xs">{TECH_LICENSING_STATUS[t.licensing_status]}</td>)}</tr>
              <tr className="border-b border-slate-100 align-top"><td className="px-3 py-2 text-xs font-medium">Top strengths</td>{ranked.map(t => <td key={t.id} className="px-3 py-2 text-xs text-emerald-800">{sums[t.id]!.strengths.join('; ') || '—'}</td>)}</tr>
              <tr className="border-b border-slate-100 align-top"><td className="px-3 py-2 text-xs font-medium">Biggest risks</td>{ranked.map(t => <td key={t.id} className="px-3 py-2 text-xs text-red-800">{sums[t.id]!.risks.join('; ') || '—'}</td>)}</tr>
              <tr className="border-b border-slate-100 align-top"><td className="px-3 py-2 text-xs font-medium">Key missing information</td>{ranked.map(t => { const s = sums[t.id]!; const ev = evalOf(t.id); return <td key={t.id} className="px-3 py-2 text-xs text-slate-600"><ul className="list-disc pl-4">{s.missing.filter(m => !m.startsWith('No score')).slice(0, 5).map(m => <li key={m}>{m}</li>)}{s.lowEvidence.length > 0 && <li>{s.lowEvidence.length} scores have no evidence (assumptions)</li>}{ev?.missing_info && <li>{ev.missing_info}</li>}</ul></td>; })}</tr>
              <tr className="align-top"><td className="px-3 py-3" />{ranked.map(t => (
                <td key={t.id} className="space-y-2 px-3 py-3">
                  <Button size="sm" onClick={() => setScoring(t.id)} aria-label={`Score ${t.name}`}>{sums[t.id]!.scored ? 'Edit scores' : 'Score it'}</Button>
                  <div><SelectTechButton size="sm" tech={t} evaluation={evalOf(t.id)} project={projects.data.find(p => p.technology_id === t.id)} /></div>
                </td>
              ))}</tr>
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-slate-500">Overall = weighted average of scored dimensions, rescaled to 0–100. When enough anonymized investigation outcomes exist for a similar agency/category, a small evidence adjustment (−12…+12) is applied. A high score is not a verified investment opportunity.</p>

      </Disclosure>
      <Modal open={!!scoringTech} onClose={() => setScoring(null)} title={`Score: ${scoringTech?.name ?? ''}`} wide>
        {scoringTech && <ScoreEditor tech={scoringTech} evaluation={evalOf(scoringTech.id)} weights={settings.weights} />}
      </Modal>
      <Modal open={weightsOpen} onClose={() => setWeightsOpen(false)} title="Scoring weights"><WeightsEditor weights={settings.weights} onDone={() => setWeightsOpen(false)} /></Modal>
    </div>
  );
}

function WeightsEditor({ weights, onDone }: { weights: Record<string, number>; onDone: () => void }) {
  const [w, setW] = useState(weights);
  const { busy, run } = useAsync();
  const total = Object.values(w).reduce((a, b) => a + (Number(b) || 0), 0);
  return (
    <Card>
      <div className="space-y-2">
        {DIMENSIONS.map(d => (
          <label key={d.key} className="flex items-center justify-between gap-3 text-sm">
            <span>{d.label}</span>
            <Input aria-label={`Weight for ${d.label}`} type="number" min={0} max={100} className="w-20" value={w[d.key] ?? 0} onChange={e => setW({ ...w, [d.key]: Number(e.target.value) })} />
          </label>
        ))}
        <p className="text-xs text-slate-500">Total {total}. Weights are relative; they don't need to add to 100.</p>
        <div className="flex gap-2 pt-2">
          <Button variant="primary" busy={busy} onClick={() => run(async () => { await saveSettings({ weights: w }); onDone(); })}>Save weights</Button>
          <Button onClick={() => setW(defaultWeights())}>Reset to defaults</Button>
        </div>
      </div>
    </Card>
  );
}
