-- Core data model for the federal-lab-to-SBIR commercialization workflow.
-- Every row belongs to the signed-in end user (user_id = auth.user_id()).

CREATE TABLE labs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT auth.user_id(),
  name text NOT NULL,
  agency text NOT NULL DEFAULT '',
  tto_name text NOT NULL DEFAULT '',
  tto_url text NOT NULL DEFAULT '',
  tto_email text NOT NULL DEFAULT '',
  tto_phone text NOT NULL DEFAULT '',
  agreement_types_offered text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  source_url text NOT NULL DEFAULT '',
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE technologies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT auth.user_id(),
  lab_id uuid REFERENCES labs (id) ON DELETE SET NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  source_url text NOT NULL DEFAULT '',
  source_name text NOT NULL DEFAULT '',
  lab_name text NOT NULL DEFAULT '',
  agency text NOT NULL DEFAULT '',
  inventors text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  applications text NOT NULL DEFAULT '',
  customers text NOT NULL DEFAULT '',
  competitors text NOT NULL DEFAULT '',
  maturity text NOT NULL DEFAULT '',
  ip_info text NOT NULL DEFAULT '',
  patent_numbers text NOT NULL DEFAULT '',
  licensing_status text NOT NULL DEFAULT 'unknown'
    CHECK (licensing_status IN ('unknown', 'available_unverified', 'available_verified', 'partially_licensed', 'licensed', 'not_available')),
  licensing_status_source text NOT NULL DEFAULT '',
  sbir_relevance text NOT NULL DEFAULT '',
  open_questions text NOT NULL DEFAULT '',
  source_text text NOT NULL DEFAULT '',
  source_fetched_at timestamptz,
  shortlisted boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  is_sample boolean NOT NULL DEFAULT false,
  last_reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX technologies_user_idx ON technologies (user_id, created_at DESC);

CREATE TABLE evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT auth.user_id(),
  technology_id uuid NOT NULL REFERENCES technologies (id) ON DELETE CASCADE,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  weights jsonb NOT NULL DEFAULT '{}'::jsonb,
  assumptions text NOT NULL DEFAULT '',
  missing_info text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (technology_id)
);

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT auth.user_id(),
  technology_id uuid NOT NULL REFERENCES technologies (id) ON DELETE CASCADE,
  lab_id uuid REFERENCES labs (id) ON DELETE SET NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'technology_selected' CHECK (status IN (
    'technology_selected', 'validating_opportunity', 'investigating_licensing', 'licensing_discussions',
    'agreement_in_progress', 'evaluating_funding', 'proposal_in_preparation', 'proposal_submitted',
    'funding_decision_pending', 'funded_development', 'product_validation', 'ongoing_commercialization')),
  application_summary text NOT NULL DEFAULT '',
  business_thesis text NOT NULL DEFAULT '',
  target_customer text NOT NULL DEFAULT '',
  problem text NOT NULL DEFAULT '',
  licensing_status text NOT NULL DEFAULT 'not_started' CHECK (licensing_status IN (
    'not_started', 'researching', 'contacted_tto', 'in_discussion', 'application_submitted',
    'negotiating', 'license_signed_confirmed', 'not_available')),
  licensing_pathway text NOT NULL DEFAULT 'undecided' CHECK (licensing_pathway IN (
    'undecided', 'evaluation_license', 'option', 'nonexclusive_license', 'exclusive_license', 'crada', 'other')),
  licensing_pathway_notes text NOT NULL DEFAULT '',
  risks text NOT NULL DEFAULT '',
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX projects_one_per_technology ON projects (user_id, technology_id);

