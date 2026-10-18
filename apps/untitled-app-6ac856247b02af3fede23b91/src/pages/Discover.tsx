import { DemoLauncher } from '../components/Demo';
import { useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Download, Link2, PenLine, Star, Upload, Waves, Layers, SlidersHorizontal, Search } from 'lucide-react';
import { backend, insertRow, insertRows, nowIso, updateRow, useQuery } from '../lib/data';
import { SOURCE_SITES, TECH_LICENSING_STATUS } from '../lib/constants';
import { parseCsv, toCsv, download } from '../lib/csv';
import { navigate } from '../lib/router';
import type { Evaluation, Technology } from '../lib/types';
import { summarize } from '../lib/scoring';
import { Badge, Button, Disclosure, displayName, displaySummary, Empty, ErrorNote, Field, Input, Modal, Notice, PageHeader, SampleBadge, Select, SourceLink, Tabs, Textarea, useAsync } from '../components/ui';
import { TECH_FIELDS, TechForm, type TechDraft } from '../components/TechForm';

type Extracted = {
  ok: boolean; sourceName: string; fetchedAt: string; httpStatus: number; limited?: boolean; warning?: string; title?: string; description?: string;
  headings?: string[]; text?: string; patents?: string[]; applications?: string[]; patentPending?: boolean; emails?: string[]; phones?: string[];
  labGuess?: string; agencyGuess?: string; trl?: string;
};

const DEFAULT_QUESTIONS = 'Is this technology still available to license, and in which fields of use?\nWhat is the current patent status (issued, pending, expired)?\nWhat is the current development stage / TRL and what data exists?\nWho is the right contact in the technology-transfer office?';

export function draftFromExtract(url: string, x: Extracted): TechDraft {
  const pats = [...(x.patents ?? []), ...(x.applications ?? [])];
  return {
    name: x.title || '',
    source_url: url,
    source_name: x.sourceName,
    description: x.description || (x.text ?? '').slice(0, 800),
    lab_name: x.labGuess || '',
    agency: x.agencyGuess || '',
    patent_numbers: pats.join(', '),
    ip_info: [x.patentPending ? 'Page mentions "patent pending".' : '', pats.length ? 'Numbers were detected automatically from the page text — verify each at the USPTO.' : ''].filter(Boolean).join(' '),
    maturity: x.trl ? `TRL ${x.trl} (as stated on the listing)` : '',
    open_questions: DEFAULT_QUESTIONS,
    source_text: x.text ?? '',
    source_fetched_at: x.fetchedAt,
    licensing_status: 'unknown',
  };
}

