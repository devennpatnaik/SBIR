import type { LeadWithState, MatchPath, PursueStatus } from "./types";

export function pathStatus(matchPath: MatchPath): PursueStatus {
  if (matchPath === "skip") return "done";
  if (matchPath === "outreach" || matchPath === "sbir_topic") return "progress";
  return "unpicked";
}

export function promiseScore(lead: {
  score_hint: number;
  agency: string;
  source_name: string;
  match_path: MatchPath;
  interest?: string;
  reply?: string;
}): number {
  let score = lead.score_hint || 50;
  if (/va|nih|dod/i.test(lead.agency || "")) score += 4;
  if (/pubmed/i.test(lead.source_name || "")) score += 2;
  if (lead.match_path === "outreach" || lead.match_path === "sbir_topic") score -= 8;
  if (lead.match_path === "skip") score -= 40;
  if (lead.interest === "strong") score += 6;
  if (lead.interest === "none") score -= 12;
  if (lead.reply === "no") score -= 10;
  if (lead.reply === "yes") score += 4;
  return Math.max(0, Math.min(100, score));
}

export function rankLeads<T extends { status: PursueStatus; promise: number }>(rows: T[]): T[] {
  const order: Record<PursueStatus, number> = { unpicked: 0, progress: 1, done: 2 };
  return [...rows].sort((a, b) => {
    const s = order[a.status] - order[b.status];
    if (s !== 0) return s;
    return b.promise - a.promise;
  });
}

export function splitSections(ranked: LeadWithState[]): {
  unpicked: LeadWithState[];
  acted: LeadWithState[];
} {
  return {
    unpicked: ranked.filter((r) => r.status === "unpicked"),
    acted: ranked.filter((r) => r.status !== "unpicked"),
  };
}
