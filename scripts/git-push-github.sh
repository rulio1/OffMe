#!/usr/bin/env bash
# Prepara o repo e faz push para GitHub (deploy Vercel via Git).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REMOTE="${1:-}"
BRANCH="${BRANCH:-main}"

if [[ -z "$REMOTE" ]]; then
  echo "Uso: bash scripts/git-push-github.sh <git-remote-url>"
  echo ""
  echo "Exemplo (HTTPS):"
  echo "  bash scripts/git-push-github.sh https://github.com/SEU_USUARIO/OffMe.git"
  echo ""
  echo "Exemplo (SSH):"
  echo "  bash scripts/git-push-github.sh git@github.com:SEU_USUARIO/OffMe.git"
  echo ""
  echo "Antes: crie o repositório vazio em https://github.com/new (sem README)"
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet || [[ -n "$(git status --porcelain)" ]]; then
  echo "==> Commitando alterações..."
  git add -A
  git commit -m "$(cat <<'EOF'
OffMe MVP: web, iOS, Grok, Realtime e deploy Vercel

- Next.js com auth, feed, mensagens, notificações, Grok IA
- Supabase Realtime (web + iOS)
- Navbar estilo X, explore com busca de posts
- iOS app completo + Android scaffold
- Scripts de migrate e deploy via Git/Vercel
EOF
)"
fi

if git remote get-url origin >/dev/null 2>&1; then
  echo "==> Remote origin já existe: $(git remote get-url origin)"
else
  git remote add origin "$REMOTE"
  echo "==> Remote origin: $REMOTE"
fi

echo "==> Push para $BRANCH..."
git push -u origin "$BRANCH"

echo ""
echo "✅ Código no GitHub."
echo ""
echo "Próximo passo — Vercel via Git:"
echo "  1. https://vercel.com/new → Import Git Repository"
echo "  2. Selecione o repo OffMe"
echo "  3. Root Directory: frontend-web"
echo "  4. Framework: Next.js (auto)"
echo "  5. Environment Variables (Production) — veja docs/deploy.md"
echo "  6. Deploy"
echo ""
echo "Cada push em main dispara deploy automático."