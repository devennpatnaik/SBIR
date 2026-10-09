DO $$
DECLARE
  dependent pg_policies;
  dependents pg_policies[];
BEGIN
  SELECT coalesce(array_agg(p), '{}') INTO dependents
  FROM pg_policies p
  WHERE EXISTS (
    SELECT 1
    FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_depend d ON d.classid = 'pg_policy'::regclass AND d.objid = pol.oid AND d.refclassid = 'pg_class'::regclass
    JOIN pg_attribute a ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
    WHERE n.nspname = p.schemaname AND c.relname = p.tablename AND pol.polname = p.policyname
      AND (
        (a.attrelid = 'bourne_agent_sessions'::regclass AND a.attname = 'id')
        OR (a.attrelid = 'bourne_agent_messages'::regclass AND a.attname IN ('session_id', 'turn_id'))
      )
  );

  FOREACH dependent IN ARRAY dependents LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', dependent.policyname, dependent.schemaname, dependent.tablename);
  END LOOP;

  ALTER TABLE bourne_agent_messages DROP CONSTRAINT bourne_agent_messages_session_id_fkey;
  ALTER TABLE bourne_agent_sessions ALTER COLUMN id TYPE text USING id::text;
  ALTER TABLE bourne_agent_messages
    ALTER COLUMN session_id TYPE text USING session_id::text,
    ALTER COLUMN turn_id TYPE text USING turn_id::text;
  ALTER TABLE bourne_agent_messages ADD CONSTRAINT bourne_agent_messages_session_id_fkey
    FOREIGN KEY (session_id) REFERENCES bourne_agent_sessions (id) ON DELETE CASCADE;

  FOREACH dependent IN ARRAY dependents LOOP
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s%s%s',
      dependent.policyname, dependent.schemaname, dependent.tablename,
      dependent.permissive, dependent.cmd,
      (SELECT string_agg(quote_ident(role), ', ') FROM unnest(dependent.roles) AS role),
      CASE WHEN dependent.qual IS NULL THEN '' ELSE format(' USING (%s)', dependent.qual) END,
      CASE WHEN dependent.with_check IS NULL THEN '' ELSE format(' WITH CHECK (%s)', dependent.with_check) END
    );
  END LOOP;
END $$;
