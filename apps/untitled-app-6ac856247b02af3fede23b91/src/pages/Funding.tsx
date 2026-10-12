import { useMemo, useState } from 'react';
import { HelpSuggestions } from '../components/Help';
import { ArrowUpRight, Plus, Search } from 'lucide-react';
import { backend, daysUntil, fmtDate, insertRow, nowIso, updateRow, useQuery } from '../lib/data';
import { FUNDING_SITES } from '../lib/constants';
import { navigate, useActiveProjectId } from '../lib/router';
import type { Opportunity, Project, ProjectOpportunity } from '../lib/types';
import { OppForm, SbirSttrExplainer } from '../components/OppForm';
import { Button, Card, displayName, Empty, ErrorNote, Input, Modal, Notice, PageHeader, SampleBadge, Select, SourceLink, Tabs, useAsync } from '../components/ui';

type SbirTopic = { topic_title?: string; topic_number?: string; topic_description?: string; sbir_topic_link?: string; branch?: string };
type SbirSolicitation = {
  solicitation_title?: string; solicitation_number?: string; program?: string; phase?: string; agency?: string; branch?: string;
  open_date?: string; close_date?: string; solicitation_agency_url?: string; current_status?: string; solicitation_topics?: SbirTopic[];
};
type SbirResponse = { available: boolean; apiUrl: string; status?: number; message?: string; retrievedAt?: string; results?: SbirSolicitation[] };

export function Funding() {
  const opps = useQuery<Opportunity>('opportunities', q => q.order('close_date', { nullsFirst: false }));
  const links = useQuery<ProjectOpportunity>('project_opportunities', q => q);
  const projects = useQuery<Project>('projects', q => q.eq('archived', false).order('updated_at', { ascending: false }));
  const [activeId] = useActiveProjectId();
  const project = projects.data.find(p => p.id === activeId) ?? projects.data[0];
  const [tab, setTab] = useState<'saved' | 'compare' | 'search' | 'guide'>('saved');
  const [adding, setAdding] = useState(false);
  const [rel, setRel] = useState('all');

  const list = useMemo(() => opps.data.filter(o => rel === 'all' ? true : rel === 'active' ? o.relevance !== 'irrelevant' : o.relevance === rel), [opps.data, rel]);
  const linkOf = (oid: string) => links.data.find(l => l.opportunity_id === oid && l.project_id === project?.id);

  return (
    <div>
      <PageHeader title="Find the right funding." subtitle="A promising match is a starting point. Save opportunities, check the rules, and choose where to focus."
        actions={<Button variant="primary" onClick={() => setAdding(true)}><Plus className="size-4" />Add opportunity</Button>} />
      <HelpSuggestions projectId={project?.id} stage="propose" title="Free help writing your proposal" />
      <Tabs tabs={[['saved', `Saved (${opps.data.length})`], ['compare', 'Compare'], ['search', 'Search SBIR.gov'], ['guide', 'Research guide']]} value={tab} onChange={setTab} />
      <div className="mt-4">
        {tab === 'saved' && (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-4"><Select aria-label="Filter relevance" value={rel} onChange={e => setRel(e.target.value)} options={{ active: 'Hide irrelevant', relevant: 'Relevant', maybe: 'Maybe', unreviewed: 'Unreviewed', irrelevant: 'Irrelevant', all: 'All' }} className="w-44" />
              {project && <span className="text-sm text-slate-500">For <b>{displayName(project.name)}</b></span>}</div>
            {!opps.loading && !opps.data.length ? (
              <Empty title="No funding opportunities saved" action={<div className="flex gap-2"><Button variant="primary" onClick={() => setAdding(true)}>Add from an official page</Button><Button onClick={() => setTab('guide')}>How to find topics</Button></div>}>Find a topic on an official agency site (DoD DSIP, NIH, NSF, DOE, NASA…) and save it with its URL. The app never invents solicitations or deadlines.</Empty>
            ) : (
              <div className="funding-grid">{list.map(o=>{const l=linkOf(o.id);const d=daysUntil(o.close_date);return <article key={o.id} className="funding-card"><div className="flex items-center justify-between gap-3"><span className="eyebrow !mb-0">{o.program} · {o.phase}</span>{o.is_sample&&<SampleBadge/>}</div><a href={`#/funding/${o.id}`} className="editorial funding-name">{displayName(o.topic_title)}</a><p className="text-xs text-slate-500">{displayName(o.agency)}</p><div className="funding-facts"><div><span>Potential funding</span><strong>{o.award_amount||'Check the solicitation'}</strong></div><div><span>Closing date</span><strong>{o.close_date?fmtDate(o.close_date):'Not recorded'}</strong><small>{d!==null&&d<0?'Closed':o.deadline_verified?'Verified against source':'Needs verification'}</small></div></div><div className="flex items-center justify-between gap-3"><span className="text-xs text-slate-500">{l?l.status.replaceAll('_',' '):'Not linked to this project'}</span><a className="text-sm font-medium" href={`#/funding/${o.id}`}>Take a look <ArrowUpRight className="inline ml-1" size={16}/></a></div><details className="mt-5 border-t border-slate-100 pt-3"><summary className="cursor-pointer text-xs text-slate-500">Source & tracking</summary><div className="mt-3 flex flex-wrap items-center gap-2"><SourceLink url={o.source_url}/><Select aria-label={`Relevance of ${o.topic_title}`} value={o.relevance} onChange={e=>updateRow('opportunities',o.id,{relevance:e.target.value})} options={{unreviewed:'Unreviewed',relevant:'Relevant',maybe:'Maybe',irrelevant:'Irrelevant'}} className="w-36"/>{project&&!l&&<Button size="sm" onClick={()=>insertRow('project_opportunities',{project_id:project.id,opportunity_id:o.id})}>Link to project</Button>}</div></details></article>;})}{!list.length&&<Empty title="Nothing matches this filter."/>}</div>
            )}
          </>
        )}
        {tab === 'compare' && <><p className="mb-3 text-xs text-slate-500">All saved opportunities, including rejected options, so you can compare the reasons for your choice.</p><CompareOpps opps={opps.data} /></>}
        {tab === 'search' && <SbirSearch onSaved={id => navigate(`funding/${id}`)} />}
        {tab === 'guide' && <ManualGuide />}
      </div>
      <Modal open={adding} onClose={() => setAdding(false)} title="Add a funding opportunity" wide>
        <Notice tone="blue">Copy details from the official solicitation or topic page only. Leave fields blank if the source doesn't state them. Deadlines are saved as <b>unverified</b> until you confirm them against a current official page.</Notice>
        <div className="mt-3"><OppForm initial={{}} submitLabel="Save opportunity" onCancel={() => setAdding(false)} onSubmit={async o => {
          const row = await insertRow<Opportunity>('opportunities', { ...o, last_checked_at: nowIso() });
          if (project) await insertRow('project_opportunities', { project_id: project.id, opportunity_id: row.id });
          setAdding(false); navigate(`funding/${row.id}`);
        }} /></div>
      </Modal>
    </div>
  );
}

