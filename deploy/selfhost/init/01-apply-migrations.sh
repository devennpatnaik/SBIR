#!/usr/bin/env bash
# Apply product SQL migrations after bootstrap (docker-entrypoint-initdb.d).
set -euo pipefail
MIG_DIR=/migrations
export PGPASSWORD="${POSTGRES_PASSWORD:-labtomarket}"
psql=(psql -v ON_ERROR_STOP=1 -U "${POSTGRES_USER:-ltm}" -d "${POSTGRES_DB:-labtomarket}")
echo "Applying product migrations from ${MIG_DIR}…"
for dir in $(ls -1 "$MIG_DIR" | sort); do
  sql="$MIG_DIR/$dir/migration.sql"
  if [[ -f "$sql" ]]; then
    echo "→ $dir"
    "${psql[@]}" -f "$sql"
  fi
done
# Ensure authenticator can use tables PostgREST needs (migrations grant authenticated).
"${psql[@]}" -c "GRANT USAGE ON SCHEMA public TO authenticator;"
"${psql[@]}" -c "GRANT USAGE ON SCHEMA auth TO authenticator;"
echo "Migrations complete."
