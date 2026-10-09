import { useState } from 'react';
import { Copy, Mail, Trash2 } from 'lucide-react';
import { useBundle, type Bundle } from '../lib/bundle';
import { AGREEMENT_STATUS, GLOSSARY, PATHWAYS, PROJECT_LICENSING_STATUS } from '../lib/constants';
import { deleteRow, fmtDate, insertRow, nowIso, updateRow } from '../lib/data';
import { draftFollowUp, draftInquiry } from '../lib/email';
import { ensureLab } from '../lib/actions';
import { hashParam, setHashParam } from '../lib/router';
import { saveSettings, useSettings } from '../lib/settings';
import type { Communication, LicensingItem } from '../lib/types';
import { ProjectPicker, TaskList } from '../components/ProjectParts';
import { Badge, Button, Card, Empty, ErrorNote, Field, InlineText, Input, Modal, Notice, PageHeader, Select, SourceLink, Tabs, Textarea, useAsync } from '../components/ui';

type Tab = 'office' | 'research' | 'pathway' | 'outreach' | 'terms';

export function Licensing() {
  return (
    <div>
      <PageHeader title="Licensing" subtitle="Find the lab's technology-transfer office, answer the key IP questions, choose an agreement pathway, and track every contact. The app never sends email or makes commitments for you." />
      <ProjectPicker>{id => <LicensingFor id={id} />}</ProjectPicker>
    </div>
  );
}

function LicensingFor({ id }: { id: string }) {
  const b = useBundle(id);
  const tab = (hashParam('tab') as Tab) || 'office';
  if (b.loading || !b.project) return <p className="text-sm text-slate-500">Loading…</p>;
  const answered = b.licensing.filter(l => l.status === 'answered').length;
  return (
    <div>
      <Notice tone="slate">General information, not legal advice. Licensing terms are set by each lab; consider an attorney before signing any agreement.</Notice>
      <div className="mt-4">
        <Tabs tabs={[['office', 'Tech-transfer office'], ['research', `IP & licensing questions (${answered}/${b.licensing.length})`], ['pathway', 'Pathway & agreements'], ['outreach', `Outreach & correspondence (${b.comms.length})`], ['terms', 'Plain-English terms']]} value={tab} onChange={v => setHashParam('tab', v)} />
      </div>
      <div className="mt-4">
        {tab === 'office' && <Office b={b} />}
        {tab === 'research' && <Research b={b} />}
        {tab === 'pathway' && <Pathway b={b} />}
        {tab === 'outreach' && <Outreach b={b} />}
        {tab === 'terms' && <Card><dl className="space-y-3">{GLOSSARY.map(g => <div key={g.term}><dt className="text-sm font-semibold">{g.term}</dt><dd className="text-sm text-slate-700">{g.plain}</dd></div>)}</dl></Card>}
      </div>
    </div>
  );
}

