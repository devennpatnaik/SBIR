import { useEffect, useState } from 'react';
import { client } from '../client';
import { DIMENSIONS } from '../lib/constants';
import { invalidate, nowIso } from '../lib/data';
import { summarize } from '../lib/scoring';
import type { Evaluation, ScoreEntry, Technology } from '../lib/types';
import { Badge, Button, ErrorNote, Field, Notice, Select, Textarea, useAsync } from './ui';
import { cn } from '../lib/utils';

const blank = (): ScoreEntry => ({ score: null, rationale: '', evidence: '', confidence: 'low' });

export function ScoreEditor({ tech, evaluation, weights, onSaved }: { tech: Technology; evaluation?: Evaluation; weights: Record<string, number>; onSaved?: () => void }) {
  const [scores, setScores] = useState<Record<string, ScoreEntry>>(evaluation?.scores ?? {});
  const [assumptions, setAssumptions] = useState(evaluation?.assumptions ?? '');
  const [missing, setMissing] = useState(evaluation?.missing_info ?? '');
  const { busy, error, run } = useAsync();
  const [saved, setSaved] = useState(false);
  useEffect(() => { setScores(evaluation?.scores ?? {}); setAssumptions(evaluation?.assumptions ?? ''); setMissing(evaluation?.missing_info ?? ''); }, [evaluation?.id, evaluation?.updated_at]);
  const set = (k: string, patch: Partial<ScoreEntry>) => setScores(p => ({ ...p, [k]: { ...(p[k] ?? blank()), ...patch } }));
  const preview = summarize({ id: '', technology_id: tech.id, scores, weights, assumptions, missing_info: missing, updated_at: '' }, tech);

  const save = () => run(async () => {
    const res = await client.from('evaluations').upsert({ technology_id: tech.id, scores, weights, assumptions, missing_info: missing, updated_at: nowIso() }, { onConflict: 'technology_id' });
    if (res.error) throw new Error(res.error.message);
    await client.from('technologies').update({ last_reviewed_at: nowIso() }).eq('id', tech.id);
    invalidate(); setSaved(true); setTimeout(() => setSaved(false), 2000); onSaved?.();
  });

  return (
    <div className="space-y-4">
      <Notice tone="slate">Score on evidence, not on how impressive the description sounds. Commercial demand, differentiation, licensing feasibility and practical development cost matter more than novelty. Leave a dimension blank if you have no basis yet — it shows up as missing information.</Notice>
      <div className="space-y-3">
        {DIMENSIONS.map(d => {
          const s = scores[d.key] ?? blank();
          return (
            <div key={d.key} className="rounded-md border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">{d.label} <span className="text-xs font-normal text-slate-500">weight {weights[d.key]}</span></div>
                  <div className="text-xs text-slate-500">{d.help}</div>
                </div>
                <div className="flex items-center gap-1" role="group" aria-label={`Score for ${d.label}`}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" aria-label={`${d.label}: ${n}`} aria-pressed={s.score === n} onClick={() => set(d.key, { score: s.score === n ? null : n })}
                      className={cn('size-8 rounded-md border text-sm font-medium', s.score === n ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 bg-white hover:bg-slate-50')}>{n}</button>
                  ))}
                  <Select aria-label={`Confidence for ${d.label}`} className="ml-2 w-32" value={s.confidence} onChange={e => set(d.key, { confidence: e.target.value as ScoreEntry['confidence'] })} options={{ low: 'Low confidence', medium: 'Medium confidence', high: 'High confidence' }} />
                </div>
              </div>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <Textarea aria-label={`Rationale for ${d.label}`} rows={2} placeholder="Why this score?" value={s.rationale} onChange={e => set(d.key, { rationale: e.target.value })} />
                <Textarea aria-label={`Evidence for ${d.label}`} rows={2} placeholder="Supporting evidence — links, interview notes, data. Empty = assumption." value={s.evidence} onChange={e => set(d.key, { evidence: e.target.value })} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Key assumptions"><Textarea aria-label="Key assumptions" value={assumptions} onChange={e => setAssumptions(e.target.value)} /></Field>
        <Field label="Missing information to collect"><Textarea aria-label="Missing information to collect" value={missing} onChange={e => setMissing(e.target.value)} /></Field>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="primary" busy={busy} onClick={save}>Save scores</Button>
        {saved && <span className="text-sm text-emerald-700">Saved</span>}
        <span className="text-sm text-slate-600">Preview: {preview.overall == null ? 'not scored' : <><b>{preview.overall}/100</b> · {preview.scored}/10 scored · <ConfidenceBadge c={preview.confidence} /></>}</span>
      </div>
      <ErrorNote error={error} />
    </div>
  );
}

export function ConfidenceBadge({ c }: { c: string }) {
  return <Badge tone={c === 'high' ? 'green' : c === 'medium' ? 'amber' : 'red'} title="Confidence reflects how many dimensions are scored, your stated confidence, and whether evidence is attached.">{c === 'none' ? 'no' : c} confidence</Badge>;
}
