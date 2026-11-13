import { createHash } from "node:crypto";
import { sql } from "./db";
import { pathStatus, promiseScore, rankLeads } from "./rank";
import { DFU_LEADS } from "./seed-leads";
import type { Lead, LeadWithState, MatchPath, OutcomeInput } from "./types";

function leadId(name: string, agency: string): string {
  return createHash("sha256").update(`${name}|${agency}`).digest("hex").slice(0, 16);
}

export async function ensureSeeded(): Promise<number> {
  const existing = await sql<{ count: string }>("select count(*)::text as count from leads");
  const count = Number(existing[0]?.count ?? 0);
  if (count > 0) return count;

  for (const lead of DFU_LEADS) {
    const id = leadId(lead.name, lead.agency);
    await sql(
      `insert into leads (
        id, name, description, source_url, source_name, lab_name, agency, inventors,
        origin_kind, applications, customers, maturity, open_questions,
        sbir_topic_title, sbir_topic_url, sbir_topic_why, score_hint, is_sample
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,true
      ) on conflict (id) do nothing`,
      [
        id,
        lead.name,
        lead.description,
        lead.source_url,
        lead.source_name,
        lead.lab_name,
        lead.agency,
        lead.inventors,
        lead.origin_kind,
        lead.applications,
        lead.customers,
        lead.maturity,
        lead.open_questions,
        lead.sbir_topic_title,
        lead.sbir_topic_url,
        lead.sbir_topic_why,
        lead.score_hint,
      ],
    );
  }
  const after = await sql<{ count: string }>("select count(*)::text as count from leads");
  return Number(after[0]?.count ?? 0);
}

type Row = Lead & {
  match_path: string | null;
  match_acted_at: string | null;
  contacted: string | null;
  reply: string | null;
  interest: string | null;
  sbir_status: string | null;
  notes: string | null;
};

function toLeadWithState(row: Row): LeadWithState {
  const match_path = (row.match_path || "") as MatchPath;
  const contacted = row.contacted || "unknown";
  const reply = row.reply || "unknown";
  const interest = row.interest || "unknown";
  const promise = promiseScore({
    score_hint: row.score_hint,
    agency: row.agency,
    source_name: row.source_name,
    match_path,
    interest,
    reply,
  });
  return {
    ...row,
    match_path,
    match_acted_at: row.match_acted_at,
    contacted,
    reply,
    interest,
    sbir_status: row.sbir_status || "unknown",
    notes: row.notes || "",
    promise,
    status: pathStatus(match_path),
  };
}

export async function listLeadsForViewer(viewerSub: string): Promise<LeadWithState[]> {
  await ensureSeeded();
  const rows = await sql<Row>(
    `select l.*,
      coalesce(p.match_path, '') as match_path,
      p.match_acted_at,
      coalesce(o.contacted, 'unknown') as contacted,
      coalesce(o.reply, 'unknown') as reply,
      coalesce(o.interest, 'unknown') as interest,
      coalesce(o.sbir_status, 'unknown') as sbir_status,
      coalesce(o.notes, '') as notes
    from leads l
    left join viewer_paths p on p.lead_id = l.id and p.viewer_sub = $1
    left join viewer_outcomes o on o.lead_id = l.id and o.viewer_sub = $1
    order by l.score_hint desc, l.name asc`,
    [viewerSub],
  );
  return rankLeads(rows.map(toLeadWithState));
}

export async function getLeadForViewer(
  viewerSub: string,
  leadIdValue: string,
): Promise<LeadWithState | null> {
  await ensureSeeded();
  const rows = await sql<Row>(
    `select l.*,
      coalesce(p.match_path, '') as match_path,
      p.match_acted_at,
      coalesce(o.contacted, 'unknown') as contacted,
      coalesce(o.reply, 'unknown') as reply,
      coalesce(o.interest, 'unknown') as interest,
      coalesce(o.sbir_status, 'unknown') as sbir_status,
      coalesce(o.notes, '') as notes
    from leads l
    left join viewer_paths p on p.lead_id = l.id and p.viewer_sub = $1
    left join viewer_outcomes o on o.lead_id = l.id and o.viewer_sub = $1
    where l.id = $2`,
    [viewerSub, leadIdValue],
  );
  return rows[0] ? toLeadWithState(rows[0]) : null;
}

export async function setPath(
  viewerSub: string,
  leadIdValue: string,
  matchPath: Exclude<MatchPath, "">,
): Promise<LeadWithState | null> {
  await sql(
    `insert into viewer_paths (viewer_sub, lead_id, match_path, match_acted_at)
     values ($1, $2, $3, now())
     on conflict (viewer_sub, lead_id) do update set
       match_path = excluded.match_path,
       match_acted_at = excluded.match_acted_at`,
    [viewerSub, leadIdValue, matchPath],
  );

  const defaults =
    matchPath === "outreach"
      ? { contacted: "pending", reply: "unknown", interest: "unknown", sbir_status: "unknown", notes: "Path: inventor/TTO outreach draft prepared." }
      : matchPath === "sbir_topic"
        ? { contacted: "unknown", reply: "unknown", interest: "unknown", sbir_status: "pending", notes: "Path: opened SBIR topic stub." }
        : { contacted: "unknown", reply: "unknown", interest: "none", sbir_status: "not_pursued", notes: "Path: skipped — not a fit right now." };

  await sql(
    `insert into viewer_outcomes (viewer_sub, lead_id, contacted, reply, interest, sbir_status, notes, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, now())
     on conflict (viewer_sub, lead_id) do update set
       contacted = excluded.contacted,
       reply = excluded.reply,
       interest = excluded.interest,
       sbir_status = excluded.sbir_status,
       notes = excluded.notes,
       updated_at = now()`,
    [
      viewerSub,
      leadIdValue,
      defaults.contacted,
      defaults.reply,
      defaults.interest,
      defaults.sbir_status,
      defaults.notes,
    ],
  );

  return getLeadForViewer(viewerSub, leadIdValue);
}

export async function setOutcome(
  viewerSub: string,
  leadIdValue: string,
  input: OutcomeInput,
): Promise<LeadWithState | null> {
  const current = await getLeadForViewer(viewerSub, leadIdValue);
  if (!current) return null;

  await sql(
    `insert into viewer_outcomes (viewer_sub, lead_id, contacted, reply, interest, sbir_status, notes, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, now())
     on conflict (viewer_sub, lead_id) do update set
       contacted = excluded.contacted,
       reply = excluded.reply,
       interest = excluded.interest,
       sbir_status = excluded.sbir_status,
       notes = excluded.notes,
       updated_at = now()`,
    [
      viewerSub,
      leadIdValue,
      input.contacted ?? current.contacted,
      input.reply ?? current.reply,
      input.interest ?? current.interest,
      input.sbir_status ?? current.sbir_status,
      input.notes ?? current.notes,
    ],
  );

  return getLeadForViewer(viewerSub, leadIdValue);
}
