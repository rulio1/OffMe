#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_MIGRATE="${RUN_MIGRATE:-}"

if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI não encontrado." >&2
  echo "Instale: npm i -g vercel" >&2
  exit 1
fi

cd "$ROOT/frontend-web"

echo "==> OffMe — deploy Vercel"
echo ""
echo "Variáveis obrigatórias no painel Vercel:"
echo "  DATABASE_URL, DATABASE_SSL=true, JWT_SECRET"
echo "  NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou ANON_KEY)"
echo "  IMGBB_API_KEY (ou S3_*)"

echo ""

if [[ -z "${DATABASE_URL:-}" ]] && [[ -f "$ROOT/frontend-web/.env.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/frontend-web/.env.local"
  set +a
  echo "Carregado DATABASE_URL de frontend-web/.env.local"
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Aviso: DATABASE_URL não definida — migrations ignoradas." >&2
elif [[ "$(echo "${RUN_MIGRATE:-}" | tr '[:upper:]' '[:lower:]')" == "y" || "$(echo "${RUN_MIGRATE:-}" | tr '[:upper:]' '[:lower:]')" == "yes" || "${1:-}" == "--migrate" ]]; then
  echo "==> Rodando migrations..."
  bash "$ROOT/scripts/migrate-prod.sh"
else
  echo "Pule migrations ou use: RUN_MIGRATE=y make deploy-vercel"
fi

echo ""
echo "==> Deploy produção..."
vercel deploy --prod

echo ""
echo "Após o deploy:"
echo "  make deploy-check URL=https://seu-app.vercel.app"