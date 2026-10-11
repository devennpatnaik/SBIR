import { useState } from 'react';
import { HelpSuggestions } from '../components/Help';
import { getActiveProject } from '../lib/router';
import { ArrowLeft, CheckCircle2, Plus } from 'lucide-react';
import { useBundle } from '../lib/bundle';
import { daysUntil, fmtDate, insertRow, nowIso, updateRow, useQuery } from '../lib/data';
import { createProposal, recordStatusChange } from '../lib/actions';
import { navigate } from '../lib/router';
import type { Opportunity, Proposal, ProposalSection, Question } from '../lib/types';
import { DocList } from '../components/DocList';
import { ProjectPicker, QuestionList, TaskList } from '../components/ProjectParts';
import { Badge, Button, Card, Empty, ErrorNote, Field, Input, Modal, Notice, PageHeader, Select, SourceLink, Textarea, useAsync } from '../components/ui';

const PSTATUS: Record<string, string> = { planning: 'Planning', drafting: 'Drafting', internal_review: 'Internal review', ready_to_submit: 'Ready to submit', submitted_confirmed: 'Submitted (you confirmed)', withdrawn: 'Withdrawn' };
const SSTATUS: Record<string, string> = { not_started: 'Not started', drafting: 'Drafting', needs_evidence: 'Needs evidence', complete: 'Complete' };
const REQ: Record<string, string> = { confirmed_required: 'Required (confirmed in solicitation)', confirm_in_solicitation: 'Check solicitation', optional: 'Optional', not_required: 'Not required' };

export function Proposals({ id }: { id?: string }) {
  if (id) return <ProposalWorkspace id={id} />;
  return (
    <div>
      <PageHeader title="Proposal workspace" subtitle="One workspace per solicitation you pursue. The solicitation is the authority for structure and requirements." />
      <HelpSuggestions projectId={getActiveProject()} stage="propose" title="Free help writing your proposal" />
      <ProjectPicker>{pid => <ProposalList projectId={pid} />}</ProjectPicker>
    </div>
  );
}

function ProposalList({ projectId }: { projectId: string }) {
  const b = useBundle(projectId);
  if (!b.proposals.length) return <Empty title="No proposal workspaces yet" action={<Button variant="primary" onClick={() => navigate('funding')}>Go to Funding Opportunities</Button>}>Open a saved funding opportunity, mark it as one you are pursuing, and press <b>Start proposal workspace</b>.</Empty>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {b.proposals.map(p => {
        const secs = b.sections.filter(s => s.proposal_id === p.id && s.required_status !== 'not_required');
        const done = secs.filter(s => s.status === 'complete').length;
        const o = b.opps.find(x => x.id === p.opportunity_id);
        return (
          <Card key={p.id}>
            <a href={`#/proposals/${p.id}`} className="font-semibold hover:underline">{p.title}</a>
            <div className="mt-1 text-xs text-slate-500">{o?.agency} · closes {fmtDate(o?.close_date)} {o && !o.deadline_verified && o.close_date && <Badge tone="amber">unverified</Badge>}</div>
            <div className="mt-2"><Badge tone={p.status === 'submitted_confirmed' ? 'green' : 'blue'}>{PSTATUS[p.status]}</Badge></div>
            <div className="mt-3 h-1.5 rounded bg-slate-100"><div className="h-1.5 rounded bg-emerald-500" style={{ width: `${secs.length ? (done / secs.length) * 100 : 0}%` }} /></div>
            <div className="mt-1 text-xs text-slate-500">{done}/{secs.length} checklist items complete</div>
          </Card>
        );
      })}
    </div>
  );
}

