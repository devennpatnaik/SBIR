import { useState } from 'react';
import { deleteRow, fmtDate, insertRow, useQuery } from '../lib/data';
import type { Source } from '../lib/types';
import { Badge, Button, Input, Select, SourceLink, useAsync, ErrorNote } from './ui';

export const EVIDENCE: Record<string, string> = { verified: 'Verified fact', sourced: 'Sourced claim', estimate: 'Estimate', hypothesis: 'Hypothesis' };
const tone = (l: string) => (l === 'verified' ? 'green' : l === 'sourced' ? 'blue' : l === 'estimate' ? 'amber' : 'slate') as 'green' | 'blue' | 'amber' | 'slate';
export const EvidenceBadge = ({ level }: { level: string }) => <Badge tone={tone(level)}>{EVIDENCE[level] ?? level}</Badge>;

/** Evidence log: each claim with where it came from, how strong it is, and when it was checked. */
export function SourcesPanel({ scope }: { scope: { technology_id?: string; project_id?: string; opportunity_id?: string } }) {
  const [col, val] = Object.entries(scope).find(([, v]) => v) ?? ['technology_id', ''];
  const q = useQuery<Source>('sources', b => b.eq(col, val).order('checked_at', { ascending: false }), [col, val], !!val);
  const [claim, setClaim] = useState('');
  const [url, setUrl] = useState('');
  const [level, setLevel] = useState('sourced');
  const { busy, error, run } = useAsync();
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">Record important facts with their source. <b>Verified</b> = confirmed in a primary source (lab, USPTO, agency) or in writing from the lab. <b>Sourced</b> = stated by a credible source. <b>Estimate</b> / <b>Hypothesis</b> = your reasoning.</p>
      <div className="flex flex-wrap gap-2">
        <Input aria-label="Claim" placeholder="Claim, e.g. US 10,123,456 issued 2019, assigned to UT-Battelle" value={claim} onChange={e => setClaim(e.target.value)} className="min-w-64 flex-1" />
        <Input aria-label="Source URL" placeholder="Source URL" value={url} onChange={e => setUrl(e.target.value)} className="w-64" />
        <Select aria-label="Evidence level" value={level} onChange={e => setLevel(e.target.value)} options={EVIDENCE} className="w-40" />
        <Button busy={busy} disabled={!claim.trim() || ((level === 'verified' || level === 'sourced') && !url.trim())}
          title={(level === 'verified' || level === 'sourced') && !url.trim() ? 'Verified and sourced claims need a source URL' : ''}
          onClick={() => run(async () => { await insertRow('sources', { ...scope, claim, url, evidence_level: level }); setClaim(''); setUrl(''); })}>Add</Button>
      </div>
      <ErrorNote error={error} />
      {!q.data.length ? <p className="text-sm text-slate-500">No evidence recorded yet.</p> : (
        <ul className="divide-y divide-slate-100">
          {q.data.map(s => (
            <li key={s.id} className="flex items-start justify-between gap-3 py-2 text-sm">
              <div><EvidenceBadge level={s.evidence_level} /> <span className="ml-1">{s.claim}</span><div className="mt-0.5 flex gap-3 text-xs text-slate-500"><SourceLink url={s.url} /><span>checked {fmtDate(s.checked_at)}</span></div></div>
              <Button size="sm" variant="ghost" aria-label={`Delete evidence ${s.claim}`} onClick={() => deleteRow('sources', s.id)}>Remove</Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
