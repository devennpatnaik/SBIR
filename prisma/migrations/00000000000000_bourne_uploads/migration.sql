CREATE TABLE bourne_uploads (
  id uuid PRIMARY KEY,
  user_id text,
  organization_id text,
  name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bourne_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY organization_read ON bourne_uploads FOR SELECT TO authenticated USING (
  user_id IS NULL
  OR organization_id = auth.session() -> 'o' ->> 'id'
  OR (organization_id IS NULL AND user_id = auth.user_id())
);
CREATE POLICY own_delete ON bourne_uploads FOR DELETE TO authenticated USING (user_id = auth.user_id());

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, DELETE ON bourne_uploads TO authenticated;
