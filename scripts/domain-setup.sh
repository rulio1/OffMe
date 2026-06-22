#!/usr/bin/env bash
set -euo pipefail

# Guia interativo para domínio próprio na Vercel
# Uso: ./scripts/domain-setup.sh seu-dominio.com

DOMAIN="${1:-}"

echo "==> OffMe — setup de domínio"
echo ""

if [[ -z "$DOMAIN" ]]; then
  echo "Uso: ./scripts/domain-setup.sh offme.app"
  echo ""
  echo "Passos manuais (docs/launch.md):"
  echo "  1. Vercel → zispr/offme → Settings → Domains"
  echo "  2. Adicione $DOMAIN e www.$DOMAIN"
  echo "  3. Configure DNS (A → 76.76.21.21, CNAME www → cname.vercel-dns.com)"
  echo "  4. Defina domínio como Primary"
  exit 0
fi

SITE_URL="https://${DOMAIN#https://}"
SITE_URL="${SITE_URL%/}"

echo "Domínio alvo: $DOMAIN"
echo "NEXT_PUBLIC_SITE_URL=$SITE_URL"
echo ""

if command -v vercel >/dev/null 2>&1; then
  echo "==> Adicionando variável na Vercel (production)..."
  echo "$SITE_URL" | npx vercel env add NEXT_PUBLIC_SITE_URL production 2>/dev/null || {
    echo "! Falha ou variável já existe — atualize manualmente no painel Vercel"
  }
  echo ""
  echo "Redeploy:"
  echo "  npx vercel deploy --prod"
else
  echo "Vercel CLI não encontrado. Adicione manualmente:"
  echo "  NEXT_PUBLIC_SITE_URL = $SITE_URL"
fi

echo ""
echo "Atualize também:"
echo "  - RESEND_FROM com @$DOMAIN"
echo "  - robots.txt Sitemap: $SITE_URL/sitemap.xml"
echo "  - NEXT_PUBLIC_PLAUSIBLE_DOMAIN=$DOMAIN"