function Office({ b }: { b: Bundle }) {
  const p = b.project!, lab = b.lab;
  const { busy, error, run } = useAsync();
  const [c, setC] = useState({ name: '', role: '', email: '', phone: '', source_url: '' });
  const labSave = (field: string) => async (v: string) => { if (lab) await updateRow('labs', lab.id, { [field]: v, updated_at: nowIso() }); };
  const searchQ = encodeURIComponent(`${b.tech?.lab_name ?? ''} technology transfer office licensing contact`);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Laboratory & technology-transfer office">
        {!lab ? (
          <div className="space-y-2 text-sm">
            <p>No laboratory linked to this project.</p>
            <Button busy={busy} onClick={() => run(async () => { const l = await ensureLab(b.tech?.lab_name || 'Unknown laboratory', b.tech?.agency ?? ''); if (l) await updateRow('projects', p.id, { lab_id: l.id }); })}>Create lab record{b.tech?.lab_name ? ` for ${b.tech.lab_name}` : ''}</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <InlineText label="Laboratory" value={lab.name} onSave={labSave('name')} />
            <InlineText label="Agency" value={lab.agency} onSave={labSave('agency')} />
            <InlineText label="Office name" value={lab.tto_name} onSave={labSave('tto_name')} placeholder="e.g. Technology Transfer Office / ORTA / Partnerships Directorate" />
            <InlineText label="Office web page" value={lab.tto_url} onSave={labSave('tto_url')} placeholder="https://…" />
            <InlineText label="General licensing email" value={lab.tto_email} onSave={labSave('tto_email')} />
            <InlineText label="Phone" value={lab.tto_phone} onSave={labSave('tto_phone')} />
            <InlineText label="Agreement types the lab says it offers" multiline value={lab.agreement_types_offered} onSave={labSave('agreement_types_offered')} placeholder="Only what the lab's own site or staff state" />
            <InlineText label="Where this contact information came from" value={lab.source_url} onSave={labSave('source_url')} placeholder="URL of the lab page you took it from" />
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {lab.verified_at ? <>Verified {fmtDate(lab.verified_at)}</> : 'Not yet verified'}
              <Button size="sm" disabled={!lab.source_url} title={!lab.source_url ? 'Record the source URL first' : ''} onClick={() => updateRow('labs', lab.id, { verified_at: nowIso() })}>I checked this today</Button>
            </div>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">Find contact details on the lab's own website. <a className="text-blue-700 underline" target="_blank" rel="noreferrer" href={`https://www.google.com/search?q=${searchQ}`}>Search the web</a> · <a className="text-blue-700 underline" target="_blank" rel="noreferrer" href="https://federallabs.org/labs">FLC lab directory</a></p>
        <ErrorNote error={error} />
      </Card>
      <Card title="People">
        <div className="space-y-2">
          {b.contacts.map(x => (
            <div key={x.id} className="flex items-start justify-between rounded border border-slate-200 p-2 text-sm">
              <div><div className="font-medium">{x.name} <span className="font-normal text-slate-500">{x.role}</span></div><div className="text-xs text-slate-600">{[x.email, x.phone, x.organization].filter(Boolean).join(' · ')}</div>{x.source_url && <SourceLink url={x.source_url} />}</div>
              <Button size="sm" variant="ghost" aria-label={`Remove ${x.name}`} onClick={() => deleteRow('contacts', x.id)}><Trash2 className="size-3.5" /></Button>
            </div>
          ))}
          {!b.contacts.length && <p className="text-sm text-slate-500">No contacts yet. Add licensing managers or inventors whose details are publicly listed.</p>}
        </div>
        <form className="mt-3 grid gap-2 md:grid-cols-2" onSubmit={e => { e.preventDefault(); void run(async () => { await insertRow('contacts', { ...c, project_id: p.id, lab_id: lab?.id ?? null, organization: lab?.name ?? '' }); setC({ name: '', role: '', email: '', phone: '', source_url: '' }); }); }}>
          <Input aria-label="Contact name" placeholder="Name" value={c.name} onChange={e => setC({ ...c, name: e.target.value })} />
          <Input aria-label="Contact role" placeholder="Role (e.g. Licensing Manager)" value={c.role} onChange={e => setC({ ...c, role: e.target.value })} />
          <Input aria-label="Contact email" placeholder="Email" value={c.email} onChange={e => setC({ ...c, email: e.target.value })} />
          <Input aria-label="Contact phone" placeholder="Phone" value={c.phone} onChange={e => setC({ ...c, phone: e.target.value })} />
          <Input aria-label="Contact source URL" placeholder="Where you found it (URL)" value={c.source_url} onChange={e => setC({ ...c, source_url: e.target.value })} className="md:col-span-2" />
          <Button type="submit" disabled={!c.name.trim()} busy={busy}>Add contact</Button>
        </form>
      </Card>
      <Card title="Licensing checklist" className="lg:col-span-2"><TaskList projectId={p.id} tasks={b.tasks} area="licensing" /></Card>
    </div>
  );
}

function Research({ b }: { b: Bundle }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">Investigate each question. Record what you found and where. These are questions to ask — not assumptions about what this lab offers.</p>
      {b.licensing.map(l => <ResearchItem key={l.id} l={l} />)}
      {!b.licensing.length && <Empty title="No questions" />}
    </div>
  );
}
function ResearchItem({ l }: { l: LicensingItem }) {
  const [finding, setFinding] = useState(l.finding);
  const [url, setUrl] = useState(l.source_url);
  const [conf, setConf] = useState(l.confidence);
  const [saved, setSaved] = useState(false);
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div><div className="font-medium">{l.question}</div><p className="mt-1 text-xs text-slate-500">{l.explainer}</p></div>
        <Badge tone={l.status === 'answered' ? 'green' : l.status === 'investigating' ? 'amber' : 'slate'}>{l.status}</Badge>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-[1fr_16rem]">
        <Textarea aria-label={`Finding: ${l.question}`} rows={2} placeholder="What you found" value={finding} onChange={e => setFinding(e.target.value)} />
        <div className="space-y-2">
          <Input aria-label={`Source: ${l.question}`} placeholder="Source URL or 'email from TTO <date>'" value={url} onChange={e => setUrl(e.target.value)} />
          <Select aria-label={`Confidence: ${l.question}`} value={conf} onChange={e => setConf(e.target.value)} options={{ unknown: 'Unknown', hypothesis: 'Hypothesis', sourced: 'Sourced claim', verified: 'Verified with lab / USPTO' }} />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Button size="sm" variant="primary" onClick={async () => {
          await updateRow('licensing_items', l.id, { finding, source_url: url, confidence: conf, status: finding.trim() ? (conf === 'verified' || conf === 'sourced' ? 'answered' : 'investigating') : 'open', verified_at: conf === 'verified' ? nowIso() : null });
          setSaved(true); setTimeout(() => setSaved(false), 1500);
        }}>Save</Button>
        {saved && <span className="text-xs text-emerald-700">Saved</span>}
        {l.verified_at && <span className="text-xs text-slate-500">verified {fmtDate(l.verified_at)}</span>}
        {(conf === 'verified' || conf === 'sourced') && !url.trim() && <span className="text-xs text-amber-700">Add the source for a sourced or verified finding.</span>}
      </div>
    </Card>
  );
}

