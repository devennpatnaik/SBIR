import { useEffect, useState } from 'react';
import { answersFromOutcome, emptyAnswers, type OutcomeAnswers } from '@project/learning';
import { invalidate } from '../lib/data';
import { fetchOutcome, saveOutcome } from '../lib/learning';
import { Button } from './ui';

/** Compact Layer 4: contacted / reply / interest for the DFU match loop. */
export function OutcomeLite({
  technologyId,
  projectId,
  isSample,
}: {
  technologyId: string;
  projectId?: string | null;
  isSample?: boolean;
}) {
  const [answers, setAnswers] = useState<OutcomeAnswers>(emptyAnswers());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void fetchOutcome(technologyId)
      .then(o => {
        if (!alive) return;
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

  const save = async () => {
    setBusy(true);
    setError('');
    setOk('');
    try {
      const outcome = await saveOutcome({
        technologyId,
        projectId: projectId ?? null,
        answers: { ...answers, contribute_to_learning: isSample ? false : answers.contribute_to_learning !== false },
      });
      setAnswers(answersFromOutcome(outcome));
      setOk('Saved. Pursued and skipped leads deprioritize in the DFU queue.');
      invalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading outcome…</p>;

  return (
    <section className="outcome-lite" aria-label="Log outreach outcome">
      <p className="eyebrow">OUTCOME · LITE</p>
      <h3>Log contact, reply, interest</h3>
      <p className="outcome-lite-lede">Three signals that matter for the match loop. Full Layer 4 lives under What happened.</p>
      <div className="outcome-lite-grid">
        <label>
          <span>Contacted / lab response</span>
          <select
            value={answers.lab_responded}
            onChange={e => setAnswers(a => ({ ...a, lab_responded: e.target.value as OutcomeAnswers['lab_responded'] }))}
          >
            <option value="unknown">Not yet known</option>
            <option value="pending">Outreach sent — waiting</option>
            <option value="yes">Reply received</option>
            <option value="no">No reply after follow-up</option>
          </select>
        </label>
        <label>
          <span>Customer / clinical interest</span>
          <select
            value={answers.customer_interest}
            onChange={e => setAnswers(a => ({ ...a, customer_interest: e.target.value as OutcomeAnswers['customer_interest'] }))}
          >
            <option value="unknown">Not yet known</option>
            <option value="none">No interest</option>
            <option value="weak">Some interest</option>
            <option value="strong">Strong interest</option>
          </select>
        </label>
        <label>
          <span>SBIR topic status</span>
          <select
            value={answers.sbir_award}
            onChange={e => setAnswers(a => ({ ...a, sbir_award: e.target.value as OutcomeAnswers['sbir_award'] }))}
          >
            <option value="unknown">Not yet known</option>
            <option value="not_pursued">Not pursuing SBIR</option>
            <option value="pending">Topic opened / drafting</option>
            <option value="yes">Award confirmed</option>
            <option value="no">Declined / not selected</option>
          </select>
        </label>
      </div>
      <label className="outcome-lite-notes">
        <span>Notes</span>
        <textarea
          rows={2}
          value={answers.notes ?? ''}
          onChange={e => setAnswers(a => ({ ...a, notes: e.target.value }))}
          placeholder="What happened — without inventing details."
        />
      </label>
      <div className="outcome-lite-actions">
        <Button variant="primary" busy={busy} onClick={() => void save()}>Save outcome</Button>
        {ok && <span className="ok">{ok}</span>}
        {error && <span className="err" role="alert">{error}</span>}
      </div>
    </section>
  );
}
