"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { LeadWithState } from "@/lib/types";

type Payload = {
  viewer: { name: string; email: string; simulated?: boolean };
  total: number;
  unpicked: LeadWithState[];
  acted: LeadWithState[];
};

export function PursueQueue() {
  const router = useRouter();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void fetch("/api/leads", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(res.status === 401 ? "Sign-in required." : "Could not load queue.");
        return res.json() as Promise<Payload>;
      })
      .then((payload) => {
        if (!alive) return;
        setData(payload);
        setSelected(payload.unpicked[0]?.id ?? payload.acted[0]?.id ?? null);
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : "Could not load queue.");
      });
    return () => {
      alive = false;
    };
  }, []);

  const all = useMemo(
    () => [...(data?.unpicked ?? []), ...(data?.acted ?? [])],
    [data],
  );
  const current = all.find((l) => l.id === selected) ?? null;

  if (error) return <p className="status-line" role="alert">{error}</p>;
  if (!data) return <p className="status-line" role="status">Loading the DFU queue…</p>;

  const renderRows = (items: LeadWithState[], badgeFallback: string) => (
    <ul className="pursue-rows" role="listbox" aria-label="Items you can pursue">
      {items.map((item, index) => {
        const on = item.id === selected;
        const badge =
          item.status === "unpicked"
            ? item.is_sample
              ? "Seed"
              : "Unpicked"
            : item.status === "progress"
              ? "Pursuing"
              : "Skipped";
        return (
          <li key={item.id} style={{ animationDelay: `${index * 30}ms` }}>
            <button
              type="button"
              role="option"
              aria-selected={on}
              className={`pursue-row${on ? " selected" : ""}`}
              onClick={() => setSelected(item.id)}
            >
              <span className="pursue-check" aria-hidden="true">
                {on ? "✓" : ""}
              </span>
              <span className="pursue-copy">
                <span className="pursue-meta">
                  <span className="pursue-badge">{badge || badgeFallback}</span>
                  <span className="pursue-score">{Math.round(item.promise)}</span>
                </span>
                <strong>{item.name}</strong>
                <small>
                  {[item.lab_name || item.source_name, item.agency, `Promise ${Math.round(item.promise)}`]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div>
      {data.viewer.simulated ? (
        <p className="status-line">Local preview uses a simulated viewer ({data.viewer.name}).</p>
      ) : null}
      <p className="pursue-rank-label" role="status">
        DFU / chronic wounds · ranked unpicked · {data.total} leads
      </p>
      {data.unpicked.length > 0 && (
        <section className="pursue-section">
          <h3 className="pursue-section-title">Unpicked</h3>
          {renderRows(data.unpicked, "Unpicked")}
        </section>
      )}
      {data.acted.length > 0 && (
        <section className="pursue-section">
          <h3 className="pursue-section-title">In progress / done</h3>
          {renderRows(data.acted, "Acted")}
        </section>
      )}
      {!all.length && <p className="status-line">No DFU leads yet.</p>}
      <div className="pursue-action">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!current}
          onClick={() => current && router.push(`/lead/${current.id}`)}
        >
          Open path cards →
        </button>
        {current ? <p className="pursue-hint">Selected: {current.name}</p> : null}
      </div>
    </div>
  );
}
