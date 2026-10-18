import { useEffect, useState } from 'react';
import type { CohortInsights } from '@project/learning';
import { fetchInsights } from '../lib/learning';
import { Button, Empty, Input, PageHeader } from '../components/ui';

/** Simple anonymized view of Layer 4 cohort evidence. */
export function Insights() {
  const [agency, setAgency] = useState('');
  const [category, setCategory] = useState('');
  const [insights, setInsights] = useState<CohortInsights | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    setError('');
    try {
      setInsights(await fetchInsights(agency.trim(), category.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load insights.');
      setInsights(null);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader
        title="What similar cases show"
        subtitle="Anonymized outcomes from investigations people chose to share. Sample technologies never enter this pool. Compare uses these counts once enough cases exist."
      />
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <label className="text-sm">Agency filter
          <Input className="mt-1" value={agency} onChange={e => setAgency(e.target.value)} placeholder="any" />
        </label>
        <label className="text-sm">Category filter
          <Input className="mt-1" value={category} onChange={e => setCategory(e.target.value)} placeholder="any" />
        </label>
        <Button variant="primary" busy={busy} onClick={() => void load()}>Refresh</Button>
      </div>
      {error && <p className="mb-4 text-sm text-red-700" role="alert">{error}</p>}
      {!insights ? (
        <Empty title="No insights yet">Record real outcomes on a technology page under What happened.</Empty>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            <strong>{insights.sampleSize}</strong> contributing cases
            {insights.sampleSize < 3
              ? ' — recommendations stay unadjusted until at least 3 similar cases exist.'
              : ' — Compare may nudge inventiveness / commercialization scores within ±12.'}
          </p>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Stat label="Lab replied" value={`${insights.labRespondedYes} yes · ${insights.labRespondedNo} no`} />
            <Stat label="License available" value={`${insights.licenseAvailableYes} yes · ${insights.licenseAvailableNo} no`} />
            <Stat label="Technical DD" value={`${insights.techDdPassed} passed · ${insights.techDdFailed} failed`} />
            <Stat label="SBIR/STTR award" value={`${insights.sbirAwardYes} yes · ${insights.sbirAwardNo} no`} />
            <Stat label="Customer interest" value={`${insights.customerInterestStrong} strong · ${insights.customerInterestWeak} weak · ${insights.customerInterestNone} none`} />
          </dl>
          <p className="text-xs text-slate-500">
            How evidence feeds quality: positive lab response, license availability, DD pass, awards, and strong customer interest each add a small bounded boost; negatives subtract. Your own scores remain the base — this only adjusts ranking when the cohort is large enough.
            Demo / sample technologies never enter these counts.
          </p>
          {insights.sampleSize === 0 && (
            <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/60 px-4 py-3 text-sm text-amber-950">
              <p className="font-medium">Example (SAMPLE — not live cohort data)</p>
              <p className="mt-1 text-xs leading-relaxed">
                In a fictional set of 12 water-sensor investigations: lab replies ~60% when known, licenses available ~40%,
                technical DD pass ~55%, SBIR awards ~25% of decided cases, strong customer interest ~30%.
                Use the Demo company to practice Compare and What happened; those outcomes stay labeled sample and do not pollute this pool.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}
