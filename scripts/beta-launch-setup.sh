#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB="$ROOT/frontend-web"

echo "==> OffMe beta launch setup"
echo "    Root: $ROOT"

if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -f "$WEB/.env.local" ]]; then
    echo "==> Carregando DATABASE_URL de frontend-web/.env.local"
    set -a
    # shellcheck disable=SC1091
    source <(grep -E '^DATABASE_URL=' "$WEB/.env.local" | sed 's/^/export /')
    set +a
  fi
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Erro: defina DATABASE_URL antes de rodar."
  echo '  DATABASE_URL="postgresql://..." ./scripts/beta-launch-setup.sh'
  exit 1
fi

echo "==> Aplicando migrations (inclui 017_beta_feedback)"
cd "$WEB"
node scripts/migrate.js

echo ""
echo "==> Build de verificação"
npm run build

echo ""
echo "✅ Beta setup concluído."
echo ""
echo "Próximos passos:"
echo "  1. Confirme ADMIN_USERNAMES e RESEND_* na Vercel"
echo "  2. cd frontend-web && npx vercel deploy --prod"
echo "  3. Smoke test: signup → feedback → /moderation (aba Beta)"