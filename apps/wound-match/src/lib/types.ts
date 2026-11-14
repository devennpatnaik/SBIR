export type MatchPath = "" | "outreach" | "sbir_topic" | "skip";

export type PursueStatus = "unpicked" | "progress" | "done";

export type Lead = {
  id: string;
  name: string;
  description: string;
  source_url: string;
  source_name: string;
  lab_name: string;
  agency: string;
  inventors: string;
  origin_kind: string;
  applications: string;
  customers: string;
  maturity: string;
  open_questions: string;
  sbir_topic_title: string;
  sbir_topic_url: string;
  sbir_topic_why: string;
  score_hint: number;
  is_sample: boolean;
};

export type LeadWithState = Lead & {
  match_path: MatchPath;
  match_acted_at: string | null;
  contacted: string;
  reply: string;
  interest: string;
  sbir_status: string;
  notes: string;
  promise: number;
  status: PursueStatus;
};

export type OutcomeInput = {
  contacted?: string;
  reply?: string;
  interest?: string;
  sbir_status?: string;
  notes?: string;
};
