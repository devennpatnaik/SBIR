CREATE TABLE bourne_agent_sessions (
  id uuid PRIMARY KEY,
  build_id text NOT NULL,
  agent_name text NOT NULL,
  user_id text NOT NULL,
  organization_id text,
  runtime text NOT NULL,
  runtime_session_id text,
  runtime_resume_token text,
  status text NOT NULL CHECK (status IN ('idle', 'running')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bourne_agent_messages (
  session_id uuid NOT NULL,
  turn_id uuid NOT NULL,
  message_id text NOT NULL,
  message_type text NOT NULL,
  message text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}',
  timestamp timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, turn_id, message_id)
);
-- Foreign keys added after CREATE TABLE: an inline REFERENCES makes the platform notify hook attach its trigger twice.
ALTER TABLE bourne_agent_messages ADD CONSTRAINT bourne_agent_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES bourne_agent_sessions (id) ON DELETE CASCADE;

CREATE INDEX bourne_agent_sessions_user_id_idx ON bourne_agent_sessions (user_id, updated_at DESC);

ALTER TABLE bourne_agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bourne_agent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_read ON bourne_agent_sessions FOR SELECT TO authenticated USING (user_id = auth.user_id());
CREATE POLICY own_delete ON bourne_agent_sessions FOR DELETE TO authenticated USING (user_id = auth.user_id());
CREATE POLICY session_read ON bourne_agent_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM bourne_agent_sessions WHERE bourne_agent_sessions.id = session_id)
);

GRANT SELECT, DELETE ON bourne_agent_sessions TO authenticated;
GRANT SELECT ON bourne_agent_messages TO authenticated;
