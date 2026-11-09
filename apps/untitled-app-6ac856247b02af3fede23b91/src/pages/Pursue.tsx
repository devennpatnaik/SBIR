import { useEffect, useMemo, useState } from 'react';
import { Bandage, ListChecks } from 'lucide-react';
import type { CohortInsights } from '@project/learning';
import { PursueList, type PursueItem } from '../components/PursueList';
import { backend, useQuery } from '../lib/data';
import { PROBLEM_SPACE, PROBLEM_SPACE_LABEL, QUEUE_LABEL, isDfuLead } from '../lib/dfu';
import { insightsForTech } from '../lib/learning';
import { navigate } from '../lib/router';
import {
  dfuPromiseScore,
  rankPursueItems,
  splitPursueSections,
  techPursueStatus,
} from '../lib/pursueRank';
import type { Evaluation, Project, Technology } from '../lib/types';
import { displayName, Button } from '../components/ui';
import type { ProductTrack } from '../lib/track';

/** Default home action: one ranked DFU pursue queue. Patents track kept but demoted. */
export function Pursue({ track }: { track: ProductTrack }) {
  return track === 'patents' ? <PatentsPursueDemoted /> : <DfuPursue />;
}

function DfuPursue() {
  const techs = useQuery<Technology>('technologies', q => q.eq('archived', false).order('updated_at', { ascending: false }));
  const allTechs = useQuery<Technology>('technologies', q => q.order('updated_at', { ascending: false }));
  const evals = useQuery<Evaluation>('evaluations', q => q);
  const projects = useQuery<Project>('projects', q => q.eq('archived', false));
  const [insightsByKey, setInsightsByKey] = useState<Record<string, CohortInsights | null>>({});
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');
  const [seedErr, setSeedErr] = useState('');

  const dfuAll = useMemo(
    () => allTechs.data.filter(isDfuLead),
    [allTechs.data],
  );
  const dfuActive = useMemo(
    () => techs.data.filter(isDfuLead),
    [techs.data],
  );

  useEffect(() => {
    let alive = true;
    const keys = [...new Set(dfuActive.map(t => `${t.agency}|${t.category}`))];
    void Promise.all(keys.map(async key => {
      const [agency, category] = key.split('|');
      const value = await insightsForTech(agency || '', category || PROBLEM_SPACE);
      return [key, value] as const;
    })).then(entries => {
      if (!alive) return;
      setInsightsByKey(Object.fromEntries(entries));
    });
    return () => { alive = false; };
  }, [dfuActive.map(t => `${t.id}:${t.agency}:${t.category}`).join(',')]);

  const seed = async () => {
    setSeeding(true);
    setSeedErr('');
    setSeedMsg('');
    try {
      const res = await backend<{ message: string; total: number }>('/dfu/seed', { method: 'POST', body: '{}' });
      setSeedMsg(`${res.message} (${res.total} in queue).`);
    } catch (e) {
      setSeedErr(e instanceof Error ? e.message : 'Could not load seed leads.');
    } finally {
      setSeeding(false);
    }
  };

  // Auto-seed once when signed-in workspace has no DFU leads yet.
  useEffect(() => {
    if (allTechs.loading || seeding || seedMsg) return;
    if (dfuAll.length === 0) void seed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTechs.loading, dfuAll.length]);

  const { unpicked, acted } = useMemo(() => {
    const techIdsWithProject = new Set(projects.data.map(p => p.technology_id).filter(Boolean));
    // Include archived DFU leads (skipped) from allTechs for the acted section.
    const pool = [
      ...dfuActive,
      ...dfuAll.filter(t => t.archived && t.match_path === 'skip'),
    ];
    const seen = new Set<string>();
    const unique = pool.filter(t => (seen.has(t.id) ? false : (seen.add(t.id), true)));

    const ranked = rankPursueItems(
      unique.map(t => {
        const key = `${t.agency}|${t.category}`;
        const score = dfuPromiseScore(t, evals.data.find(e => e.technology_id === t.id), insightsByKey[key]);
        return {
          item: t,
          status: techPursueStatus(t, techIdsWithProject.has(t.id)),
          score,
        };
      }),
    );
    const sections = splitPursueSections(ranked);
    const toItem = (t: Technology, score: number, status: string): PursueItem => ({
      id: `tech-${t.id}`,
      title: displayName(t.name),
      note: [
        displayName(t.lab_name) || t.source_name || 'Wound-care lead',
        t.agency || null,
        t.match_path ? `Path: ${t.match_path}` : null,
        `Promise ${Math.round(score)}`,
      ].filter(Boolean).join(' · '),
      badge: status === 'unpicked' ? (t.is_sample ? 'Seed' : 'Unpicked') : status === 'progress' ? 'Pursuing' : 'Skipped',
      scoreLabel: `${Math.round(score)}`,
      actionLabel: 'Open path cards',
      onPursue: () => navigate(`sbir/tech/${t.id}`),
    });
    return {
      unpicked: sections.unpicked.map(r => toItem(r.item, r.score, r.status)),
      acted: sections.acted.map(r => toItem(r.item, r.score, r.status)),
    };
  }, [dfuActive, dfuAll, evals.data, projects.data, insightsByKey]);

  return (
    <div className="pursue-page dfu-pursue">
      <div className="track-banner dfu" role="status">
        <Bandage size={16} />
        <span><strong>{PROBLEM_SPACE_LABEL}</strong> — discover → rank → path cards → act → log outcome</span>
      </div>
      <p className="eyebrow">SELECT → PURSUE</p>
      <h1 className="editorial">DFU / chronic wounds<br />pursue queue.</h1>
      <p className="pursue-lede">
        One ranked list of PubMed-shaped and NIH/VA/DoD leads. Open a lead, pick outreach / SBIR topic / skip, then log what happened.
        SBIR process wizard and patents track are demoted — they are not the default job.
      </p>
      {(seeding || seedMsg || seedErr) && (
        <p className={`seed-status ${seedErr ? 'err' : ''}`} role="status">
          {seeding ? 'Loading curated DFU seed leads…' : seedErr || seedMsg}
        </p>
      )}
      {techs.loading || allTechs.loading ? (
        <p role="status" className="text-sm text-slate-500">Loading the DFU queue…</p>
      ) : (
        <PursueList
          unpicked={unpicked}
          acted={acted}
          pursueLabel="Open path cards"
          rankLabel={QUEUE_LABEL}
          empty={
            <div>
              <ListChecks size={22} className="mb-2 text-slate-400" />
              <p>No DFU / chronic-wound leads yet. Load the curated PubMed + federal seed set.</p>
              <div className="track-actions" style={{ marginTop: 16 }}>
                <Button variant="primary" busy={seeding} onClick={() => void seed()}>Load DFU seed leads</Button>
              </div>
            </div>
          }
        />
      )}
      <p className="pursue-secondary-links">
        <button type="button" onClick={() => navigate('sbir/path')}>SBIR path (demoted)</button>
        {' · '}
        <button type="button" onClick={() => navigate('patents/home')}>Patents track (demoted)</button>
        {' · '}
        <button type="button" onClick={() => void seed()}>Re-sync seed</button>
      </p>
    </div>
  );
}

/** Patents remain available but clearly secondary. */
function PatentsPursueDemoted() {
  return (
    <div className="pursue-page">
      <div className="track-banner patents" role="status">
        <span><strong>Patents track (demoted)</strong> — v1 default is the DFU / chronic wounds match queue.</span>
        <button type="button" className="track-switch-btn" onClick={() => navigate('sbir/pursue')}>Back to DFU queue</button>
      </div>
      <p className="eyebrow">OUT OF MVP DEFAULT</p>
      <h1 className="editorial">Worldwide patents<br />are secondary.</h1>
      <p className="pursue-lede">
        The 80/20 MVP is innovation → commercialization matching for diabetic foot ulcers / chronic wounds.
        Use patents search only if you explicitly need it.
      </p>
      <div className="track-actions">
        <Button variant="primary" onClick={() => navigate('sbir/pursue')}>Open DFU pursue queue</Button>
        <Button onClick={() => navigate('patents/home')}>Continue to patent search</Button>
      </div>
    </div>
  );
}
