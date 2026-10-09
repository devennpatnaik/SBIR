import { useState } from 'react';
import { TECH_LICENSING_STATUS } from '../lib/constants';
import type { Technology } from '../lib/types';
import { Button, Field, Input, Select, Textarea, ErrorNote } from './ui';

export type TechDraft = Partial<Technology>;
export const TECH_FIELDS: { key: keyof Technology; label: string; multiline?: boolean; hint?: string }[] = [
  { key: 'name', label: 'Technology name' },
  { key: 'source_url', label: 'Original source URL', hint: 'Link to the lab, TechLink, LPS or FLC listing.' },
  { key: 'description', label: 'Plain-English description', multiline: true },
  { key: 'lab_name', label: 'Federal laboratory' },
  { key: 'agency', label: 'Agency', hint: 'e.g. DOE, DoD (Navy), NASA, HHS (NIH)' },
  { key: 'inventors', label: 'Inventors / research contacts', hint: 'Only publicly listed names.' },
  { key: 'category', label: 'Technology category' },
  { key: 'maturity', label: 'Development maturity (TRL), if known' },
  { key: 'applications', label: 'Commercial applications', multiline: true },
  { key: 'customers', label: 'Potential customers', multiline: true },
  { key: 'competitors', label: 'Competing products or approaches', multiline: true },
  { key: 'patent_numbers', label: 'Patent / application numbers' },
  { key: 'ip_info', label: 'IP and patent notes', multiline: true },
  { key: 'licensing_status_source', label: 'Where the licensing status came from', hint: 'URL or "email from TTO on <date>". Required to mark it confirmed.' },
  { key: 'sbir_relevance', label: 'Potential SBIR/STTR relevance', multiline: true },
  { key: 'open_questions', label: 'Important unanswered questions (one per line)', multiline: true },
];

export function TechForm({ initial, onSubmit, submitLabel, onCancel }: { initial: TechDraft; onSubmit: (d: TechDraft) => Promise<void>; submitLabel: string; onCancel?: () => void }) {
  const [d, setD] = useState<TechDraft>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof Technology, v: string) => setD(prev => ({ ...prev, [k]: v }));
  const submit = async () => {
    if (!d.name?.trim()) { setError('Give the technology a name.'); return; }
    if (d.licensing_status === 'available_verified' && !d.licensing_status_source?.trim()) {
      setError('To mark licensing as confirmed by the lab, record where that confirmation came from.'); return;
    }
    setBusy(true); setError(null);
    try { await onSubmit(d); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  };
  return (
    <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={e => { e.preventDefault(); void submit(); }}>
      {TECH_FIELDS.map(f => (
        <Field key={f.key} label={f.label} hint={f.hint} className={f.multiline || f.key === 'name' || f.key === 'source_url' ? 'md:col-span-2' : ''}>
          {f.multiline
            ? <Textarea aria-label={f.label} value={String(d[f.key] ?? '')} onChange={e => set(f.key, e.target.value)} />
            : <Input aria-label={f.label} value={String(d[f.key] ?? '')} onChange={e => set(f.key, e.target.value)} />}
        </Field>
      ))}
      <Field label="Licensing status">
        <Select aria-label="Licensing status" value={d.licensing_status ?? 'unknown'} options={TECH_LICENSING_STATUS} onChange={e => set('licensing_status', e.target.value)} />
      </Field>
      <div className="md:col-span-2"><ErrorNote error={error} /></div>
      <div className="flex gap-2 md:col-span-2">
        <Button type="submit" variant="primary" busy={busy}>{submitLabel}</Button>
        {onCancel && <Button onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
