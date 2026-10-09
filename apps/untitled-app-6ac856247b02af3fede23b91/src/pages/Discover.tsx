import { useMemo, useRef, useState } from 'react';
import { Download, Link2, PenLine, Star, Upload } from 'lucide-react';
import { backend, insertRow, insertRows, nowIso, updateRow, useQuery, fmtDate } from '../lib/data';
import { SOURCE_SITES, TECH_LICENSING_STATUS } from '../lib/constants';
import { parseCsv, toCsv, download } from '../lib/csv';
import { navigate } from '../lib/router';
import type { Evaluation, Technology } from '../lib/types';
import { summarize } from '../lib/scoring';
import { Badge, Button, Card, Empty, ErrorNote, Field, Input, Modal, Notice, PageHeader, SampleBadge, Select, SourceLink, Tabs, Textarea, useAsync } from '../components/ui';
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
      <PageHeader
        title="Discover technologies"
        subtitle="Collect candidate federal-lab technologies. The goal is not a big list — it is one technology with a credible path to a business."
        actions={<>
          <Button variant="primary" onClick={() => setAdding('url')}><Link2 className="size-4" />Add from URL</Button>
          <Button onClick={() => setAdding('manual')}><PenLine className="size-4" />Enter manually</Button>
          <Button onClick={() => setAdding('csv')}><Upload className="size-4" />Import CSV</Button>
          <Button onClick={exportCsv} disabled={!techs.data.length}><Download className="size-4" />Export CSV</Button>
        </>}
      />

      <Card className="mb-4" title="Where to find technologies">
        <div className="grid gap-3 md:grid-cols-3">
          {SOURCE_SITES.map(s => (
            <div key={s.name} className="text-sm">
              <a href={s.url} target="_blank" rel="noreferrer" className="font-medium text-blue-700 hover:underline">{s.name} ↗</a>
              <p className="text-slate-600">{s.note}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">These sites are not synced automatically. Browse them, copy a technology's page URL, and use <b>Add from URL</b>. TechLink and DOE LPS render pages in the browser, so the app may only read the page title; you can paste the page text to extract more.</p>
      </Card>

      <div className="mb-3 flex flex-wrap items-end gap-2">
        <Input aria-label="Search technologies" placeholder="Search name, description, lab, applications…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select aria-label="Filter by agency" value={agency} onChange={e => setAgency(e.target.value)} options={[['', 'All agencies'], ...agencies.map(a => [a, a] as [string, string])]} className="w-44" />
        <Select aria-label="Filter by category" value={category} onChange={e => setCategory(e.target.value)} options={[['', 'All categories'], ...categories.map(a => [a, a] as [string, string])]} className="w-44" />
        <Select aria-label="Filter by licensing status" value={lic} onChange={e => setLic(e.target.value)} options={[['', 'Any licensing status'], ...Object.entries(TECH_LICENSING_STATUS)]} className="w-56" />
        <div className="ml-auto"><Tabs tabs={[['active', `All (${techs.data.filter(t => !t.archived).length})`], ['shortlist', `Shortlist (${techs.data.filter(t => t.shortlisted && !t.archived).length})`], ['archived', 'Archived']]} value={view} onChange={setView} /></div>
      </div>
      <ErrorNote error={techs.error} />

      {!techs.loading && !techs.data.length ? (
        <Empty title="No technologies yet" action={<div className="flex gap-2"><Button variant="primary" onClick={() => setAdding('url')}>Add from URL</Button><LoadSample /></div>}>
          Start with a technology page URL from TechLink, DOE Lab Partnering Service, the FLC, or a lab's own site. You can also enter one manually or import a CSV. A clearly labeled sample is available if you want to try the workflow first.
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr><th className="w-8 px-3 py-2" /><th className="px-3 py-2">Technology</th><th className="px-3 py-2">Lab / agency</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Licensing</th><th className="px-3 py-2">Score</th><th className="px-3 py-2">Reviewed</th></tr>
            </thead>
            <tbody>
              {list.map(t => {
                const s = summarize(evals.data.find(e => e.technology_id === t.id), t);
                return (
                  <tr key={t.id} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50" onClick={() => navigate(`tech/${t.id}`)}>
                    <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      <button type="button" aria-label={t.shortlisted ? `Remove ${t.name} from shortlist` : `Shortlist ${t.name}`} onClick={() => updateRow('technologies', t.id, { shortlisted: !t.shortlisted })}>
                        <Star className={t.shortlisted ? 'size-4 fill-amber-400 text-amber-500' : 'size-4 text-slate-300 hover:text-amber-500'} />
                      </button>
                    </td>
                    <td className="max-w-md px-3 py-2">
                      <div className="flex items-center gap-2 font-medium text-slate-900">{t.name}{t.is_sample && <SampleBadge />}</div>
                      <div className="line-clamp-1 text-xs text-slate-500">{t.description}</div>
                    </td>
                    <td className="px-3 py-2 text-xs">{t.lab_name || '—'}<div className="text-slate-500">{t.agency}</div></td>
                    <td className="px-3 py-2 text-xs">{t.category || '—'}</td>
                    <td className="px-3 py-2"><Badge tone={t.licensing_status === 'available_verified' ? 'green' : t.licensing_status === 'licensed' || t.licensing_status === 'not_available' ? 'red' : 'slate'}>{TECH_LICENSING_STATUS[t.licensing_status]?.split(' (')[0]}</Badge></td>
                    <td className="px-3 py-2 text-xs">{s.overall == null ? <span className="text-slate-400">not scored</span> : <><b>{s.overall}</b>/100 <span className="text-slate-500">({s.scored}/10, {s.confidence} conf.)</span></>}</td>
                    <td className="px-3 py-2 text-xs text-slate-500">{fmtDate(t.last_reviewed_at)}</td>
                  </tr>
                );
              })}
              {!list.length && <tr><td colSpan={7} className="px-3 py-6 text-center text-sm text-slate-500">No technologies match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

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

function LoadSample() {
  const { busy, run } = useAsync();
  return (
    <Button busy={busy} onClick={() => run(async () => {
      const row = await insertRow<Technology>('technologies', {
        is_sample: true,
        name: '[SAMPLE] Low-power corrosion sensor for steel infrastructure',
        description: 'SAMPLE DATA — not a real technology. A fictional printed sensor that detects early corrosion under coatings on steel bridges and pipelines and reports wirelessly.',
        source_url: '', source_name: 'Sample data', lab_name: 'Sample National Laboratory (fictional)', agency: 'Sample agency',
        category: 'Sensors', maturity: 'TRL 4 (fictional)', applications: 'Bridge inspection\nPipeline integrity monitoring',
        customers: 'State DOT bridge inspection units\nPipeline operators', competitors: 'Manual ultrasonic thickness testing\nDrone visual inspection',
        ip_info: 'Fictional — no real patent.', licensing_status: 'unknown',
        open_questions: 'Is it available to license?\nWhat is the sensor lifetime in the field?', last_reviewed_at: nowIso(),
      });
      navigate(`tech/${row.id}`);
    })}>Try with a sample technology</Button>
  );
}
