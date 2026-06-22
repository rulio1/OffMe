#!/usr/bin/env bash
# Assistente: Firebase Android + FCM na Vercel
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GS_JSON="$ROOT/mobile-android/app/google-services.json"
KEYS_FILE="${PUSH_KEYS_FILE:-$ROOT/secrets/push-keys.env}"
KEYS_EXAMPLE="$ROOT/secrets/push-keys.env.example"

echo "==> OffMe — Firebase Android (FCM)"
echo ""

step() {
  echo "────────────────────────────────────────"
  echo "  $1"
  echo "────────────────────────────────────────"
}

step "1/4 — Projeto Firebase"
echo "  → https://console.firebase.google.com"
echo "  → Adicionar projeto (ex.: OffMe)"
echo "  → Adicionar app Android"
echo "  → Package name: com.offme"
echo ""
read -r -p "Já criou o projeto e baixou google-services.json? [s/N] " created
if [[ "${created,,}" != "s" ]]; then
  echo ""
  echo "Crie o projeto, baixe o JSON e rode este script de novo."
  echo "Guia completo: docs/firebase-android.md"
  exit 0
fi

step "2/4 — google-services.json"
if grep -q 'offme-placeholder' "$GS_JSON" 2>/dev/null; then
  echo "  ⚠️  Ainda é o placeholder em mobile-android/app/google-services.json"
  echo ""
  read -r -p "Caminho do arquivo baixado (Enter = ~/Downloads/google-services.json): " src
  src="${src:-$HOME/Downloads/google-services.json}"
  if [[ ! -f "$src" ]]; then
    echo "Arquivo não encontrado: $src"
    exit 1
  fi
  cp "$src" "$GS_JSON"
  echo "  ✓ Copiado para mobile-android/app/google-services.json"
else
  echo "  ✓ google-services.json já parece configurado"
fi

step "3/4 — FCM_SERVER_KEY"
if [[ ! -f "$KEYS_FILE" ]]; then
  cp "$KEYS_EXAMPLE" "$KEYS_FILE"
  echo "  Criado: secrets/push-keys.env"
fi

if grep -qE '^FCM_SERVER_KEY=AAAA' "$KEYS_FILE" 2>/dev/null; then
  echo "  ✓ FCM_SERVER_KEY já preenchida em secrets/push-keys.env"
else
  echo ""
  echo "  Firebase → Configurações → Cloud Messaging → Server key (legacy)"
  echo ""
  read -r -p "Cole a Server key aqui: " fcm_key
  if [[ -z "$fcm_key" ]]; then
    echo "Server key vazia — edite secrets/push-keys.env manualmente."
  else
    if grep -q '^FCM_SERVER_KEY=' "$KEYS_FILE"; then
      sed -i.bak "s|^FCM_SERVER_KEY=.*|FCM_SERVER_KEY=$fcm_key|" "$KEYS_FILE"
      rm -f "$KEYS_FILE.bak"
    else
      echo "FCM_SERVER_KEY=$fcm_key" >> "$KEYS_FILE"
    fi
    echo "  ✓ Salvo em secrets/push-keys.env"
  fi
fi

step "4/4 — Vercel + build"
read -r -p "Enviar FCM_SERVER_KEY para a Vercel agora? [s/N] " deploy
if [[ "${deploy,,}" == "s" ]]; then
  bash "$ROOT/scripts/vercel-push-env-setup.sh"
fi

echo ""
echo "Próximos passos:"
echo "  1. cd mobile-android && ./gradlew assembleDebug"
echo "  2. Instale no dispositivo, faça login, aceite notificações"
echo "  3. Teste curtida/menção/DM de outra conta"
echo ""
echo "Documentação: docs/firebase-android.md"