function ProposalWorkspace({ id }: { id: string }) {
  const pq = useQuery<Proposal>('proposals', q => q.eq('id', id), [id]);
  const p = pq.data[0];
  const b = useBundle(p?.project_id);
  const oq = useQuery<Opportunity>('opportunities', q => q.eq('id', p?.opportunity_id ?? ''), [p?.opportunity_id], !!p);
  const eq = useQuery<Question>('questions', q => q.eq('opportunity_id', p?.opportunity_id ?? ''), [p?.opportunity_id], !!p);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  if (pq.loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!p) return <ErrorNote error="Proposal not found." />;
  const o = oq.data[0];
  const secs = b.sections.filter(s => s.proposal_id === p.id);
  const active = secs.filter(s => s.required_status !== 'not_required');
  const complete = active.filter(s => s.status === 'complete');
  const needsEv = active.filter(s => s.status === 'needs_evidence' || (s.evidence_needed.trim() && s.status !== 'complete'));
  const unconfirmed = active.filter(s => s.required_status === 'confirm_in_solicitation');
  const elig = eq.data.filter(q => q.status === 'open');
  const d = daysUntil(o?.close_date);

  return (
    <div>
      <button type="button" onClick={() => navigate('proposals')} className="mb-2 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft className="size-4" />All proposals</button>
      <PageHeader title={p.title} subtitle={o && <span className="flex flex-wrap items-center gap-2">{o.agency} {o.branch} · {o.solicitation_number}<SourceLink url={o.source_url} label="Solicitation" /><a className="text-xs text-blue-700 hover:underline" href={`#/funding/${o.id}`}>Opportunity record</a></span>}
        actions={<>
          <Select aria-label="Proposal status" value={p.status} onChange={e => e.target.value === 'submitted_confirmed' ? setSubmitOpen(true) : void updateRow('proposals', p.id, { status: e.target.value })} options={PSTATUS} className="w-56" />
        </>} />
      <Notice tone="slate">Drafts here are working material, not validated evidence or a completed application. Use the official solicitation as the authority for every requirement, page limit and format.</Notice>

      <div className="my-4 grid gap-3 md:grid-cols-5">
        <Stat label="Complete" value={`${complete.length}/${active.length}`} tone="green" />
        <Stat label="Incomplete" value={String(active.length - complete.length)} />
        <Stat label="Missing evidence" value={String(needsEv.length)} tone={needsEv.length ? 'amber' : undefined} />
        <Stat label="Not confirmed vs solicitation" value={String(unconfirmed.length)} tone={unconfirmed.length ? 'amber' : undefined} />
        <Stat label="Open eligibility questions" value={String(elig.length)} tone={elig.length ? 'red' : undefined} />
      </div>
      <div className="mb-4 text-sm">Deadline: <b>{fmtDate(o?.close_date)}</b> {o?.close_date && (o.deadline_verified ? <Badge tone="green">verified</Badge> : <Badge tone="amber">unverified — confirm on the official page</Badge>)} {d !== null && d >= 0 && <span className="text-slate-500">({d} days)</span>}</div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-2">
          <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Sections, documents & certifications</h2><Button size="sm" onClick={() => setAddOpen(true)}><Plus className="size-3.5" />Add item from solicitation</Button></div>
          {!secs.length && b.project && o && <Empty title="Checklist not built yet" action={<Button variant="primary" onClick={() => void createProposal(b.project!, o)}>Build checklist from solicitation</Button>}>The checklist is built from the solicitation's required documents plus a standard outline.</Empty>}
          {secs.map(s => <SectionCard key={s.id} s={s} projectId={p.project_id} />)}
        </div>
        <div className="space-y-4">
          <Card title="Eligibility questions">{o && <QuestionList projectId={p.project_id} questions={eq.data} kind="eligibility" opportunityId={o.id} area="funding" />}</Card>
          <Card title="Proposal tasks"><TaskList projectId={p.project_id} tasks={b.tasks} proposalId={p.id} area="proposal" /></Card>
          <Card title="Solicitation & supporting files"><DocList scope={{ project_id: p.project_id, opportunity_id: p.opportunity_id }} compact /></Card>
        </div>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add a checklist item"><AddSection proposalId={p.id} onDone={() => setAddOpen(false)} /></Modal>
      <Modal open={submitOpen} onClose={() => setSubmitOpen(false)} title="Confirm submission"><ConfirmSubmit p={p} projectStatusUpdate={b.project ? () => recordStatusChange(b.project!, 'proposal_submitted', `Submitted ${p.title}`) : undefined} onDone={() => setSubmitOpen(false)} /></Modal>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'green' | 'amber' | 'red' }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-3"><div className="text-xs text-slate-500">{label}</div><div className={`text-xl font-semibold ${tone === 'green' ? 'text-emerald-700' : tone === 'amber' ? 'text-amber-700' : tone === 'red' ? 'text-red-700' : ''}`}>{value}</div></div>;
}

function SectionCard({ s, projectId }: { s: ProposalSection; projectId: string }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ draft: s.draft, evidence_needed: s.evidence_needed, solicitation_reference: s.solicitation_reference });
  const [saved, setSaved] = useState(false);
  const dim = s.required_status === 'not_required';
  return (
    <div className={`rounded-lg border bg-white ${dim ? 'border-slate-100 opacity-60' : 'border-slate-200'}`}>
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <button type="button" onClick={() => updateRow('proposal_sections', s.id, { status: s.status === 'complete' ? 'drafting' : 'complete', updated_at: nowIso() })} aria-label={`Toggle complete: ${s.title}`}>
          <CheckCircle2 className={`size-5 ${s.status === 'complete' ? 'text-emerald-600' : 'text-slate-300 hover:text-slate-500'}`} />
        </button>
        <button type="button" className="flex-1 text-left text-sm font-medium" onClick={() => setOpen(!open)}>{s.title}</button>
        <Badge tone="slate">{s.kind}</Badge>
        <Badge tone={s.required_status === 'confirmed_required' ? 'blue' : s.required_status === 'confirm_in_solicitation' ? 'amber' : 'slate'}>{REQ[s.required_status]}</Badge>
        <Badge tone={s.status === 'complete' ? 'green' : s.status === 'needs_evidence' ? 'red' : 'slate'}>{SSTATUS[s.status]}</Badge>
      </div>
      {open && (
        <div className="space-y-3 border-t border-slate-100 p-3">
          {s.guidance && <p className="text-xs text-slate-600">{s.guidance}</p>}
          <div className="grid gap-2 md:grid-cols-2">
            <Field label="Required by solicitation?"><Select aria-label={`Requirement: ${s.title}`} value={s.required_status} onChange={e => updateRow('proposal_sections', s.id, { required_status: e.target.value })} options={REQ} /></Field>
            <Field label="Status"><Select aria-label={`Status: ${s.title}`} value={s.status} onChange={e => updateRow('proposal_sections', s.id, { status: e.target.value, updated_at: nowIso() })} options={SSTATUS} /></Field>
          </div>
          <Field label="Solicitation reference" hint="Section / page in the solicitation that defines this item, plus page limits."><Input aria-label={`Reference: ${s.title}`} value={v.solicitation_reference} onChange={e => setV({ ...v, solicitation_reference: e.target.value })} /></Field>
          <Field label="Working draft">
            <Textarea aria-label={`Draft: ${s.title}`} rows={8} value={v.draft} onChange={e => setV({ ...v, draft: e.target.value })} />
            {s.draft_is_ai_generated && <span className="text-xs text-amber-700">Contains assistant-generated text — review every claim before use.</span>}
          </Field>
          <Field label="Evidence still needed"><Textarea aria-label={`Evidence needed: ${s.title}`} rows={2} value={v.evidence_needed} onChange={e => setV({ ...v, evidence_needed: e.target.value })} placeholder="e.g. lab test data on detection limit; 3 letters of support" /></Field>
          <div className="flex items-center gap-2"><Button size="sm" variant="primary" onClick={async () => { await updateRow('proposal_sections', s.id, { ...v, updated_at: nowIso() }); setSaved(true); setTimeout(() => setSaved(false), 1500); }}>Save section</Button>{saved && <span className="text-xs text-emerald-700">Saved</span>}</div>
          <div><div className="mb-1 text-xs font-medium text-slate-600">Supporting notes, interviews and evidence for this section</div><DocList scope={{ project_id: projectId, proposal_section_id: s.id }} compact /></div>
        </div>
      )}
    </div>
  );
}