export function Discover() {
  const techs = useQuery<Technology>('technologies', q => q.order('created_at', { ascending: false }));
  const evals = useQuery<Evaluation>('evaluations', q => q);
  const [adding, setAdding] = useState<null | 'url' | 'manual' | 'csv'>(null);
  const [search, setSearch] = useState('');
  const [agency, setAgency] = useState('');
  const [category, setCategory] = useState('');
  const [lic, setLic] = useState('');
  const [view, setView] = useState<'active' | 'shortlist' | 'archived'>('active');

  const list = useMemo(() => techs.data.filter(t => {
    if (view === 'shortlist' && (!t.shortlisted || t.archived)) return false;
    if (view === 'active' && t.archived) return false;
    if (view === 'archived' && !t.archived) return false;
    if (agency && t.agency !== agency) return false;
    if (category && t.category !== category) return false;
    if (lic && t.licensing_status !== lic) return false;
    if (search) {
      const hay = `${t.name} ${t.description} ${t.lab_name} ${t.applications} ${t.category} ${t.customers}`.toLowerCase();
      if (!search.toLowerCase().split(/\s+/).every(w => hay.includes(w))) return false;
    }
    return true;
  }), [techs.data, search, agency, category, lic, view]);

  const agencies = [...new Set(techs.data.map(t => t.agency).filter(Boolean))].sort();
  const categories = [...new Set(techs.data.map(t => t.category).filter(Boolean))].sort();

  const exportCsv = () => {
    const keys = TECH_FIELDS.map(f => f.key).concat(['licensing_status', 'shortlisted', 'is_sample', 'last_reviewed_at'] as (keyof Technology)[]);
    download('technologies.csv', toCsv([keys as string[], ...techs.data.map(t => keys.map(k => t[k] as string))]));
  };

  return (
    <div>
      <PageHeader title="Explore technologies." subtitle={<>A good business starts with a problem worth solving. Collect the ideas that interest you, then compare their potential. <a className="underline" href="#/patents">Search patents worldwide</a> or follow <a className="underline" href="#/sbir-path">the SBIR path</a>.</>}
        actions={<Button variant="primary" onClick={() => setAdding('url')}><Link2 size={16}/>Add a technology</Button>} />
      <div className="collection-toolbar"><div className="search-box"><Search size={18}/><Input aria-label="Search technologies" placeholder="Find an idea in your collection…" value={search} onChange={e=>setSearch(e.target.value)}/></div><Tabs tabs={[['active', `All ${techs.data.filter(t=>!t.archived).length}`],['shortlist','Saved'],['archived','Archived']]} value={view} onChange={setView}/></div>
      <details className="collection-tools"><summary><SlidersHorizontal size={14}/>Filters & collection tools{(agency||category||lic)&&<Badge>Filtered</Badge>}</summary><div className="flex flex-wrap gap-3 pt-4"><Select aria-label="Filter by agency" value={agency} onChange={e=>setAgency(e.target.value)} options={[['','All agencies'],...agencies.map(a=>[a,a] as [string,string])]} className="w-52"/><Select aria-label="Filter by category" value={category} onChange={e=>setCategory(e.target.value)} options={[['','All categories'],...categories.map(a=>[a,a] as [string,string])]} className="w-52"/><Select aria-label="Filter by licensing status" value={lic} onChange={e=>setLic(e.target.value)} options={[['','Any licensing status'],...Object.entries(TECH_LICENSING_STATUS)]} className="w-56"/><Button onClick={()=>setAdding('manual')}><PenLine size={14}/>Enter manually</Button><Button onClick={()=>setAdding('csv')}><Upload size={14}/>Import CSV</Button><Button onClick={exportCsv} disabled={!techs.data.length}><Download size={14}/>Export CSV</Button></div></details>
      <ErrorNote error={techs.error}/>
      {techs.loading?<p role="status" className="py-12 text-sm text-slate-500">Opening your collection…</p>:!techs.data.length?<Empty title="Your collection starts here." action={<div className="flex flex-wrap gap-3"><Button variant="primary" onClick={()=>setAdding('url')}>Add from URL</Button><LoadSample/></div>}>Save a technology from a lab’s official page, or explore our sample company first.</Empty>:<div className="technology-grid">{list.map(t=>{const s=summarize(evals.data.find(e=>e.technology_id===t.id),t);return <article className="technology-card" key={t.id}>
        <div className={`technology-art ${t.category.includes('Water')?'water':'material'}`}><div className="tech-orbit"/>{t.category.includes('Water')?<Waves size={56} strokeWidth={1}/>:<Layers size={56} strokeWidth={1}/>}<span>{t.category||'Lab technology'}</span><button type="button" className="save-tech" aria-label={t.shortlisted?`Remove ${t.name} from shortlist`:`Shortlist ${t.name}`} onClick={()=>updateRow('technologies',t.id,{shortlisted:!t.shortlisted})}><Star size={17} fill={t.shortlisted?'currentColor':'none'}/></button></div>
        <div className="technology-body"><div className="flex items-center gap-2 text-xs text-slate-500">{t.is_sample&&<SampleBadge/>}<span>{displayName(t.lab_name)||'Laboratory not recorded'}</span></div><a className="technology-name" href={`#/tech/${t.id}`}>{displayName(t.name)}</a><p className="line-clamp-3">{displaySummary(t.description)||'Add a short description of the problem this technology could solve.'}</p><div className="technology-bottom"><span>{s.overall===null?'Not scored':`${s.overall}/100 · ${s.confidence} confidence`}</span><a aria-label={`View ${displayName(t.name)}`} href={`#/tech/${t.id}`}><ArrowUpRight size={20}/></a></div></div>
      </article>;})}{!list.length&&<Empty title="No matching ideas." action={<Button onClick={()=>{setSearch('');setAgency('');setCategory('');setLic('');}}>Clear filters</Button>}>Try a different word or a broader filter.</Empty>}</div>}
      <Disclosure title="Where can I find technologies?"><div className="source-guides">{SOURCE_SITES.map(site=><a key={site.name} href={site.url} target="_blank" rel="noreferrer"><strong>{site.name} ↗</strong><p>{site.note}</p></a>)}</div><p className="mt-5 text-xs text-slate-500">Browse official listings, then copy a technology URL into Add a technology. These sites are not automatically synced. If a page cannot be read, paste its text or enter details manually.</p></Disclosure>

      <Modal open={adding === 'url'} onClose={() => setAdding(null)} title="Add a technology from a URL" wide><AddFromUrl onDone={id => { setAdding(null); navigate(`tech/${id}`); }} /></Modal>
      <Modal open={adding === 'manual'} onClose={() => setAdding(null)} title="Enter a technology manually" wide>
        <TechForm initial={{ open_questions: DEFAULT_QUESTIONS, licensing_status: 'unknown' }} submitLabel="Save technology" onCancel={() => setAdding(null)}
          onSubmit={async d => { const row = await insertRow<Technology>('technologies', { ...d, source_name: d.source_name || 'Manual entry', last_reviewed_at: nowIso() }); setAdding(null); navigate(`tech/${row.id}`); }} />
      </Modal>
      <Modal open={adding === 'csv'} onClose={() => setAdding(null)} title="Import technologies from CSV" wide><ImportCsv onDone={() => setAdding(null)} /></Modal>
    </div>
  );
}

