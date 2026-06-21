#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
URL="${1:-}"

echo "==> OffMe — verificação de deploy"

check_env() {
  local name="$1"
  if [[ -n "${!name:-}" ]]; then
    echo "  ✓ $name"
  else
    echo "  ✗ $name (ausente)"
    MISSING=1
  fi
}

MISSING=0
echo ""
echo "Variáveis locais (para migrate / docker prod):"
check_env DATABASE_URL
check_env JWT_SECRET

echo ""
echo "Realtime (opcional):"
if [[ -n "${NEXT_PUBLIC_SUPABASE_URL:-}" ]]; then
  echo "  ✓ NEXT_PUBLIC_SUPABASE_URL"
else
  echo "  · NEXT_PUBLIC_SUPABASE_URL (opcional)"
fi
if [[ -n "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" || -n "${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-}" ]]; then
  echo "  ✓ Supabase anon/publishable key"
else
  echo "  · Supabase key (opcional)"
fi

if [[ $MISSING -eq 0 ]] && [[ -n "${DATABASE_URL:-}" ]]; then
  echo ""
  echo "==> PostgreSQL"
  if psql "$DATABASE_URL" -c "SELECT 1 AS ok;" >/dev/null 2>&1; then
    echo "  ✓ Conexão OK"
    TABLES=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='users';" 2>/dev/null || echo 0)
    if [[ "$TABLES" -ge 1 ]]; then
      echo "  ✓ Schema users presente"
    else
      echo "  ✗ Schema ausente — rode: make migrate-prod"
    fi
  else
    echo "  ✗ Falha na conexão"
  fi
fi

if [[ -n "$URL" ]]; then
  echo ""
  echo "==> App ($URL)"
  HEALTH=$(curl -s -m 15 -o /tmp/offme-health.json -w "%{http_code}" "$URL/api/v1/health" || echo "000")
  if [[ "$HEALTH" == "200" ]]; then
    echo "  ✓ Health OK"
    cat /tmp/offme-health.json
    echo ""
  else
    echo "  ✗ Health falhou (HTTP $HEALTH)"
  fi
fi

echo ""
if [[ -n "${S3_ENDPOINT:-}" ]]; then
  echo "S3 endpoint: $S3_ENDPOINT"
  echo "S3 bucket:   ${S3_BUCKET:-offme-media}"
fi

echo ""
echo "Deploy Vercel (resumo):"
echo "  1. Neon/Supabase → DATABASE_URL + DATABASE_SSL=true"
echo "  2. R2 ou S3 → variáveis S3_*"
echo "  3. openssl rand -base64 48 → JWT_SECRET"
echo "  4. make migrate-prod"
echo "  5. cd frontend-web && vercel --prod"