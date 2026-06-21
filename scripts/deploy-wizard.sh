#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║         OffMe — Assistente de Deploy             ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Este script configura o deploy DEPOIS que você criar as contas:"
echo "  1. Neon (PostgreSQL)  → https://neon.tech"
echo "  2. Cloudflare R2      → https://dash.cloudflare.com"
echo "  3. Vercel             → https://vercel.com"
echo ""

read -r -p "Já criou as 3 contas? [s/N] " READY
if [[ "${READY,,}" != "s" ]]; then
  echo ""
  echo "Abrindo páginas de cadastro..."
  open "https://neon.tech" 2>/dev/null || true
  sleep 1
  open "https://dash.cloudflare.com/sign-up" 2>/dev/null || true
  sleep 1
  open "https://vercel.com/signup" 2>/dev/null || true
  echo ""
  echo "Crie as contas e rode novamente: make deploy-wizard"
  exit 0
fi

echo ""
echo "── Neon (PostgreSQL) ──"
echo "No painel Neon: projeto → Connection string → Pooled"
read -r -p "DATABASE_URL (pooler): " DATABASE_URL
export DATABASE_URL

echo ""
echo "── Cloudflare R2 (imagens) ──"
read -r -p "Account ID: " S3_ACCOUNT
read -r -p "Access Key: " S3_ACCESS_KEY
read -r -s -p "Secret Key: " S3_SECRET_KEY
echo ""
read -r -p "Bucket [offme-media]: " S3_BUCKET
S3_BUCKET="${S3_BUCKET:-offme-media}"
read -r -p "URL pública das imagens (ou Enter para padrão R2): " S3_PUBLIC_URL

S3_ENDPOINT="https://${S3_ACCOUNT}.r2.cloudflarestorage.com"
if [[ -z "$S3_PUBLIC_URL" ]]; then
  S3_PUBLIC_URL="https://${S3_ACCOUNT}.r2.cloudflarestorage.com/${S3_BUCKET}"
fi

echo ""
echo "── JWT ──"
if command -v openssl >/dev/null 2>&1; then
  JWT_SECRET=$(openssl rand -base64 48)
  echo "JWT_SECRET gerado automaticamente."
else
  read -r -s -p "JWT_SECRET (mín. 32 chars): " JWT_SECRET
  echo ""
fi

ENV_FILE="$ROOT/frontend-web/.env.production.local"
cat > "$ENV_FILE" <<EOF
# Gerado por deploy-wizard.sh — NÃO commitar
DATABASE_URL=$DATABASE_URL
DATABASE_SSL=true
JWT_SECRET=$JWT_SECRET
S3_ENDPOINT=$S3_ENDPOINT
S3_ACCESS_KEY=$S3_ACCESS_KEY
S3_SECRET_KEY=$S3_SECRET_KEY
S3_BUCKET=$S3_BUCKET
S3_PUBLIC_URL=$S3_PUBLIC_URL
S3_REGION=auto
NEXT_PUBLIC_DEV_AUTH=false
EOF
chmod 600 "$ENV_FILE"
echo "Salvo em frontend-web/.env.production.local"

echo ""
read -r -p "Rodar migrations no Neon agora? [S/n] " RUN_MIGRATE
if [[ "${RUN_MIGRATE,,}" != "n" ]]; then
  bash "$ROOT/scripts/migrate-prod.sh"
fi

echo ""
echo "── Vercel ──"
if ! command -v vercel >/dev/null 2>&1; then
  echo "Instalando Vercel CLI..."
  npm install -g vercel
fi

echo "Faça login na Vercel (abrirá o browser)..."
vercel login

cd "$ROOT/frontend-web"
vercel link --yes 2>/dev/null || vercel link

echo "Enviando variáveis para a Vercel..."
while IFS='=' read -r key value; do
  [[ -z "$key" || "$key" =~ ^# ]] && continue
  printf '%s' "$value" | vercel env add "$key" production --force 2>/dev/null || true
done < "$ENV_FILE"

read -r -p "Deploy em produção agora? [S/n] " DEPLOY
if [[ "${DEPLOY,,}" != "n" ]]; then
  vercel deploy --prod
  echo ""
  echo "Deploy concluído! Teste com:"
  echo "  make deploy-check URL=https://seu-app.vercel.app"
fi

echo ""
echo "Pronto. Guia completo: docs/deploy.md"