function CompareOpps({ opps }: { opps: Opportunity[] }) {
  if (!opps.length) return <Empty title="Nothing to compare" />;
  const rows: [string, (o: Opportunity) => React.ReactNode][] = [
    ['Agency', o => `${o.agency} ${o.branch}`], ['Program / phase', o => `${o.program} ${o.phase}`], ['Award size', o => o.award_amount || '—'], ['Duration', o => o.duration || '—'],
    ['Deadline', o => o.close_date ? `${fmtDate(o.close_date)} (${o.deadline_verified ? 'verified' : 'unverified'})` : '—'], ['Technical objective', o => o.technical_objective || '—'],
    ['Research-institution reqs', o => o.research_institution_reqs || (o.program === 'STTR' ? 'STTR: partner required — record solicitation wording' : '—')],
    ['Restrictions', o => o.restrictions || '—'], ['Submission system', o => o.submission_system || '—'], ['Fit notes', o => o.fit_notes || '—'], ['Relevance', o => o.relevance],
  ];
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full min-w-[720px] text-sm">
        <thead><tr className="bg-slate-50 align-top"><th className="w-44 px-3 py-2" />{opps.map(o => <th key={o.id} className="min-w-56 px-3 py-2 text-left"><a href={`#/funding/${o.id}`} className="hover:underline">{o.topic_number && `${o.topic_number}: `}{o.topic_title}</a></th>)}</tr></thead>
        <tbody>{rows.map(([label, f]) => <tr key={label} className="border-t border-slate-100 align-top"><td className="px-3 py-2 text-xs font-medium">{label}</td>{opps.map(o => <td key={o.id} className="whitespace-pre-wrap px-3 py-2 text-xs text-slate-700">{f(o)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function SbirSearch({ onSaved }: { onSaved: (id: string) => void }) {
  const [kw, setKw] = useState('');
  const [agency, setAgency] = useState('');
  const [res, setRes] = useState<SbirResponse | null>(null);
  const { busy, error, run } = useAsync();
  const save = (s: SbirSolicitation, t: SbirTopic) => run(async () => {
    const row = await insertRow<Opportunity>('opportunities', {
      agency: s.agency ?? '', branch: t.branch || s.branch || '', program: s.program === 'STTR' ? 'STTR' : s.program === 'SBIR' ? 'SBIR' : 'SBIR/STTR',
      solicitation_title: s.solicitation_title ?? '', solicitation_number: s.solicitation_number ?? '', topic_number: t.topic_number ?? '', topic_title: t.topic_title || s.solicitation_title || 'Untitled topic',
      source_url: t.sbir_topic_link || s.solicitation_agency_url || 'https://www.sbir.gov/topics', phase: s.phase ?? '', technical_objective: t.topic_description ?? '',
      open_date: s.open_date?.slice(0, 10) || null, close_date: s.close_date?.slice(0, 10) || null, deadline_verified: false,
      source_text: JSON.stringify({ solicitation: { ...s, solicitation_topics: undefined }, topic: t }, null, 2), last_checked_at: nowIso(),
      fit_notes: `Imported from the SBIR.gov API on ${new Date().toLocaleDateString()}. Confirm all details on the agency's solicitation page.`,
    });
    onSaved(row.id);
  });
  return (
    <div className="space-y-3">
      <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); void run(async () => setRes(await backend<SbirResponse>(`/sbir/solicitations?keyword=${encodeURIComponent(kw)}&agency=${encodeURIComponent(agency)}`))); }}>
        <Input aria-label="SBIR keyword" placeholder="Keyword, e.g. corrosion sensor" value={kw} onChange={e => setKw(e.target.value)} className="w-72" />
        <Select aria-label="SBIR agency" value={agency} onChange={e => setAgency(e.target.value)} options={{ '': 'All agencies', DOD: 'DoD', HHS: 'HHS (NIH etc.)', NSF: 'NSF', DOE: 'DOE', NASA: 'NASA', USDA: 'USDA', DHS: 'DHS', DOC: 'Commerce', ED: 'Education', EPA: 'EPA', DOT: 'Transportation' }} className="w-44" />
        <Button type="submit" variant="primary" busy={busy}><Search className="size-4" />Search open solicitations</Button>
      </form>
      <p className="text-xs text-slate-500">Queries the official SBIR.gov public API live through the app's server. Results are saved only when you press Save; deadlines are imported as unverified.</p>
      <ErrorNote error={error} />
      {res && !res.available && (
        <Notice>The SBIR.gov API is not available right now ({res.message}). SBIR.gov controls access to that API, so search may stay unavailable. Use the <b>How to research manually</b> tab: find the topic on the agency site, then press <b>Add opportunity</b>.</Notice>
      )}
      {res?.available && !res.results?.length && <Empty title="No open solicitations matched">Try a broader keyword, or check agency sites directly — SBIR.gov does not list every agency topic in real time.</Empty>}
      {res?.available && res.results?.map((s, i) => (
        <Card key={i} title={<span>{s.agency} {s.branch && `· ${s.branch}`} — {s.solicitation_title}</span>} actions={<SourceLink url={s.solicitation_agency_url ?? ''} />}>
          <div className="mb-2 text-xs text-slate-500">{s.solicitation_number} · {s.program} {s.phase} · opens {fmtDate(s.open_date)} · closes {fmtDate(s.close_date)} (from SBIR.gov, unverified) · {s.current_status}</div>
          <ul className="divide-y divide-slate-100">
            {(s.solicitation_topics ?? []).slice(0, 25).map((t, j) => (
              <li key={j} className="flex items-start justify-between gap-3 py-2 text-sm">
                <div><div className="font-medium">{t.topic_number} {t.topic_title}</div><p className="line-clamp-2 text-xs text-slate-600">{t.topic_description}</p></div>
                <Button size="sm" busy={busy} onClick={() => save(s, t)}>Save</Button>
              </li>
            ))}
            {!s.solicitation_topics?.length && <li className="py-2"><Button size="sm" onClick={() => save(s, {})}>Save solicitation</Button></li>}
          </ul>
        </Card>
      ))}
    </div>
  );
}

function ManualGuide() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Manual research process">
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          <li>Write down 5–10 keywords describing what your product does and who funds work like it (e.g. Navy, NIH NIBIB, DOE EERE).</li>
          <li>Search the official topic lists below. Agencies publish on their own schedules; some (NIH, NSF) also accept open-topic or omnibus submissions.</li>
          <li>For each promising topic, open the solicitation document (usually a PDF) and copy: topic number, objective, phase, award size, deadline, eligibility and required documents.</li>
          <li>Press <b>Add opportunity</b> and paste those details with the official URL.</li>
          <li>Open the opportunity and record eligibility questions, fit notes and verify the deadline.</li>
          <li>Mark it Relevant / Irrelevant and link the relevant ones to your project.</li>
        </ol>
      </Card>
      <Card title="Official sources">
        <ul className="space-y-1.5 text-sm">{FUNDING_SITES.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">{s.name} ↗</a></li>)}</ul>
      </Card>
      <Card title="SBIR vs STTR" className="lg:col-span-2"><SbirSttrExplainer /></Card>
    </div>
  );
}
