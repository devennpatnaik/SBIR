-- Public support programs (training, proposal help, licensing help, mentoring) that a user tracks per project.
-- The program catalog itself is curated reference data shipped with the app; this table holds only the user's choices.
CREATE TABLE program_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT auth.user_id(),
  project_id uuid,
  program_id text NOT NULL,
  status text NOT NULL DEFAULT 'considering' CHECK (status IN (
    'considering', 'preparing', 'applied_confirmed', 'accepted_confirmed', 'participating', 'completed', 'declined', 'not_a_fit')),
  notes text NOT NULL DEFAULT '',
  task_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Foreign keys are added separately: inline REFERENCES in CREATE TABLE trips the platform's notify trigger.
ALTER TABLE program_tracking ADD CONSTRAINT program_tracking_project_fk FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE;
ALTER TABLE program_tracking ADD CONSTRAINT program_tracking_task_fk FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE SET NULL;
CREATE UNIQUE INDEX program_tracking_unique ON program_tracking (user_id, project_id, program_id) NULLS NOT DISTINCT;
CREATE INDEX program_tracking_project_idx ON program_tracking (project_id);

ALTER TABLE program_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_select ON program_tracking FOR SELECT TO authenticated USING (user_id = auth.user_id());
CREATE POLICY own_insert ON program_tracking FOR INSERT TO authenticated WITH CHECK (user_id = auth.user_id());
CREATE POLICY own_update ON program_tracking FOR UPDATE TO authenticated USING (user_id = auth.user_id()) WITH CHECK (user_id = auth.user_id());
CREATE POLICY own_delete ON program_tracking FOR DELETE TO authenticated USING (user_id = auth.user_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON program_tracking TO authenticated;

-- Answers to the "what help fits me" questions (award history, agencies, area, location).
ALTER TABLE user_settings ADD COLUMN help_profile jsonb NOT NULL DEFAULT '{}'::jsonb;