CREATE TABLE status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT auth.user_id(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT auth.user_id(),
  lab_id uuid REFERENCES labs (id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects (id) ON DELETE CASCADE,
  technology_id uuid REFERENCES technologies (id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL DEFAULT '',
  organization text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  source_url text NOT NULL DEFAULT '',
  verified_at timestamptz,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT auth.user_id(),
  agency text NOT NULL DEFAULT '',
  branch text NOT NULL DEFAULT '',
  program text NOT NULL DEFAULT 'SBIR' CHECK (program IN ('SBIR', 'STTR', 'SBIR/STTR', 'Other')),
  solicitation_title text NOT NULL DEFAULT '',
  solicitation_number text NOT NULL DEFAULT '',
  topic_number text NOT NULL DEFAULT '',
  topic_title text NOT NULL,
  source_url text NOT NULL DEFAULT '',
  phase text NOT NULL DEFAULT '',
  award_type text NOT NULL DEFAULT '',
  technical_objective text NOT NULL DEFAULT '',
  eligibility text NOT NULL DEFAULT '',
  open_date date,
  close_date date,
  deadline_verified boolean NOT NULL DEFAULT false,
  deadline_source_url text NOT NULL DEFAULT '',
  deadline_checked_at timestamptz,
  award_amount text NOT NULL DEFAULT '',
  duration text NOT NULL DEFAULT '',
  required_work text NOT NULL DEFAULT '',
  required_documents text NOT NULL DEFAULT '',
  submission_system text NOT NULL DEFAULT '',
  small_business_reqs text NOT NULL DEFAULT '',
  research_institution_reqs text NOT NULL DEFAULT '',
  restrictions text NOT NULL DEFAULT '',
  relevance text NOT NULL DEFAULT 'unreviewed' CHECK (relevance IN ('unreviewed', 'relevant', 'maybe', 'irrelevant')),
  fit_notes text NOT NULL DEFAULT '',
  source_text text NOT NULL DEFAULT '',
  is_sample boolean NOT NULL DEFAULT false,
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE project_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT auth.user_id(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES opportunities (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'considering' CHECK (status IN ('considering', 'pursuing', 'rejected')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, opportunity_id)
);

CREATE TABLE proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT auth.user_id(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES opportunities (id) ON DELETE CASCADE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'drafting', 'internal_review', 'ready_to_submit', 'submitted_confirmed', 'withdrawn')),
  submitted_confirmed_at timestamptz,
  submission_reference text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, opportunity_id)
);

CREATE TABLE proposal_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT auth.user_id(),
  proposal_id uuid NOT NULL REFERENCES proposals (id) ON DELETE CASCADE,
  title text NOT NULL,
  kind text NOT NULL DEFAULT 'section' CHECK (kind IN ('section', 'document', 'certification', 'evidence')),
  required_status text NOT NULL DEFAULT 'confirm_in_solicitation' CHECK (required_status IN ('confirmed_required', 'confirm_in_solicitation', 'optional', 'not_required')),
  solicitation_reference text NOT NULL DEFAULT '',
  guidance text NOT NULL DEFAULT '',
  draft text NOT NULL DEFAULT '',
  draft_is_ai_generated boolean NOT NULL DEFAULT false,
  evidence_needed text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'drafting', 'needs_evidence', 'complete')),
  sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT auth.user_id(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  proposal_id uuid REFERENCES proposals (id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES opportunities (id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  area text NOT NULL DEFAULT 'general' CHECK (area IN ('general', 'validation', 'licensing', 'funding', 'proposal', 'commercialization')),
  kind text NOT NULL DEFAULT 'task' CHECK (kind IN ('task', 'milestone')),
  roadmap_category text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'blocked', 'done', 'skipped')),
  priority integer NOT NULL DEFAULT 2,
  due_date date,
  depends_on uuid REFERENCES tasks (id) ON DELETE SET NULL,
  blocker text NOT NULL DEFAULT '',
  evidence text NOT NULL DEFAULT '',
  created_by text NOT NULL DEFAULT 'user' CHECK (created_by IN ('user', 'template', 'assistant')),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tasks_project_idx ON tasks (project_id, status);

CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT auth.user_id(),
  project_id uuid REFERENCES projects (id) ON DELETE CASCADE,
  technology_id uuid REFERENCES technologies (id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES opportunities (id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'question' CHECK (kind IN ('question', 'risk', 'eligibility', 'assumption')),
  area text NOT NULL DEFAULT 'general',
  text text NOT NULL,
  answer text NOT NULL DEFAULT '',
  answer_source_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
  blocking boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz
);

CREATE TABLE licensing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT auth.user_id(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  topic text NOT NULL,
  question text NOT NULL,
  explainer text NOT NULL DEFAULT '',
  finding text NOT NULL DEFAULT '',
  source_url text NOT NULL DEFAULT '',
  confidence text NOT NULL DEFAULT 'unknown' CHECK (confidence IN ('unknown', 'hypothesis', 'sourced', 'verified')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'answered')),
  sort integer NOT NULL DEFAULT 0,
  verified_at timestamptz,
  UNIQUE (project_id, topic)
);

CREATE TABLE agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT auth.user_id(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  agreement_type text NOT NULL CHECK (agreement_type IN ('evaluation_license', 'option', 'nonexclusive_license', 'exclusive_license', 'crada', 'nda', 'other')),
  status text NOT NULL DEFAULT 'considering' CHECK (status IN ('considering', 'requested', 'application_submitted', 'negotiating', 'executed_confirmed', 'declined', 'abandoned')),
  counterparty text NOT NULL DEFAULT '',
  key_terms text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT auth.user_id(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts (id) ON DELETE SET NULL,
  area text NOT NULL DEFAULT 'licensing',
  direction text NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound', 'note')),
  channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'phone', 'meeting', 'web_form', 'other')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sent_by_user', 'received', 'logged')),
  to_address text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  occurred_at timestamptz,
  follow_up_date date,
  response_summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT auth.user_id(),
  project_id uuid REFERENCES projects (id) ON DELETE CASCADE,
  technology_id uuid REFERENCES technologies (id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES opportunities (id) ON DELETE CASCADE,
  proposal_section_id uuid REFERENCES proposal_sections (id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'note' CHECK (kind IN ('note', 'source_text', 'research', 'interview', 'correspondence', 'technical_evidence', 'solicitation', 'legal', 'file', 'ai_summary')),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  upload_id uuid,
  source_url text NOT NULL DEFAULT '',
  is_ai_generated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT auth.user_id(),
  technology_id uuid REFERENCES technologies (id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects (id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES opportunities (id) ON DELETE CASCADE,
  claim text NOT NULL,
  field text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  evidence_level text NOT NULL DEFAULT 'sourced' CHECK (evidence_level IN ('verified', 'sourced', 'estimate', 'hypothesis')),
  excerpt text NOT NULL DEFAULT '',
  checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT auth.user_id(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  interviewee text NOT NULL,
  organization text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT '',
  segment text NOT NULL DEFAULT '',
  interview_date date,
  problem_confirmed text NOT NULL DEFAULT 'unclear' CHECK (problem_confirmed IN ('yes', 'partly', 'no', 'unclear')),
  willingness_to_pay text NOT NULL DEFAULT '',
  current_solution text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  key_quotes text NOT NULL DEFAULT '',
  next_step text NOT NULL DEFAULT '',
  pilot_interest boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Row level security: every table is private to its owner.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'labs', 'technologies', 'evaluations', 'projects', 'status_history', 'contacts', 'opportunities',
    'project_opportunities', 'proposals', 'proposal_sections', 'tasks', 'questions', 'licensing_items',
    'agreements', 'communications', 'documents', 'sources', 'interviews'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY own_select ON %I FOR SELECT TO authenticated USING (user_id = auth.user_id())', t);
    EXECUTE format('CREATE POLICY own_insert ON %I FOR INSERT TO authenticated WITH CHECK (user_id = auth.user_id())', t);
    EXECUTE format('CREATE POLICY own_update ON %I FOR UPDATE TO authenticated USING (user_id = auth.user_id()) WITH CHECK (user_id = auth.user_id())', t);
    EXECUTE format('CREATE POLICY own_delete ON %I FOR DELETE TO authenticated USING (user_id = auth.user_id())', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO authenticated', t);
  END LOOP;
END $$;

GRANT USAGE ON SCHEMA public TO authenticated;
