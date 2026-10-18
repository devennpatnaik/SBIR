export type Technology = {
  id: string; user_id: string; lab_id: string | null; name: string; description: string; source_url: string; source_name: string;
  lab_name: string; agency: string; inventors: string; category: string; applications: string; customers: string; competitors: string;
  maturity: string; ip_info: string; patent_numbers: string; licensing_status: string; licensing_status_source: string;
  sbir_relevance: string; open_questions: string; source_text: string; source_fetched_at: string | null; shortlisted: boolean;
  archived: boolean; is_sample: boolean; last_reviewed_at: string | null; created_at: string; updated_at: string;
  origin_kind?: string; patent_key?: string; patent_status?: string; patent_expires?: string | null; patent_assignee?: string; patent_country?: string;
};
export type ScoreEntry = { score: number | null; rationale: string; evidence: string; confidence: 'low' | 'medium' | 'high' };
export type Evaluation = {
  id: string; technology_id: string; scores: Record<string, ScoreEntry>; weights: Record<string, number>;
  assumptions: string; missing_info: string; updated_at: string;
};
export type Lab = {
  id: string; name: string; agency: string; tto_name: string; tto_url: string; tto_email: string; tto_phone: string;
  agreement_types_offered: string; notes: string; source_url: string; verified_at: string | null;
};
export type Project = {
  intake_key?: string | null; kickoff_answers?: Record<string,unknown>;
  id: string; technology_id: string; lab_id: string | null; name: string; status: string; application_summary: string;
  business_thesis: string; target_customer: string; problem: string; licensing_status: string; licensing_pathway: string;
  licensing_pathway_notes: string; risks: string; archived: boolean; created_at: string; updated_at: string;
};
export type StatusHistory = { id: string; project_id: string; from_status: string | null; to_status: string; reason: string; created_at: string };
export type Task = {
  id: string; project_id: string; proposal_id: string | null; opportunity_id: string | null; title: string; description: string;
  area: string; kind: 'task' | 'milestone'; roadmap_category: string; status: string; priority: number; due_date: string | null;
  depends_on: string | null; blocker: string; evidence: string; created_by: string; completed_at: string | null; created_at: string;
};
export type Question = {
  id: string; project_id: string | null; technology_id: string | null; opportunity_id: string | null; kind: string; area: string;
  text: string; answer: string; answer_source_url: string; status: string; blocking: boolean; created_at: string; answered_at: string | null;
};
export type Contact = {
  id: string; lab_id: string | null; project_id: string | null; technology_id: string | null; name: string; role: string;
  organization: string; email: string; phone: string; source_url: string; verified_at: string | null; notes: string; created_at: string;
};
export type LicensingItem = {
  id: string; project_id: string; topic: string; question: string; explainer: string; finding: string; source_url: string;
  confidence: string; status: string; sort: number; verified_at: string | null;
};
export type Agreement = {
  id: string; project_id: string; agreement_type: string; status: string; counterparty: string; key_terms: string; notes: string;
  status_date: string | null; created_at: string;
};
export type Communication = {
  id: string; project_id: string; contact_id: string | null; area: string; direction: string; channel: string; status: string;
  to_address: string; subject: string; body: string; occurred_at: string | null; follow_up_date: string | null;
  response_summary: string; created_at: string;
};
export type Opportunity = {
  id: string; agency: string; branch: string; program: string; solicitation_title: string; solicitation_number: string;
  topic_number: string; topic_title: string; source_url: string; phase: string; award_type: string; technical_objective: string;
  eligibility: string; open_date: string | null; close_date: string | null; deadline_verified: boolean; deadline_source_url: string;
  deadline_checked_at: string | null; award_amount: string; duration: string; required_work: string; required_documents: string;
  submission_system: string; small_business_reqs: string; research_institution_reqs: string; restrictions: string;
  relevance: string; fit_notes: string; source_text: string; is_sample: boolean; last_checked_at: string | null; created_at: string;
};
export type ProjectOpportunity = { id: string; project_id: string; opportunity_id: string; status: string; notes: string; created_at: string };
export type Proposal = {
  id: string; project_id: string; opportunity_id: string; title: string; status: string; submitted_confirmed_at: string | null;
  submission_reference: string; notes: string; created_at: string;
};
export type ProposalSection = {
  id: string; proposal_id: string; title: string; kind: string; required_status: string; solicitation_reference: string;
  guidance: string; draft: string; draft_is_ai_generated: boolean; evidence_needed: string; status: string; sort: number; updated_at: string;
};
export type Doc = {
  id: string; project_id: string | null; technology_id: string | null; opportunity_id: string | null; proposal_section_id: string | null;
  kind: string; title: string; body: string; upload_id: string | null; source_url: string; is_ai_generated: boolean; created_at: string; updated_at: string;
};
export type Source = {
  id: string; technology_id: string | null; project_id: string | null; opportunity_id: string | null; claim: string; field: string;
  url: string; evidence_level: string; excerpt: string; checked_at: string; created_at: string;
};
export type Interview = {
  id: string; project_id: string; interviewee: string; organization: string; role: string; segment: string; interview_date: string | null;
  problem_confirmed: string; willingness_to_pay: string; current_solution: string; notes: string; key_quotes: string; next_step: string;
  pilot_interest: boolean; created_at: string;
};
export type ProgramTracking = {
  id: string; project_id: string | null; program_id: string; status: string; notes: string; task_id: string | null; created_at: string; updated_at: string;
};
