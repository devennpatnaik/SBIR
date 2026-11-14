import type { Lead } from "./types";

export function buildOutreachDraft(lead: Pick<Lead, "name" | "lab_name" | "inventors" | "agency" | "description">): string {
  const lab = lead.lab_name?.trim() || "the technology transfer office";
  const who = lead.inventors?.trim() ? ` (inventor(s): ${lead.inventors.trim()})` : "";
  const desc = lead.description?.trim() ?? "";
  return [
    `Subject: Evaluation license inquiry — ${lead.name}`,
    "",
    `Hello ${lab} team${who},`,
    "",
    "I am a commercializer exploring solutions for diabetic foot ulcers and chronic non-healing wounds.",
    `I came across “${lead.name}”${lead.agency ? ` (${lead.agency})` : ""} and would like to discuss a short evaluation license or research collaboration.`,
    "",
    desc
      ? `What drew my interest: ${desc.slice(0, 280)}${desc.length > 280 ? "…" : ""}`
      : "",
    "",
    "Could you share: (1) current licensing status, (2) the right contact for an evaluation agreement, and (3) any existing SBIR/STTR partner interest?",
    "",
    "Thank you — happy to send a one-page company background if useful.",
    "",
    "[Your name]",
    "[Your company / email]",
  ].join("\n");
}
