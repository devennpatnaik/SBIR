import { useEffect, useState } from 'react';
import {
  OUTCOME_QUESTIONS,
  answeredCount,
  answersFromOutcome,
  emptyAnswers,
  type InvestigationOutcome,
  type OutcomeAnswers,
} from '@project/learning';
import { invalidate } from '../lib/data';
import { fetchOutcome, saveOutcome } from '../lib/learning';
import { Button, Notice } from './ui';

type Props = {
  technologyId: string;
  projectId?: string | null;
  isSample?: boolean;
  compact?: boolean;
};

export function OutcomesForm({ technologyId, projectId, isSample, compact }: Props) {
  const [answers, setAnswers] = useState<OutcomeAnswers>(emptyAnswers());
  const [saved, setSaved] = useState<InvestigationOutcome | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    void fetchOutcome(technologyId)
      .then(o => {
        if (!alive) return;
        setSaved(o);
        setAnswers(answersFromOutcome(o ? { ...o, is_sample: isSample || o.is_sample } : { is_sample: !!isSample }));
      })
      .catch(e => {
        if (alive) setError(e instanceof Error ? e.message : 'Could not load outcomes.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [technologyId, isSample]);

  const set = <K extends keyof OutcomeAnswers>(key: K, value: OutcomeAnswers[K]) =>
    setAnswers(a => ({ ...a, [key]: value }));

  const submit = async () => {
    setBusy(true);
    setError('');
    setOk('');
    try {
      const outcome = await saveOutcome({
        technologyId,
        projectId: projectId ?? null,
        answers: { ...answers, contribute_to_learning: isSample ? false : answers.contribute_to_learning !== false },
      });
      setSaved(outcome);
      setAnswers(answersFromOutcome(outcome));
      setOk('Saved. These answers help improve future recommendations when enough similar cases exist.');
      invalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save outcomes.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading what you’ve recorded…</p>;

  return (
    <div className={compact ? 'outcomes-form compact' : 'outcomes-form'}>
      {!compact && (
        <>
          <p className="eyebrow">LAYER 4 · WHAT HAPPENED</p>
          <h2 className="editorial text-2xl">Record the real outcome.</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            Five questions. Answer only what you know. Over time, this evidence improves recommendations for technologies like this one.
          </p>
        </>
      )}
      {isSample && (
        <div className="mt-3">
          <Notice tone="amber">
            This is sample data. Outcomes stay on your account and are never used for cohort learning.
          </Notice>
        </div>
      )}
      <div className="mt-4 space-y-4">
        {OUTCOME_QUESTIONS.map(q => (
          <label key={q.key} className="block">
            <span className="text-sm font-medium text-slate-800">{q.label}</span>
            <span className="mt-0.5 block text-xs text-slate-500">{q.help}</span>
            <select
              className="mt-1.5 w-full max-w-md rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              aria-label={q.label}
              value={String(answers[q.key] ?? 'unknown')}
              onChange={e => set(q.key, e.target.value as OutcomeAnswers[typeof q.key])}
            >
              {q.options.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        ))}
        <label className="block">
          <span className="text-sm font-medium text-slate-800">Notes (optional)</span>
          <textarea
            className="mt-1.5 w-full max-w-xl rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            rows={compact ? 2 : 3}
            aria-label="Outcome notes"
            value={answers.notes ?? ''}
            onChange={e => set('notes', e.target.value)}
            placeholder="What you learned, without inventing details."
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-800">Evidence link (optional)</span>
          <input
            className="mt-1.5 w-full max-w-xl rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            aria-label="Evidence URL"
            value={answers.evidence_url ?? ''}
            onChange={e => set('evidence_url', e.target.value)}
            placeholder="https://…"
          />
        </label>
        {!isSample && (
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={answers.contribute_to_learning !== false}
              onChange={e => set('contribute_to_learning', e.target.checked)}
            />
            <span>
              Contribute anonymized counts to improve recommendations for others.
              <span className="block text-xs text-slate-500">Never shares your notes, links, or technology names — only yes/no style totals.</span>
            </span>
          </label>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="primary" busy={busy} onClick={() => void submit()}>
          {saved ? 'Update outcomes' : 'Save outcomes'}
        </Button>
        <span className="text-xs text-slate-500">{answeredCount(answers)} of 5 signals recorded</span>
      </div>
      {error && <p className="mt-3 text-sm text-amber-800" role="alert">{error}</p>}
      {ok && <p className="mt-3 text-sm text-emerald-800" role="status">{ok}</p>}
    </div>
  );
}
