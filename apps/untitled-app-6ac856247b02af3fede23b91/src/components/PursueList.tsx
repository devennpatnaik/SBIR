import { useEffect, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from './ui';

export type PursueItem = {
  id: string;
  title: string;
  note: string;
  actionLabel?: string;
  onPursue: () => void;
  badge?: string;
  scoreLabel?: string;
};

/** Select one row from a ranked list, then take a single primary action. */
export function PursueList({
  unpicked,
  acted,
  empty,
  pursueLabel = 'Pursue',
  rankLabel = 'Ranked: most promising unpicked',
}: {
  unpicked: PursueItem[];
  acted?: PursueItem[];
  empty?: React.ReactNode;
  pursueLabel?: string;
  rankLabel?: string;
}) {
  const all = [...unpicked, ...(acted ?? [])];
  const [selected, setSelected] = useState<string | null>(unpicked[0]?.id ?? all[0]?.id ?? null);
  useEffect(() => {
    if (!all.some(i => i.id === selected)) {
      setSelected(unpicked[0]?.id ?? all[0]?.id ?? null);
    }
  }, [all.map(i => i.id).join('|'), unpicked[0]?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const current = all.find(i => i.id === selected) ?? null;

  if (!all.length) {
    return <div className="pursue-empty">{empty ?? <p className="text-sm text-slate-500">Nothing to pursue yet.</p>}</div>;
  }

  const renderRows = (items: PursueItem[]) => (
    <ul className="pursue-rows" role="listbox" aria-label="Items you can pursue">
      {items.map(item => {
        const on = item.id === selected;
        return (
          <li key={item.id}>
            <button
              type="button"
              role="option"
              aria-selected={on}
              className={`pursue-row${on ? ' selected' : ''}`}
              onClick={() => setSelected(item.id)}
            >
              <span className="pursue-check" aria-hidden="true">{on ? <Check size={16} /> : null}</span>
              <span className="pursue-copy">
                <span className="pursue-meta">
                  {item.badge && <span className="pursue-badge">{item.badge}</span>}
                  {item.scoreLabel && <span className="pursue-score">{item.scoreLabel}</span>}
                </span>
                <strong>{item.title}</strong>
                <small>{item.note}</small>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="pursue-list">
      <p className="pursue-rank-label" role="status">{rankLabel}</p>
      {unpicked.length > 0 && (
        <section className="pursue-section">
          <h3 className="pursue-section-title">Unpicked</h3>
          {renderRows(unpicked)}
        </section>
      )}
      {(acted?.length ?? 0) > 0 && (
        <section className="pursue-section acted">
          <h3 className="pursue-section-title">In progress / done</h3>
          {renderRows(acted!)}
        </section>
      )}
      <div className="pursue-action">
        <Button variant="primary" disabled={!current} onClick={() => current?.onPursue()}>
          {current?.actionLabel ?? pursueLabel} <ArrowRight size={16} />
        </Button>
        {current && <p className="pursue-hint">Selected: {current.title}</p>}
      </div>
    </div>
  );
}
