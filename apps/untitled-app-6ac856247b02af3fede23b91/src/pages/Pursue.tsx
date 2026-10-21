import { useEffect, useMemo, useState } from 'react';
import { Landmark, Globe2, ListChecks } from 'lucide-react';
import { pathwayByKey } from '@project/pathways';
import type { CohortInsights } from '@project/learning';
import { PursueList, type PursueItem } from '../components/PursueList';
import { enterTrack, navigate } from '../lib/router';
import { useQuery } from '../lib/data';
import { insightsForTech } from '../lib/learning';
import {
  patentPromiseScore,
  rankPursueItems,
  sbirPromiseScore,
  splitPursueSections,
  techPursueStatus,
} from '../lib/pursueRank';
import type { Evaluation, Project, Technology } from '../lib/types';
import { displayName, Button } from '../components/ui';
import type { ProductTrack } from '../lib/track';

/** List → pursue: track-specific, ranked, no chat. */
export function Pursue({ track }: { track: ProductTrack }) {
  return track === 'patents' ? <PatentsPursue /> : <SbirPursue />;
}

function SbirPursue() {
  const techs = useQuery<Technology>('technologies', q => q.eq('archived', false).order('updated_at', { ascending: false }));
  const evals = useQuery<Evaluation>('evaluations', q => q);
  const projects = useQuery<Project>('projects', q => q.eq('archived', false));
  const path = pathwayByKey('sbir_track');
  const [insightsByKey, setInsightsByKey] = useState<Record<string, CohortInsights | null>>({});

  useEffect(() => {
    let alive = true;
    const keys = [...new Set(techs.data.map(t => `${t.agency}|${t.category}`))];
    void Promise.all(keys.map(async key => {
      const [agency, category] = key.split('|');
      const value = await insightsForTech(agency || '', category || '');
      return [key, value] as const;
    })).then(entries => {
      if (!alive) return;
      setInsightsByKey(Object.fromEntries(entries));
    });
    return () => { alive = false; };
  }, [techs.data.map(t => `${t.id}:${t.agency}:${t.category}`).join(',')]);

  const { unpicked, acted, processUnpicked } = useMemo(() => {
    const techIdsWithProject = new Set(projects.data.map(p => p.technology_id).filter(Boolean));
    const rankedTechs = rankPursueItems(
      techs.data.map(t => {
        const key = `${t.agency}|${t.category}`;
        const score = sbirPromiseScore(t, evals.data.find(e => e.technology_id === t.id), insightsByKey[key]);
        return {
          item: t,
          status: techPursueStatus(t, techIdsWithProject.has(t.id)),
          score,
        };
      }),
    );
    const sections = splitPursueSections(rankedTechs);

    const toItem = (t: Technology, score: number, status: string): PursueItem => ({
      id: `tech-${t.id}`,
      title: displayName(t.name),
      note: [
        displayName(t.lab_name) || 'Lab technology',
        t.agency || null,
        `Promise ${Math.round(score)}`,
      ].filter(Boolean).join(' · '),
      badge: status === 'unpicked' ? (t.is_sample ? 'Sample' : 'Unpicked') : status === 'progress' ? 'In progress' : 'Done',
      scoreLabel: `${Math.round(score)}`,
      actionLabel: 'Open technology',
      onPursue: () => navigate(`sbir/tech/${t.id}`),
    });

    const processItems: PursueItem[] = [
      {
        id: 'path-overview',
        title: 'The SBIR path (seven steps)',
        note: 'Process overview: eligibility, solicitation, proposal prep.',
        badge: 'Process',
        actionLabel: 'Open path',
        onPursue: () => navigate('sbir/path'),
      },
      {
        id: 'start-sbir',
        title: 'Start an SBIR idea',
        note: 'Three questions → a saved plan with ordered next steps.',
        badge: 'Start',
        actionLabel: 'Start',
        onPursue: () => navigate('start/sbir'),
      },
      {
        id: 'gov-rd',
        title: 'Browse government R&D',
        note: 'Federal lab / agency-backed technologies in your collection.',
        badge: 'Gov R&D',
        actionLabel: 'Open collection',
        onPursue: () => navigate('sbir/discover'),
      },
      {
        id: 'funding',
        title: 'SBIR & funding opportunities',
        note: 'Saved topics and live grant search for agency funding.',
        badge: 'Funding',
        actionLabel: 'Open funding',
        onPursue: () => navigate('sbir/funding'),
      },
    ];

    // Path steps as process shortcuts (always unpicked shortcuts — user picks which to open)
    for (const step of (path?.steps ?? []).slice(0, 4)) {
      processItems.push({
        id: `step-${step.title}`,
        title: step.title,
        note: step.description.slice(0, 140),
        badge: 'Path step',
        actionLabel: 'Pursue step',
        onPursue: () => navigate('sbir/path'),
      });
    }

    return {
      unpicked: [
        ...sections.unpicked.map(r => toItem(r.item, r.score, r.status)),
        // Process shortcuts sit after unpicked techs so tech leads stay on top when present
        ...(sections.unpicked.length ? [] : processItems),
      ],
      processUnpicked: sections.unpicked.length ? processItems : [],
      acted: sections.acted.map(r => toItem(r.item, r.score, r.status)),
    };
  }, [techs.data, evals.data, projects.data, insightsByKey, path]);

  const unpickedItems = [...unpicked, ...processUnpicked];

  return (
    <div className="pursue-page">
      <div className="track-banner sbir" role="status">
        <Landmark size={16} />
        <span><strong>SBIR route</strong> — pick one item, then pursue the next process step</span>
        <button type="button" className="track-switch-btn" onClick={() => enterTrack('patents', 'pursue')}>Switch to patents</button>
      </div>
      <p className="eyebrow">SELECT → PURSUE</p>
      <h1 className="editorial">Choose what to<br />work on next.</h1>
      <p className="pursue-lede">
        No chat. Select a government R&amp;D lead or SBIR process step — ranked so the most promising unpicked ideas come first.
      </p>
      {techs.loading ? <p role="status" className="text-sm text-slate-500">Loading your options…</p> : (
        <PursueList
          unpicked={unpickedItems}
          acted={acted}
          pursueLabel="Pursue"
          rankLabel="Ranked: most promising unpicked"
          empty={
            <div>
              <p>Start with the SBIR path or add a government technology.</p>
              <div className="track-actions" style={{ marginTop: 16 }}>
                <Button variant="primary" onClick={() => navigate('sbir/path')}>Open SBIR path</Button>
                <Button onClick={() => navigate('sbir/discover')}>Browse Gov R&amp;D</Button>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}

function PatentsPursue() {
  const techs = useQuery<Technology>('technologies', q => q.eq('archived', false).order('updated_at', { ascending: false }));

  const { unpicked, acted, shortcuts } = useMemo(() => {
    const ranked = rankPursueItems(
      techs.data.map(t => ({
        item: t,
        // On patents track: shortlisted = in progress; others unpicked candidates
        status: techPursueStatus(t, false),
        score: patentPromiseScore(t),
      })),
    );
    const sections = splitPursueSections(ranked);
    const toItem = (t: Technology, score: number, status: string): PursueItem => ({
      id: `tech-${t.id}`,
      title: displayName(t.name),
      note: [
        t.patent_numbers || null,
        displayName(t.lab_name) || null,
        `Unused-fit ${Math.round(score)}`,
      ].filter(Boolean).join(' · ') || 'Saved patent lead — inspect the record.',
      badge: status === 'unpicked' ? 'Unpicked' : status === 'progress' ? 'Shortlisted' : 'Done',
      scoreLabel: `${Math.round(score)}`,
      actionLabel: 'Inspect',
      onPursue: () => navigate(`patents/tech/${t.id}`),
    });

    const shortcuts: PursueItem[] = [
      {
        id: 'search',
        title: 'Search patents worldwide',
        note: 'Find patents that look unused. Discovery only — not SBIR coaching.',
        badge: 'Search',
        actionLabel: 'Open search',
        onPursue: () => navigate('patents/home'),
      },
      {
        id: 'shortlist-view',
        title: 'Review your shortlist',
        note: `${sections.acted.filter(r => r.status === 'progress').length} shortlisted lead(s). Inspect records; keep light notes.`,
        badge: 'Shortlist',
        actionLabel: 'Open shortlist',
        onPursue: () => navigate('patents/shortlist'),
      },
    ];

    return {
      shortcuts,
      unpicked: sections.unpicked.map(r => toItem(r.item, r.score, r.status)),
      acted: sections.acted.map(r => toItem(r.item, r.score, r.status)),
    };
  }, [techs.data]);

  return (
    <div className="pursue-page">
      <div className="track-banner patents" role="status">
        <Globe2 size={16} />
        <span><strong>Worldwide patents</strong> — pick a lead to inspect or shortlist (no commercialization handholding)</span>
        <button type="button" className="track-switch-btn" onClick={() => enterTrack('sbir', 'pursue')}>Switch to SBIR</button>
      </div>
      <p className="eyebrow">SELECT → PURSUE</p>
      <h1 className="editorial">Choose a patent<br />lead to inspect.</h1>
      <p className="pursue-lede">
        Select a search shortcut or a saved lead. Unpicked candidates with the strongest “not commercialized yet” fit rise first.
      </p>
      {techs.loading ? <p role="status" className="text-sm text-slate-500">Loading your shortlist…</p> : (
        <PursueList
          unpicked={[...(unpicked.length ? unpicked : shortcuts), ...(unpicked.length ? shortcuts : [])]}
          acted={acted}
          pursueLabel="Pursue"
          rankLabel="Ranked: most promising unpicked"
          empty={
            <div>
              <ListChecks size={22} className="mb-2 text-slate-400" />
              <p>No saved leads yet. Search patents, then shortlist ones worth inspecting.</p>
              <div className="track-actions" style={{ marginTop: 16 }}>
                <Button variant="primary" onClick={() => navigate('patents/home')}>Search patents</Button>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}