const CONFIRM_LIC = new Set(['application_submitted', 'license_signed_confirmed']);
function Pathway({ b }: { b: Bundle }) {
  const p = b.project!;
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [a, setA] = useState({ agreement_type: 'option', counterparty: b.lab?.name ?? '', notes: '' });
  const { busy, run } = useAsync();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Current licensing status">
        <Select aria-label="Project licensing status" value={p.licensing_status} options={PROJECT_LICENSING_STATUS}
          onChange={e => CONFIRM_LIC.has(e.target.value) ? setPendingStatus(e.target.value) : void updateRow('projects', p.id, { licensing_status: e.target.value, updated_at: nowIso() })} />
        <p className="mt-2 text-xs text-slate-500">Statuses that say something was submitted or signed require your explicit confirmation.</p>
        <Modal open={!!pendingStatus} onClose={() => setPendingStatus(null)} title="Confirm licensing event">
          <p className="text-sm">Set status to <b>{PROJECT_LICENSING_STATUS[pendingStatus ?? '']}</b>? Only do this if it actually happened and you have documentation.</p>
          <div className="mt-3 flex gap-2"><Button variant="primary" onClick={async () => { await updateRow('projects', p.id, { licensing_status: pendingStatus, updated_at: nowIso() }); setPendingStatus(null); }}>Yes, this happened</Button><Button onClick={() => setPendingStatus(null)}>Cancel</Button></div>
        </Modal>
      </Card>
      <Card title="Proposed pathway">
        <div className="space-y-2">
          {Object.entries(PATHWAYS).map(([k, v]) => (
            <label key={k} className={`flex cursor-pointer gap-2 rounded border p-2 text-sm ${p.licensing_pathway === k ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}>
              <input type="radio" name="pathway" checked={p.licensing_pathway === k} onChange={() => updateRow('projects', p.id, { licensing_pathway: k, updated_at: nowIso() })} />
              <span><b>{v.label}</b> — <span className="text-slate-600">{v.plain}</span></span>
            </label>
          ))}
          <InlineText label="Why this pathway fits" multiline value={p.licensing_pathway_notes} onSave={v => updateRow('projects', p.id, { licensing_pathway_notes: v })} />
        </div>
      </Card>
      <Card title="Agreements" className="lg:col-span-2">
        {b.agreements.length ? (
          <table className="mb-3 w-full text-sm"><thead className="text-left text-xs uppercase text-slate-500"><tr><th className="py-1">Type</th><th>Counterparty</th><th>Status</th><th>Notes</th><th /></tr></thead>
            <tbody>{b.agreements.map(x => (
              <tr key={x.id} className="border-t border-slate-100 align-top">
                <td className="py-2">{PATHWAYS[x.agreement_type]?.label ?? x.agreement_type}</td><td>{x.counterparty}</td>
                <td><Select aria-label="Agreement status" value={x.status} options={AGREEMENT_STATUS} onChange={e => {
                  if (e.target.value === 'executed_confirmed' && !confirm('Confirm this agreement has actually been executed (signed by both parties)?')) return;
                  void updateRow('agreements', x.id, { status: e.target.value, status_date: new Date().toISOString().slice(0, 10) });
                }} className="w-48" /></td>
                <td className="text-xs text-slate-600">{x.notes}</td>
                <td><Button size="sm" variant="ghost" aria-label="Delete agreement" onClick={() => deleteRow('agreements', x.id)}><Trash2 className="size-3.5" /></Button></td>
              </tr>))}</tbody></table>
        ) : <p className="mb-3 text-sm text-slate-500">No agreements tracked yet.</p>}
        <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); void run(async () => { await insertRow('agreements', { ...a, project_id: p.id }); setA({ ...a, notes: '' }); }); }}>
          <Select aria-label="Agreement type" value={a.agreement_type} onChange={e => setA({ ...a, agreement_type: e.target.value })} options={{ evaluation_license: 'Evaluation license', option: 'Option', nonexclusive_license: 'Non-exclusive license', exclusive_license: 'Exclusive license', crada: 'CRADA', nda: 'NDA', other: 'Other' }} className="w-48" />
          <Input aria-label="Counterparty" placeholder="Counterparty" value={a.counterparty} onChange={e => setA({ ...a, counterparty: e.target.value })} className="w-60" />
          <Input aria-label="Agreement notes" placeholder="Notes / key terms" value={a.notes} onChange={e => setA({ ...a, notes: e.target.value })} className="min-w-48 flex-1" />
          <Button type="submit" busy={busy}>Track agreement</Button>
        </form>
      </Card>
    </div>
  );
}

function Outreach({ b }: { b: Bundle }) {
  const p = b.project!;
  const settings = useSettings();
  const [editing, setEditing] = useState<Communication | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const { busy, error, run } = useAsync();
  const [profile, setProfile] = useState<string | null>(null);

  const newDraft = () => run(async () => {
    const d = draftInquiry(p, b.tech, b.lab, b.contacts[0], settings.profile);
    const row = await insertRow<Communication>('communications', { project_id: p.id, contact_id: b.contacts[0]?.id ?? null, area: 'licensing', direction: 'outbound', channel: 'email', status: 'draft', to_address: d.to, subject: d.subject, body: d.body });
    setEditing(row);
  });

  return (
    <div className="space-y-4">
      <Card title="Your introduction" actions={<Button size="sm" onClick={() => setProfile(settings.profile)}>Edit</Button>}>
        <p className="whitespace-pre-wrap text-sm text-slate-700">{settings.profile || 'Add 2–3 sentences about yourself and your company. It is inserted into new outreach drafts.'}</p>
        <Modal open={profile !== null} onClose={() => setProfile(null)} title="Your introduction">
          <Textarea aria-label="Your introduction" rows={5} value={profile ?? ''} onChange={e => setProfile(e.target.value)} placeholder="My name is … I am an entrepreneur with a background in … I am forming a company to …" />
          <Button className="mt-3" variant="primary" onClick={async () => { await saveSettings({ profile: profile ?? '' }); setProfile(null); }}>Save</Button>
        </Modal>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" busy={busy} onClick={newDraft}><Mail className="size-4" />Draft introductory email</Button>
        <Button onClick={() => setLogOpen(true)}>Log a reply, call or meeting</Button>
      </div>
      <ErrorNote error={error} />
      {!b.comms.length ? <Empty title="No outreach yet">Draft an introductory email to the tech-transfer office. You review it, send it from your own email, then mark it sent here so follow-ups are tracked.</Empty> : (
        <div className="space-y-2">
          {b.comms.map(c => (
            <Card key={c.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium">{c.direction === 'inbound' ? '← ' : c.direction === 'outbound' ? '→ ' : ''}{c.subject || `(${c.channel})`}
                    <Badge tone={c.status === 'draft' ? 'amber' : c.status === 'sent_by_user' ? 'blue' : 'green'}>{c.status === 'sent_by_user' ? 'sent by you' : c.status}</Badge></div>
                  <div className="text-xs text-slate-500">{c.to_address && `To ${c.to_address} · `}{c.occurred_at ? fmtDate(c.occurred_at) : `created ${fmtDate(c.created_at)}`}{c.follow_up_date && ` · follow up ${fmtDate(c.follow_up_date)}`}</div>
                  {c.response_summary && <p className="mt-1 text-sm text-slate-700">{c.response_summary}</p>}
                </div>
                <div className="flex gap-1">
                  {c.status === 'draft' && <Button size="sm" onClick={() => setEditing(c)}>Review & edit</Button>}
                  {c.status === 'sent_by_user' && !b.comms.some(x => x.direction === 'inbound' && new Date(x.created_at) > new Date(c.created_at)) && (
                    <Button size="sm" onClick={() => run(async () => { const f = draftFollowUp(c.subject, b.contacts[0]?.name); const row = await insertRow<Communication>('communications', { project_id: p.id, area: 'licensing', direction: 'outbound', channel: 'email', status: 'draft', to_address: c.to_address, subject: f.subject, body: f.body }); setEditing(row); })}>Draft follow-up</Button>
                  )}
                  <Button size="sm" variant="ghost" aria-label="Delete communication" onClick={() => deleteRow('communications', c.id)}><Trash2 className="size-3.5" /></Button>
                </div>
              </div>
              {c.status !== 'draft' && c.body && <details className="mt-2"><summary className="cursor-pointer text-xs text-slate-500">Show message</summary><pre className="mt-1 whitespace-pre-wrap font-sans text-sm text-slate-700">{c.body}</pre></details>}
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Review outreach email" wide>{editing && <EmailEditor c={editing} onClose={() => setEditing(null)} />}</Modal>
      <Modal open={logOpen} onClose={() => setLogOpen(false)} title="Log correspondence"><LogComm projectId={p.id} onClose={() => setLogOpen(false)} /></Modal>
    </div>
  );
}

function EmailEditor({ c, onClose }: { c: Communication; onClose: () => void }) {
  const [v, setV] = useState({ to_address: c.to_address, subject: c.subject, body: c.body });
  const [followUp, setFollowUp] = useState(() => new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10));
  const [copied, setCopied] = useState(false);
  const placeholders = (v.body.match(/\[[^\]]+\]/g) ?? []).length;
  const save = () => updateRow('communications', c.id, v);
  return (
    <div className="space-y-3">
      <Notice tone="blue">This draft is not sent by the app. Edit it, then copy it or open it in your email program and send it yourself. Then press <b>I sent it</b>.</Notice>
      <Field label="To"><Input aria-label="Email to" value={v.to_address} onChange={e => setV({ ...v, to_address: e.target.value })} /></Field>
      <Field label="Subject"><Input aria-label="Email subject" value={v.subject} onChange={e => setV({ ...v, subject: e.target.value })} /></Field>
      <Field label="Message"><Textarea aria-label="Email body" rows={16} value={v.body} onChange={e => setV({ ...v, body: e.target.value })} /></Field>
      {placeholders > 0 && <Notice>{placeholders} placeholder{placeholders > 1 ? 's' : ''} in [brackets] still need your details.</Notice>}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={async () => { await save(); onClose(); }}>Save draft</Button>
        <Button onClick={async () => { await navigator.clipboard.writeText(`${v.subject}\n\n${v.body}`); setCopied(true); setTimeout(() => setCopied(false), 1500); }}><Copy className="size-4" />{copied ? 'Copied' : 'Copy'}</Button>
        <a className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3.5 py-2 text-sm hover:bg-slate-50" href={`mailto:${encodeURIComponent(v.to_address)}?subject=${encodeURIComponent(v.subject)}&body=${encodeURIComponent(v.body)}`} onClick={() => void save()}><Mail className="size-4" />Open in email app</a>
        <span className="ml-auto flex items-center gap-2 text-sm">Follow up on <Input aria-label="Follow-up date" type="date" value={followUp} onChange={e => setFollowUp(e.target.value)} className="w-40" />
          <Button variant="primary" disabled={placeholders > 0} title={placeholders ? 'Fill in the [placeholders] first' : ''} onClick={async () => { await updateRow('communications', c.id, { ...v, status: 'sent_by_user', occurred_at: nowIso(), follow_up_date: followUp || null }); onClose(); }}>I sent it</Button>
        </span>
      </div>
    </div>
  );
}

function LogComm({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const [v, setV] = useState({ direction: 'inbound', channel: 'email', subject: '', response_summary: '', body: '', occurred_at: new Date().toISOString().slice(0, 10), follow_up_date: '' });
  const { busy, run } = useAsync();
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Direction"><Select aria-label="Direction" value={v.direction} onChange={e => setV({ ...v, direction: e.target.value })} options={{ inbound: 'They contacted me / replied', outbound: 'I contacted them', note: 'Note' }} /></Field>
        <Field label="Channel"><Select aria-label="Channel" value={v.channel} onChange={e => setV({ ...v, channel: e.target.value })} options={{ email: 'Email', phone: 'Phone', meeting: 'Meeting', web_form: 'Web form', other: 'Other' }} /></Field>
      </div>
      <Field label="Subject"><Input aria-label="Log subject" value={v.subject} onChange={e => setV({ ...v, subject: e.target.value })} /></Field>
      <Field label="Summary of what was said"><Textarea aria-label="Summary" value={v.response_summary} onChange={e => setV({ ...v, response_summary: e.target.value })} /></Field>
      <Field label="Full text (optional)"><Textarea aria-label="Full text" rows={5} value={v.body} onChange={e => setV({ ...v, body: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Date"><Input aria-label="Date" type="date" value={v.occurred_at} onChange={e => setV({ ...v, occurred_at: e.target.value })} /></Field>
        <Field label="Follow-up date"><Input aria-label="Log follow-up date" type="date" value={v.follow_up_date} onChange={e => setV({ ...v, follow_up_date: e.target.value })} /></Field>
      </div>
      <Button variant="primary" busy={busy} onClick={() => run(async () => { await insertRow('communications', { ...v, project_id: projectId, area: 'licensing', status: v.direction === 'inbound' ? 'received' : 'logged', occurred_at: v.occurred_at ? new Date(`${v.occurred_at}T12:00:00`).toISOString() : nowIso(), follow_up_date: v.follow_up_date || null }); onClose(); })}>Save</Button>
    </div>
  );
}
