"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildOutreachDraft } from "@/lib/outreach";
import type { LeadWithState, MatchPath } from "@/lib/types";

export function LeadWorkspace({ leadId }: { leadId: string }) {
  const [lead, setLead] = useState<LeadWithState | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<MatchPath | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState("");

  const reload = async () => {
    const res = await fetch(`/api/leads/${leadId}`, { cache: "no-store" });
    if (!res.ok) throw new Error(res.status === 404 ? "Lead not found." : "Could not load lead.");
    const payload = (await res.json()) as { lead: LeadWithState };
    setLead(payload.lead);
  };

  useEffect(() => {
    let alive = true;
    void reload()
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : "Could not load lead.");
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const act = async (path: Exclude<MatchPath, "">) => {
    setBusy(path);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/leads/${leadId}/path`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ match_path: path }),
      });
      if (!res.ok) throw new Error("Could not save path choice.");
      const payload = (await res.json()) as { lead: LeadWithState };
      setLead(payload.lead);
      if (path === "outreach") {
        setMessage("Outreach path logged. Copy the draft, send it yourself, then update reply/interest below.");
      } else if (path === "sbir_topic") {
        setMessage("SBIR topic path logged. Confirm the live solicitation before writing anything.");
        if (payload.lead.sbir_topic_url) {
          window.open(payload.lead.sbir_topic_url, "_blank", "noopener,noreferrer");
        }
      } else {
        setMessage("Skipped. This lead drops out of the unpicked queue.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save path choice.");
    } finally {
      setBusy(null);
    }
  };

  const copyDraft = async () => {
    if (!lead) return;
    try {
      await navigator.clipboard.writeText(buildOutreachDraft(lead));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Clipboard unavailable — select the draft and copy manually.");
    }
  };

  const saveOutcome = async () => {
    if (!lead) return;
    setSaving(true);
    setOk("");
    setError("");
    try {
      const res = await fetch(`/api/leads/${leadId}/outcome`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contacted: lead.contacted,
          reply: lead.reply,
          interest: lead.interest,
          sbir_status: lead.sbir_status,
          notes: lead.notes,
        }),
      });
      if (!res.ok) throw new Error("Could not save outcome.");
      const payload = (await res.json()) as { lead: LeadWithState };
      setLead(payload.lead);
      setOk("Saved. Pursued and skipped leads deprioritize in the DFU queue.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  if (error && !lead) return <p className="status-line" role="alert">{error}</p>;
  if (!lead) return <p className="status-line" role="status">Loading lead…</p>;

  const draft = buildOutreachDraft(lead);
  const chosen = lead.match_path;

  return (
    <div>
      <Link href="/queue" className="back-link">← Back to pursue queue</Link>
      <div className="lead-head">
        <p className="eyebrow">MATCH → ACT</p>
        <h1>{lead.name}</h1>
        <p className="lead-meta">
          {[lead.lab_name, lead.agency, `Promise ${Math.round(lead.promise)}`, lead.maturity]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <section className="path-cards" aria-label="Commercialization path cards">
        <div className="path-cards-head">
          <h2>Pick exactly one path</h2>
          <p>Outreach draft, matching SBIR/STTR topic, or skip. No wizard — one next move.</p>
        </div>
        <div className="path-card-grid">
          <article className={`path-card${chosen === "outreach" ? " chosen" : ""}`}>
            <div className="path-num" aria-hidden="true">1</div>
            <h3>Inventor / TTO outreach</h3>
            <p>Draft a short evaluation-license or collaboration email. You send it yourself.</p>
            <pre className="path-draft">{draft}</pre>
            <div className="path-card-actions">
              <button type="button" className="btn btn-ghost" onClick={() => void copyDraft()}>
                {copied ? "Copied" : "Copy draft"}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy === "outreach"}
                onClick={() => void act("outreach")}
              >
                Use this path
              </button>
            </div>
          </article>

          <article className={`path-card${chosen === "sbir_topic" ? " chosen" : ""}`}>
            <div className="path-num" aria-hidden="true">2</div>
            <h3>Matching SBIR/STTR topic</h3>
            <p><strong>{lead.sbir_topic_title}</strong></p>
            <p>{lead.sbir_topic_why}</p>
            <p>Stub only — verify the live solicitation. No Phase I–III wizard.</p>
            <div className="path-card-actions">
              <a className="path-ext" href={lead.sbir_topic_url} target="_blank" rel="noreferrer">
                Open topic portal ↗
              </a>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy === "sbir_topic"}
                onClick={() => void act("sbir_topic")}
              >
                Use this path
              </button>
            </div>
          </article>

          <article className={`path-card skip${chosen === "skip" ? " chosen" : ""}`}>
            <div className="path-num" aria-hidden="true">3</div>
            <h3>Skip / not a fit</h3>
            <p>Archive this lead so the ranked queue stays clean for better DFU matches.</p>
            <div className="path-card-actions">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busy === "skip"}
                onClick={() => void act("skip")}
              >
                Skip this lead
              </button>
            </div>
          </article>
        </div>
        {error ? <p className="path-msg error" role="alert">{error}</p> : null}
        {message ? <p className="path-msg ok" role="status">{message}</p> : null}
      </section>

      <section className="outcome-lite" aria-label="Log outreach outcome">
        <p className="eyebrow">OUTCOME · LITE</p>
        <h2>Log contact, reply, interest</h2>
        <p className="outcome-lite-lede">
          Three signals that matter for the match loop. Sample seed data is local until you publish.
        </p>
        <div className="outcome-lite-grid">
          <label>
            <span>Contacted</span>
            <select
              value={lead.contacted}
              onChange={(e) => setLead({ ...lead, contacted: e.target.value })}
            >
              <option value="unknown">Not yet known</option>
              <option value="pending">Outreach sent — waiting</option>
              <option value="yes">Contact confirmed</option>
              <option value="no">Could not reach</option>
            </select>
          </label>
          <label>
            <span>Reply</span>
            <select
              value={lead.reply}
              onChange={(e) => setLead({ ...lead, reply: e.target.value })}
            >
              <option value="unknown">Not yet known</option>
              <option value="pending">Waiting on reply</option>
              <option value="yes">Reply received</option>
              <option value="no">No reply after follow-up</option>
            </select>
          </label>
          <label>
            <span>Interest</span>
            <select
              value={lead.interest}
              onChange={(e) => setLead({ ...lead, interest: e.target.value })}
            >
              <option value="unknown">Not yet known</option>
              <option value="none">No interest</option>
              <option value="weak">Some interest</option>
              <option value="strong">Strong interest</option>
            </select>
          </label>
        </div>
        <label className="outcome-lite-notes" style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 500 }}>SBIR topic status</span>
          <select
            value={lead.sbir_status}
            onChange={(e) => setLead({ ...lead, sbir_status: e.target.value })}
            style={{ maxWidth: 320 }}
          >
            <option value="unknown">Not yet known</option>
            <option value="not_pursued">Not pursuing SBIR</option>
            <option value="pending">Topic opened / drafting</option>
            <option value="yes">Award confirmed</option>
            <option value="no">Declined / not selected</option>
          </select>
        </label>
        <label className="outcome-lite-notes">
          <span>Notes</span>
          <textarea
            rows={2}
            value={lead.notes}
            onChange={(e) => setLead({ ...lead, notes: e.target.value })}
            placeholder="What happened — without inventing details."
          />
        </label>
        <div className="outcome-lite-actions">
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void saveOutcome()}>
            Save outcome
          </button>
          {ok ? <span className="ok">{ok}</span> : null}
        </div>
      </section>
    </div>
  );
}
