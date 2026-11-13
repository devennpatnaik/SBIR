-- DFU / chronic wounds match loop: shared lead catalog + per-viewer path & outcome.

CREATE TABLE IF NOT EXISTS leads (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  source_url text NOT NULL DEFAULT '',
  source_name text NOT NULL DEFAULT '',
  lab_name text NOT NULL DEFAULT '',
  agency text NOT NULL DEFAULT '',
  inventors text NOT NULL DEFAULT '',
  origin_kind text NOT NULL DEFAULT 'other',
  applications text NOT NULL DEFAULT '',
  customers text NOT NULL DEFAULT '',
  maturity text NOT NULL DEFAULT '',
  open_questions text NOT NULL DEFAULT '',
  sbir_topic_title text NOT NULL DEFAULT '',
  sbir_topic_url text NOT NULL DEFAULT '',
  sbir_topic_why text NOT NULL DEFAULT '',
  score_hint integer NOT NULL DEFAULT 50,
  is_sample boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS viewer_paths (
  viewer_sub text NOT NULL,
  lead_id text NOT NULL REFERENCES leads (id),
  match_path text NOT NULL DEFAULT '',
  match_acted_at timestamptz,
  PRIMARY KEY (viewer_sub, lead_id),
  CONSTRAINT viewer_paths_match_path_check
    CHECK (match_path IN ('', 'outreach', 'sbir_topic', 'skip'))
);

CREATE INDEX IF NOT EXISTS viewer_paths_viewer_idx
  ON viewer_paths (viewer_sub);

CREATE TABLE IF NOT EXISTS viewer_outcomes (
  viewer_sub text NOT NULL,
  lead_id text NOT NULL REFERENCES leads (id),
  contacted text NOT NULL DEFAULT 'unknown',
  reply text NOT NULL DEFAULT 'unknown',
  interest text NOT NULL DEFAULT 'unknown',
  sbir_status text NOT NULL DEFAULT 'unknown',
  notes text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (viewer_sub, lead_id),
  CONSTRAINT viewer_outcomes_contacted_check
    CHECK (contacted IN ('unknown', 'pending', 'yes', 'no')),
  CONSTRAINT viewer_outcomes_reply_check
    CHECK (reply IN ('unknown', 'pending', 'yes', 'no')),
  CONSTRAINT viewer_outcomes_interest_check
    CHECK (interest IN ('unknown', 'none', 'weak', 'strong')),
  CONSTRAINT viewer_outcomes_sbir_check
    CHECK (sbir_status IN ('unknown', 'not_pursued', 'pending', 'yes', 'no'))
);

CREATE INDEX IF NOT EXISTS viewer_outcomes_viewer_idx
  ON viewer_outcomes (viewer_sub);
