#!/usr/bin/env bash
# Configura secrets do GitHub Actions para CI/E2E
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/frontend-web/.env.local"

if ! command -v gh >/dev/null 2>&1; then
  echo "Instale GitHub CLI: brew install gh && gh auth login" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Faça login: gh auth login" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Arquivo não encontrado: $ENV_FILE" >&2
  exit 1
fi

get_env() {
  local key="$1"
  grep -E "^${key}=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- | sed 's/^["'\'']//;s/["'\'']$//' || true
}

DATABASE_URL="$(get_env DATABASE_URL)"
if [[ -z "$DATABASE_URL" ]]; then
  echo "DATABASE_URL ausente em $ENV_FILE" >&2
  exit 1
fi

echo "==> OffMe — GitHub Actions secrets"
echo "    Repo: $(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo '?')"

echo "$DATABASE_URL" | gh secret set DATABASE_URL
echo "✓ DATABASE_URL"

JWT_SECRET="$(get_env JWT_SECRET)"
if [[ -n "$JWT_SECRET" ]]; then
  echo "$JWT_SECRET" | gh secret set JWT_SECRET
  echo "✓ JWT_SECRET"
fi

echo ""
echo "Próximo push em main dispara o job e2e no CI."
echo "Verifique: gh run list --workflow=ci.yml"