#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB="$ROOT/frontend-web"
SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://offme.vercel.app}"
ADMIN_USER="${ADMIN_USERNAMES:-rulio}"

echo "==> OffMe growth launch"
echo ""

if [[ -z "${DATABASE_URL:-}" ]] && [[ -f "$WEB/.env.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source <(grep -E '^(DATABASE_URL|JWT_SECRET)=' "$WEB/.env.local" | sed 's/^/export /')
  set +a
fi

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "==> Migrations"
  cd "$WEB" && node scripts/migrate.js
  echo ""
  echo "==> Seed de conteúdo demo"
  node scripts/seed-beta-content.js
else
  echo "! DATABASE_URL ausente — pulando migrations e seed"
fi

echo ""
echo "==> Checklist operacional"
echo "  [ ] RESEND_API_KEY + RESEND_FROM na Vercel (emails)"
echo "  [ ] NEXT_PUBLIC_PLAUSIBLE_DOMAIN=offme.vercel.app (métricas)"
echo "  [ ] NEXT_PUBLIC_SITE_URL após domínio próprio"
echo "  [ ] ADMIN_USERNAMES=$ADMIN_USER"
echo ""
echo "==> Links"
echo "  App:        $SITE_URL"
echo "  Welcome:    $SITE_URL/welcome"
echo "  Convite:    $SITE_URL/signup?ref=$ADMIN_USER"
echo "  Moderação:  $SITE_URL/moderation (admin)"
echo ""
echo "==> Mensagem para testadores"
cat <<MSG

O OffMe está em beta aberto 🚀
Crie sua conta: $SITE_URL/signup?ref=$ADMIN_USER
Depois de entrar, envie feedback em Configurações → Feedback beta.

MSG

echo "==> Deploy"
echo "  cd $ROOT && npx vercel deploy --prod"
echo ""
echo "✅ Growth launch script concluído."