function AddFromUrl({ onDone }: { onDone: (id: string) => void }) {
  const [url, setUrl] = useState('');
  const [pasted, setPasted] = useState('');
  const [result, setResult] = useState<Extracted | null>(null);
  const [draft, setDraft] = useState<TechDraft | null>(null);
  const { busy, error, run } = useAsync();

  const fetchIt = (html?: string) => run(async () => {
    const x = await backend<Extracted>('/extract', { method: 'POST', body: JSON.stringify({ url: url.trim(), html }) });
    setResult(x);
    setDraft(x.ok ? { ...draftFromExtract(url.trim(), x), ...(html ? { source_text: x.text ?? html } : {}) } : { source_url: url.trim(), open_questions: DEFAULT_QUESTIONS, licensing_status: 'unknown', source_name: x.sourceName });
  });

  if (draft) {
    return (
      <div className="space-y-3">
        {result?.warning ? <Notice>{result.warning}</Notice> : <Notice tone="blue">Read {result?.text?.length ?? 0} characters from {result?.sourceName}. Everything below was extracted automatically or left blank — check each field against the page before saving. The raw page text is stored separately as source text.</Notice>}
        {!!result?.emails?.length && <p className="text-xs text-slate-600">Emails on the page: {result.emails.join(', ')} — add them as contacts on the project once you confirm who they are.</p>}
        {result?.limited !== false && (
          <details className="rounded-md border border-slate-200 p-3 text-sm" open={!!result?.limited}>
            <summary className="cursor-pointer font-medium">Paste page text to extract more</summary>
            <p className="my-2 text-xs text-slate-500">Open <SourceLink url={url} />, select all the technology text, copy, and paste it here.</p>
            <Textarea aria-label="Pasted page text" rows={6} value={pasted} onChange={e => setPasted(e.target.value)} />
            <Button className="mt-2" size="sm" busy={busy} disabled={!pasted.trim()} onClick={() => fetchIt(`<main>${pasted.replace(/</g, '&lt;').replace(/\n/g, '<br>')}</main>`)}>Extract from pasted text</Button>
          </details>
        )}
        <ErrorNote error={error} />
        <TechForm key={JSON.stringify(draft).length} initial={draft} submitLabel="Save technology" onCancel={() => { setDraft(null); setResult(null); }}
          onSubmit={async d => {
            const row = await insertRow<Technology>('technologies', { ...d, source_text: draft.source_text ?? '', source_fetched_at: draft.source_fetched_at ?? null, source_name: draft.source_name ?? '', last_reviewed_at: nowIso() });
            if (row.source_text) await insertRows('documents', [{ technology_id: row.id, kind: 'source_text', title: `Original listing text — ${row.name}`, body: row.source_text, source_url: row.source_url }]);
            onDone(row.id);
          }} />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <Field label="Technology page URL" hint="e.g. a TechLink, labpartnering.org, federallabs.org, or lab tech-transfer page">
        <Input aria-label="Technology page URL" placeholder="https://…" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && url && void fetchIt()} />
      </Field>
      <ErrorNote error={error} />
      <div className="flex gap-2">
        <Button variant="primary" busy={busy} disabled={!/^https?:\/\//.test(url.trim())} onClick={() => fetchIt()}>Read page</Button>
        <Button disabled={!/^https?:\/\//.test(url.trim())} onClick={() => setDraft({ source_url: url.trim(), open_questions: DEFAULT_QUESTIONS, licensing_status: 'unknown' })}>Skip — enter details manually</Button>
      </div>
      <p className="text-xs text-slate-500">The app fetches the page from its server, reads the title, description and visible text, and looks for patent numbers, lab names, and TRL. It never fills in facts the page does not contain.</p>
    </div>
  );
}

function ImportCsv({ onDone }: { onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [unmapped, setUnmapped] = useState<string[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const { busy, error, run, setError } = useAsync();

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const aliases: Record<string, string> = Object.fromEntries([
    ...TECH_FIELDS.flatMap(f => [[norm(f.key), f.key], [norm(f.label), f.key]]),
    ['title', 'name'], ['technology', 'name'], ['url', 'source_url'], ['link', 'source_url'], ['lab', 'lab_name'], ['laboratory', 'lab_name'],
    ['patents', 'patent_numbers'], ['trl', 'maturity'], ['questions', 'open_questions'], ['licensingstatus', 'licensing_status'],
  ].map(([a, b]) => [a, b]));

  const onFile = async (f: File) => {
    setError(null); setCount(null);
    const grid = parseCsv(await f.text());
    const [header, ...body] = grid;
    if (!header) { setError('The file is empty.'); return; }
    const map = header.map(h => aliases[norm(h)] ?? null);
    setUnmapped(header.filter((_, i) => !map[i]));
    if (!map.includes('name')) { setError('The CSV needs a "name" (or "title") column.'); return; }
    setRows(body.map(r => Object.fromEntries(map.map((k, i) => [k, (r[i] ?? '').trim()]).filter(([k]) => k))).filter(r => r.name));
  };
  const template = () => download('technology-template.csv', toCsv([TECH_FIELDS.map(f => f.key)]));

  return (
    <div className="space-y-3 text-sm">
      <p>Columns are matched by name (e.g. <code>name</code>, <code>source_url</code>, <code>lab_name</code>, <code>agency</code>, <code>description</code>…). <button type="button" className="text-blue-700 underline" onClick={template}>Download a template</button>.</p>
      <input ref={fileRef} type="file" accept=".csv,text/csv" aria-label="CSV file" onChange={e => e.target.files?.[0] && void onFile(e.target.files[0])} />
      <ErrorNote error={error} />
      {!!unmapped.length && <Notice tone="slate">Ignored columns: {unmapped.join(', ')}</Notice>}
      {!!rows.length && (
        <>
          <p>{rows.length} technologies ready to import:</p>
          <ul className="max-h-48 list-disc overflow-y-auto pl-5 text-xs">{rows.map((r, i) => <li key={i}>{r.name} {r.source_url && <span className="text-slate-500">— {r.source_url}</span>}</li>)}</ul>
          <Button variant="primary" busy={busy} onClick={() => run(async () => {
            const valid = new Set(Object.keys(TECH_LICENSING_STATUS));
            await insertRows('technologies', rows.map(r => ({ ...r, licensing_status: valid.has(r.licensing_status ?? '') ? r.licensing_status : 'unknown', source_name: 'CSV import', last_reviewed_at: nowIso() })));
            setCount(rows.length); setRows([]);
          })}>Import {rows.length}</Button>
        </>
      )}
      {count != null && <Notice tone="blue">Imported {count} technologies. <button type="button" className="underline" onClick={onDone}>Close</button></Notice>}
    </div>
  );
}

function LoadSample() { return <DemoLauncher />; }
