#!/usr/bin/env bash
# Cria repo no GitHub e faz push (requer gh autenticado ou GITHUB_TOKEN).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REPO_NAME="${1:-OffMe}"
VISIBILITY="${2:-public}"
GH_BIN="${GH_BIN:-gh}"

find_gh() {
  if command -v gh >/dev/null 2>&1 && gh --version 2>/dev/null | grep -q "gh version"; then
    echo gh
    return
  fi
  local cached="$ROOT/.tools/gh/bin/gh"
  if [[ -x "$cached" ]]; then
    echo "$cached"
    return
  fi
  echo "Instalando GitHub CLI em .tools/gh..." >&2
  mkdir -p "$ROOT/.tools"
  local arch zip dir
  arch=$(uname -m)
  if [[ "$arch" == "arm64" ]]; then
    zip="gh_2.95.0_macOS_arm64.zip"
    dir="gh_2.95.0_macOS_arm64"
  else
    zip="gh_2.95.0_macOS_amd64.zip"
    dir="gh_2.95.0_macOS_amd64"
  fi
  curl -fsSL "https://github.com/cli/cli/releases/download/v2.95.0/${zip}" -o "$ROOT/.tools/${zip}"
  unzip -qo "$ROOT/.tools/${zip}" -d "$ROOT/.tools"
  echo "$ROOT/.tools/${dir}/bin/gh"
}

GH_BIN=$(find_gh)

if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  echo "$GITHUB_TOKEN" | "$GH_BIN" auth login --with-token 2>/dev/null || true
fi

if ! "$GH_BIN" auth status >/dev/null 2>&1; then
  echo "GitHub não autenticado." >&2
  echo "" >&2
  echo "Opção A — login interativo (recomendado):" >&2
  echo "  $GH_BIN auth login" >&2
  echo "" >&2
  echo "Opção B — token (Settings → Developer settings → PAT):" >&2
  echo "  export GITHUB_TOKEN=ghp_..." >&2
  echo "  bash scripts/github-create-and-push.sh" >&2
  exit 1
fi

OWNER=$("$GH_BIN" api user -q .login)
REMOTE="https://github.com/${OWNER}/${REPO_NAME}.git"

echo "==> Usuário GitHub: $OWNER"
echo "==> Repo: $REPO_NAME ($VISIBILITY)"

if "$GH_BIN" repo view "${OWNER}/${REPO_NAME}" >/dev/null 2>&1; then
  echo "Repo já existe."
else
  if [[ "$VISIBILITY" == "private" ]]; then
    "$GH_BIN" repo create "$REPO_NAME" --private --source=. --remote=origin
  else
    "$GH_BIN" repo create "$REPO_NAME" --public --source=. --remote=origin
  fi
  echo "Repo criado: $REMOTE"
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "$REMOTE"
else
  git remote set-url origin "$REMOTE"
fi

echo "==> Push main..."
git push -u origin main

echo ""
echo "✅ Código em: $REMOTE"
echo ""
echo "Vercel:"
echo "  1. https://vercel.com/new → Import $OWNER/$REPO_NAME"
echo "  2. Root Directory: frontend-web"
echo "  3. Adicione env vars (docs/deploy.md) → Deploy"