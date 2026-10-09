CREATE TABLE user_settings (
  user_id text PRIMARY KEY DEFAULT auth.user_id(),
  weights jsonb NOT NULL DEFAULT '{}'::jsonb,
  profile text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_select ON user_settings FOR SELECT TO authenticated USING (user_id = auth.user_id());
CREATE POLICY own_insert ON user_settings FOR INSERT TO authenticated WITH CHECK (user_id = auth.user_id());
CREATE POLICY own_update ON user_settings FOR UPDATE TO authenticated USING (user_id = auth.user_id()) WITH CHECK (user_id = auth.user_id());
CREATE POLICY own_delete ON user_settings FOR DELETE TO authenticated USING (user_id = auth.user_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON user_settings TO authenticated;
