#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Defina DATABASE_URL (PostgreSQL de produção)." >&2
  echo "Exemplo: export DATABASE_URL='postgresql://...?sslmode=require'" >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql não encontrado — usando Node (frontend-web/scripts/migrate.js)"
  cd "$ROOT/frontend-web"
  npm run migrate
  exit $?
fi

echo "==> OffMe — migrations de produção"
echo "    Host: $(echo "$DATABASE_URL" | sed -E 's|.*@([^/]+)/.*|\1|')"

MIGRATIONS=(
  offme_init.sql
  002_posts.sql
  003_likes.sql
  004_notifications.sql
  005_media.sql
  006_bookmarks_reposts.sql
  007_messages.sql
  008_supabase_realtime.sql
  009_perf_indexes.sql
)

for file in "${MIGRATIONS[@]}"; do
  path="$ROOT/schemas/postgres/$file"
  if [[ ! -f "$path" ]]; then
    echo "Arquivo não encontrado: $path" >&2
    exit 1
  fi
  echo "==> Aplicando $file"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$path"
done

echo ""
echo "Migrations concluídas."
echo "Verifique: psql \"\$DATABASE_URL\" -c \"\\dt\""