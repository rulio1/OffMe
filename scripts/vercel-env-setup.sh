#!/usr/bin/env bash
# Gera comandos para configurar env vars na Vercel a partir de .env.local
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/frontend-web/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Arquivo não encontrado: $ENV_FILE" >&2
  exit 1
fi

if ! command -v vercel >/dev/null 2>&1 && ! npx vercel --version >/dev/null 2>&1; then
  echo "Instale Vercel CLI: npm i -g vercel && vercel login" >&2
  exit 1
fi

VERCEL="vercel"
command -v vercel >/dev/null 2>&1 || VERCEL="npx vercel"

echo "==> OffMe — sincronizar env na Vercel (production)"
echo "    Fonte: frontend-web/.env.local"
echo ""
echo "Execute na pasta frontend-web (após vercel link):"
echo ""

VARS=(
  DATABASE_URL
  DATABASE_SSL
  JWT_SECRET
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  IMGBB_API_KEY

  S3_ENDPOINT
  S3_ACCESS_KEY
  S3_SECRET_KEY
  S3_BUCKET
  S3_PUBLIC_URL
  S3_REGION

  VAPID_PUBLIC_KEY
  VAPID_PRIVATE_KEY
  NEXT_PUBLIC_VAPID_PUBLIC_KEY
  VAPID_SUBJECT
  CRON_SECRET
  ADMIN_USERNAMES

  FCM_SERVER_KEY
  APNS_KEY
  APNS_KEY_ID
  APNS_TEAM_ID
  APNS_TOPIC
  APNS_PRODUCTION
)

for key in "${VARS[@]}"; do
  val="$(grep -E "^${key}=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- | sed 's/^["'\'']//;s/["'\'']$//' || true)"
  if [[ -n "$val" ]]; then
    echo "echo '$val' | $VERCEL env add $key production"
  fi
done

echo ""
echo "Depois: RUN_MIGRATE=y make deploy-vercel"