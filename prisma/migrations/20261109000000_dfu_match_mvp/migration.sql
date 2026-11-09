-- DFU / chronic wounds match MVP: problem space + path choice on technologies.
ALTER TABLE technologies
  ADD COLUMN IF NOT EXISTS problem_space text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS match_path text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS match_acted_at timestamptz;

ALTER TABLE technologies DROP CONSTRAINT IF EXISTS technologies_match_path_check;
ALTER TABLE technologies ADD CONSTRAINT technologies_match_path_check
  CHECK (match_path IN ('', 'outreach', 'sbir_topic', 'skip'));

CREATE INDEX IF NOT EXISTS technologies_problem_space_idx
  ON technologies (user_id, problem_space)
  WHERE archived = false AND problem_space <> '';