function AddSection({ proposalId, onDone }: { proposalId: string; onDone: () => void }) {
  const [v, setV] = useState({ title: '', kind: 'section', solicitation_reference: '' });
  const { busy, run } = useAsync();
  return (
    <div className="space-y-3">
      <Field label="Item"><Input aria-label="Item title" value={v.title} onChange={e => setV({ ...v, title: e.target.value })} placeholder="e.g. Technical Volume (20 pages max)" /></Field>
      <Field label="Type"><Select aria-label="Item type" value={v.kind} onChange={e => setV({ ...v, kind: e.target.value })} options={{ section: 'Section', document: 'Document', certification: 'Certification', evidence: 'Evidence' }} /></Field>
      <Field label="Solicitation reference"><Input aria-label="Item reference" value={v.solicitation_reference} onChange={e => setV({ ...v, solicitation_reference: e.target.value })} /></Field>
      <Button variant="primary" busy={busy} disabled={!v.title.trim()} onClick={() => run(async () => { await insertRow('proposal_sections', { ...v, proposal_id: proposalId, required_status: 'confirmed_required', sort: 50 }); onDone(); })}>Add</Button>
    </div>
  );
}

function ConfirmSubmit({ p, onDone, projectStatusUpdate }: { p: Proposal; onDone: () => void; projectStatusUpdate?: () => Promise<void> }) {
  const [ref, setRef] = useState('');
  const [alsoProject, setAlsoProject] = useState(true);
  const { busy, error, run, setError } = useAsync();
  return (
    <div className="space-y-3">
      <p className="text-sm">Only confirm if you actually submitted this proposal in the agency's system. The app does not submit anything.</p>
      <Field label="Submission confirmation / reference number"><Textarea aria-label="Submission reference" rows={2} value={ref} onChange={e => setRef(e.target.value)} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={alsoProject} onChange={e => setAlsoProject(e.target.checked)} />Also move the project to "Proposal submitted"</label>
      <ErrorNote error={error} />
      <Button variant="primary" busy={busy} onClick={() => { if (!ref.trim()) { setError('Enter the confirmation number or a note about how you submitted.'); return; } void run(async () => { await updateRow('proposals', p.id, { status: 'submitted_confirmed', submitted_confirmed_at: nowIso(), submission_reference: ref }); if (alsoProject && projectStatusUpdate) await projectStatusUpdate(); onDone(); }); }}>I submitted it</Button>
    </div>
  );
}
