#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_DIR="$ROOT/mobile-ios"
PROJECT="$IOS_DIR/OffMe.xcodeproj"
SCHEME="OffMe"
CONFIG_FILE="$IOS_DIR/OffMe/Config/APIConfig.swift"

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "Xcode não encontrado. Rode: make install-xcode" >&2
  exit 1
fi

MAC_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")"

echo "==> OffMe iOS (dispositivo físico)"
echo "    API base: http://${MAC_IP}:3000/api/v1"

if [[ -f "$CONFIG_FILE" ]]; then
  sed -i '' "s|static let baseURL = \"http://[^\"]*\"|static let baseURL = \"http://${MAC_IP}:3000/api/v1\"|" "$CONFIG_FILE"
fi

echo "==> Verificando backend..."
if ! curl -sf -m 5 "http://127.0.0.1:3000/api/v1/health" >/dev/null; then
  echo "Frontend não está rodando. Inicie com: make dev" >&2
  exit 1
fi

echo "==> Procurando iPhone conectado..."
DEVICE_LINE="$(xcrun xctrace list devices 2>/dev/null | grep -E "iPhone|iPad" | grep -v Simulator | grep -v Offline | head -1 || true)"

if [[ -z "$DEVICE_LINE" ]]; then
  echo "Nenhum iPhone/iPad conectado." >&2
  echo "" >&2
  echo "No iPhone:" >&2
  echo "  1. Desbloqueie e conecte o cabo USB" >&2
  echo "  2. Toque em 'Confiar neste computador'" >&2
  echo "  3. Ajustes → Privacidade e Segurança → Modo do desenvolvedor (ativar)" >&2
  exit 1
fi

DEVICE_UDID="$(echo "$DEVICE_LINE" | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')"
DEVICE_NAME="$(echo "$DEVICE_LINE" | sed -E 's/ \([A-F0-9-]+\)$//' | sed 's/^[[:space:]]*//')"

echo "    Dispositivo: ${DEVICE_NAME}"
echo "    UDID: ${DEVICE_UDID}"

DDI_OK=1
if command -v xcrun >/dev/null 2>&1 && xcrun devicectl list devices 2>/dev/null | grep -q "no DDI"; then
  DDI_OK=0
fi

SIGNING_COUNT="$(security find-identity -v -p codesigning 2>/dev/null | grep -c "valid identities found" || echo 0)"
if security find-identity -v -p codesigning 2>/dev/null | grep -q "0 valid identities found"; then
  SIGNING_OK=0
else
  SIGNING_OK=1
fi

if [[ "$DDI_OK" == "0" ]]; then
  echo "" >&2
  echo "⚠️  Este Xcode não suporta a versão do iOS do seu iPhone (Developer Disk Image ausente)." >&2
  echo "    iPhone detectado com iOS mais novo que o suportado pelo Xcode $(xcodebuild -version | head -1)." >&2
  echo "    Atualize o macOS e o Xcode, ou teste no simulador: make ios" >&2
  echo "" >&2
fi

if [[ "$SIGNING_OK" == "0" ]]; then
  echo "" >&2
  echo "⚠️  Nenhuma identidade de assinatura encontrada." >&2
  echo "    No Xcode: Settings → Accounts → adicione seu Apple ID (conta gratuita serve)." >&2
  echo "    Depois: projeto OffMe → Signing & Capabilities → selecione seu Team." >&2
  echo "" >&2
fi

if [[ "$DDI_OK" == "0" || "$SIGNING_OK" == "0" ]]; then
  echo "Abrindo o projeto no Xcode para você configurar..." >&2
  open "$PROJECT"
  exit 1
fi

cd "$IOS_DIR"

TEAM_ARGS=()
if [[ -n "${IOS_DEVELOPMENT_TEAM:-}" ]]; then
  TEAM_ARGS+=(DEVELOPMENT_TEAM="$IOS_DEVELOPMENT_TEAM")
fi

echo "==> Build para dispositivo..."
xcodebuild \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -destination "platform=iOS,id=${DEVICE_UDID}" \
  -configuration Debug \
  -allowProvisioningUpdates \
  build \
  "${TEAM_ARGS[@]}"

APP_PATH="$(find ~/Library/Developer/Xcode/DerivedData -name 'OffMe.app' -path '*Debug-iphoneos*' 2>/dev/null | head -1)"
if [[ -z "$APP_PATH" ]]; then
  echo "Não encontrei OffMe.app (iphoneos) após o build." >&2
  exit 1
fi

echo "==> Instalando no iPhone..."
if xcrun devicectl device install app --device "$DEVICE_UDID" "$APP_PATH" 2>/dev/null; then
  echo "==> Abrindo app..."
  xcrun devicectl device process launch --device "$DEVICE_UDID" com.offme.app 2>/dev/null || true
else
  xcrun devicectl device install app --device "$DEVICE_UDID" "$APP_PATH"
  xcrun devicectl device process launch --device "$DEVICE_UDID" com.offme.app || true
fi

echo ""
echo "App instalado no iPhone."
echo "Login de teste: dev@offme.app / senha1234"
echo "iPhone e Mac devem estar na mesma rede Wi-Fi para a API funcionar."