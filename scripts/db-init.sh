#!/usr/bin/env bash
set -euo pipefail

DB_URL="${DATABASE_URL:-postgresql://offme:offme_dev@localhost:5432/offme}"
SCHEMA="${1:-schemas/postgres/offme_init.sql}"

echo "Applying schema: $SCHEMA"
psql "$DB_URL" -f "$SCHEMA"
echo "Done."