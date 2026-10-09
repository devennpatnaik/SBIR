import { useState } from 'react';
import type { Opportunity } from '../lib/types';
import { Button, ErrorNote, Field, Input, Select, Textarea } from './ui';

export const OPP_FIELDS: { key: keyof Opportunity; label: string; multiline?: boolean; type?: string; hint?: string }[] = [
  { key: 'topic_title', label: 'Topic title' },
  { key: 'source_url', label: 'Official source URL', hint: 'The agency topic or solicitation page.' },
  { key: 'agency', label: 'Agency' },
  { key: 'branch', label: 'Component / branch', hint: 'e.g. Navy, NIH NCI, DOE Office of Science' },
  { key: 'solicitation_title', label: 'Solicitation title' },
  { key: 'solicitation_number', label: 'Solicitation number' },
  { key: 'topic_number', label: 'Topic number' },
  { key: 'phase', label: 'Phase', hint: 'Phase I, Phase II, Direct to Phase II, Fast Track…' },
  { key: 'award_type', label: 'Award type', hint: 'Contract, grant, cooperative agreement' },
  { key: 'award_amount', label: 'Award size (as stated)' },
  { key: 'duration', label: 'Project duration (as stated)' },
  { key: 'open_date', label: 'Opens', type: 'date' },
  { key: 'close_date', label: 'Closes (deadline)', type: 'date' },
  { key: 'submission_system', label: 'Submission system & instructions', multiline: true, hint: 'e.g. DSIP, Grants.gov / eRA Commons (NIH), PAMS (DOE), NSPIRES (NASA), NSF Research.gov' },
  { key: 'technical_objective', label: 'Research topic / technical objective', multiline: true },
  { key: 'required_work', label: 'Required technical work', multiline: true },
  { key: 'required_documents', label: 'Required proposal documents (one per line)', multiline: true, hint: 'Each line becomes a confirmed checklist item in the proposal workspace.' },
  { key: 'eligibility', label: 'Application eligibility requirements', multiline: true },
  { key: 'small_business_reqs', label: 'Small-business eligibility requirements', multiline: true },
  { key: 'research_institution_reqs', label: 'Research-institution / collaboration requirements', multiline: true, hint: 'For STTR: partner type and minimum work share stated in the solicitation.' },
  { key: 'restrictions', label: 'Restrictions, certifications and conditions', multiline: true, hint: 'e.g. ITAR/export control, foreign-ownership limits, PI employment rules' },
];

export function OppForm({ initial, onSubmit, submitLabel, onCancel }: { initial: Partial<Opportunity>; onSubmit: (o: Partial<Opportunity>) => Promise<void>; submitLabel: string; onCancel?: () => void }) {
  const [d, setD] = useState<Partial<Opportunity>>({ program: 'SBIR', ...initial });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={async e => {
      e.preventDefault();
      if (!d.topic_title?.trim()) { setError('Enter the topic title.'); return; }
      if (!d.source_url?.trim()) { setError('Enter the official source URL — opportunities must come from an official source.'); return; }
      setBusy(true); setError(null);
      try { await onSubmit({ ...d, open_date: d.open_date || null, close_date: d.close_date || null }); } catch (er) { setError(er instanceof Error ? er.message : String(er)); } finally { setBusy(false); }
    }}>
      <Field label="Program"><Select aria-label="Program" value={d.program} onChange={e => setD({ ...d, program: e.target.value })} options={{ SBIR: 'SBIR', STTR: 'STTR', 'SBIR/STTR': 'SBIR/STTR (either)', Other: 'Other' }} /></Field>
      {OPP_FIELDS.map(f => (
        <Field key={f.key} label={f.label} hint={f.hint} className={f.multiline || f.key === 'topic_title' || f.key === 'source_url' ? 'md:col-span-2' : ''}>
          {f.multiline ? <Textarea aria-label={f.label} value={String(d[f.key] ?? '')} onChange={e => setD({ ...d, [f.key]: e.target.value })} />
            : <Input aria-label={f.label} type={f.type ?? 'text'} value={String(d[f.key] ?? '')} onChange={e => setD({ ...d, [f.key]: e.target.value })} />}
        </Field>
      ))}
      <div className="md:col-span-2"><ErrorNote error={error} /></div>
      <div className="flex gap-2 md:col-span-2"><Button type="submit" variant="primary" busy={busy}>{submitLabel}</Button>{onCancel && <Button onClick={onCancel}>Cancel</Button>}</div>
    </form>
  );
}

export function SbirSttrExplainer() {
  return (
    <div className="space-y-2 text-sm text-slate-700">
      <p><b>SBIR</b> funds R&D at a small business. The principal investigator must normally be primarily employed by the small business. A research institution can be a subcontractor within the limits the solicitation sets.</p>
      <p><b>STTR</b> requires a formal partnership with a U.S. research institution (a university, nonprofit research institution, or federally funded R&D center such as many national labs). Under the SBA policy directive, the small business must generally perform at least 40% of the work and the research institution at least 30%; an agreement allocating IP rights between them is required. Always use the specific solicitation's wording.</p>
      <p className="text-xs text-slate-500">Not every agency participates in every cycle, not every technology qualifies, and many agencies expect IP and eligibility questions to be resolved before award. Check SBA eligibility at 13 CFR 121.702 and the solicitation itself. General information, not legal advice.</p>
    </div>
  );
}
