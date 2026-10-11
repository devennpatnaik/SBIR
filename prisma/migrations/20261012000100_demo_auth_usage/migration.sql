-- RLS/default expressions already call auth.user_id by OID. The invoker function
-- also resolves that name at runtime and therefore needs USAGE, not ownership.
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT EXECUTE ON FUNCTION auth.user_id() TO authenticated;
