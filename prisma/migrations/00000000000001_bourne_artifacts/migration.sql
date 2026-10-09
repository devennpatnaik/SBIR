CREATE TABLE bourne_artifacts (
  id uuid PRIMARY KEY,
  user_id text,
  organization_id text,
  type text NOT NULL CHECK (type IN ('document', 'file')),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bourne_artifact_revisions (
  id uuid PRIMARY KEY,
  artifact_id uuid NOT NULL REFERENCES bourne_artifacts (id) ON DELETE CASCADE,
  run_id text NOT NULL,
  function_name text NOT NULL,
  content text,
  name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX bourne_artifact_revisions_artifact_id_idx ON bourne_artifact_revisions (artifact_id, created_at);
CREATE INDEX bourne_artifact_revisions_run_id_idx ON bourne_artifact_revisions (run_id);

ALTER TABLE bourne_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bourne_artifact_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY organization_read ON bourne_artifacts FOR SELECT TO authenticated USING (
  user_id IS NULL
  OR organization_id = auth.session() -> 'o' ->> 'id'
  OR (organization_id IS NULL AND user_id = auth.user_id())
);
CREATE POLICY own_update ON bourne_artifacts FOR UPDATE TO authenticated USING (user_id = auth.user_id());
CREATE POLICY own_delete ON bourne_artifacts FOR DELETE TO authenticated USING (user_id = auth.user_id());
CREATE POLICY artifact_read ON bourne_artifact_revisions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM bourne_artifacts WHERE bourne_artifacts.id = artifact_id)
);

GRANT SELECT, DELETE ON bourne_artifacts TO authenticated;
GRANT UPDATE (title, description, updated_at) ON bourne_artifacts TO authenticated;
GRANT SELECT ON bourne_artifact_revisions TO authenticated;
