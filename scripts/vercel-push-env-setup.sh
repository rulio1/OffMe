#!/usr/bin/env bash
# Configura variáveis de push nativo (APNs + FCM) na Vercel
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KEYS_FILE="${PUSH_KEYS_FILE:-$ROOT/secrets/push-keys.env}"

VERCEL="npx vercel"
cd "$ROOT/frontend-web"

add_env() {
  local key="$1"
  local value="$2"
  if [[ -z "$value" ]]; then
    echo "· $key (vazio — pulado)"
    return
  fi
  if npx vercel env ls production 2>/dev/null | grep -q "^ ${key} "; then
    printf '%s' "$value" | npx vercel env rm "$key" production --yes 2>/dev/null || true
  fi
  printf '%s' "$value" | npx vercel env add "$key" production
  echo "✓ $key"
}

echo "==> OffMe — push nativo na Vercel (production)"
echo ""

# Valores conhecidos do projeto
APNS_TEAM_ID="${APNS_TEAM_ID:-HP25CSYA96}"
APNS_TOPIC="${APNS_TOPIC:-com.offme.app}"
APNS_PRODUCTION="${APNS_PRODUCTION:-false}"

if [[ -f "$KEYS_FILE" ]]; then
  echo "Carregando: $KEYS_FILE"
  set -a
  # shellcheck disable=SC1090
  source "$KEYS_FILE"
  set +a
else
  echo "Arquivo não encontrado: $KEYS_FILE"
  echo ""
  echo "1. cp secrets/push-keys.env.example secrets/push-keys.env"
  echo "2. Preencha APNS_KEY_ID, APNS_KEY e FCM_SERVER_KEY"
  echo "3. Rode este script novamente"
  echo ""
  echo "Configurando apenas valores conhecidos (team, topic, sandbox)..."
fi

add_env APNS_TEAM_ID "$APNS_TEAM_ID"
add_env APNS_TOPIC "$APNS_TOPIC"
add_env APNS_PRODUCTION "$APNS_PRODUCTION"

if [[ -n "${APNS_KEY_ID:-}" ]]; then add_env APNS_KEY_ID "$APNS_KEY_ID"; fi
if [[ -n "${APNS_KEY:-}" ]]; then add_env APNS_KEY "$APNS_KEY"; fi
if [[ -n "${FCM_SERVER_KEY:-}" ]]; then add_env FCM_SERVER_KEY "$FCM_SERVER_KEY"; fi

echo ""
if [[ -z "${APNS_KEY:-}" || -z "${FCM_SERVER_KEY:-}" ]]; then
  echo "⚠️  Push nativo incompleto até preencher secrets/push-keys.env"
  echo ""
  echo "Apple (iOS / Sideloadly):"
  echo "  developer.apple.com → Keys → + → Apple Push Notifications service (APNs)"
  echo "  Baixe o .p8 (só uma vez), cole o conteúdo em APNS_KEY com \\n nas linhas"
  echo "  APNS_PRODUCTION=false para Sideloadly (sandbox)"
  echo ""
  echo "Firebase (Android):"
  echo "  console.firebase.google.com → novo projeto → Add Android app (com.offme)"
  echo "  Baixe google-services.json → mobile-android/app/"
  echo "  Project Settings → Cloud Messaging → Server key → FCM_SERVER_KEY"
else
  echo "✅ Push nativo configurado. Redeploy: cd $ROOT && npx vercel deploy --prod"
fi