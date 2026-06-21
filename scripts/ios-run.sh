#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_DIR="$ROOT/mobile-ios"
PROJECT="$IOS_DIR/OffMe.xcodeproj"
SCHEME="OffMe"
SIMULATOR="${IOS_SIMULATOR:-OffMe Test}"

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "Xcode não encontrado." >&2
  NEED_XCODE=1
elif [[ "$(xcode-select -p 2>/dev/null)" == *"CommandLineTools"* ]]; then
  echo "Apenas Command Line Tools instaladas — o simulador iOS exige o Xcode completo." >&2
  NEED_XCODE=1
fi

if [[ "${NEED_XCODE:-0}" == "1" ]]; then
  echo "Instale o Xcode pela App Store (~12 GB) e depois rode:" >&2
  echo "  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer" >&2
  echo "  make ios" >&2
  open "macappstore://apps.apple.com/app/id497799835" 2>/dev/null || true
  open "$IOS_DIR/OffMe.xcodeproj" 2>/dev/null || true
  exit 1
fi

MAC_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")"
CONFIG_FILE="$IOS_DIR/OffMe/Config/APIConfig.swift"

echo "==> OffMe iOS"
echo "    API base: http://${MAC_IP}:3000/api/v1"
echo "    Simulador: ${SIMULATOR}"

# Atualiza IP da API no código Swift
if [[ -f "$CONFIG_FILE" ]]; then
  sed -i '' "s|static let baseURL = \"http://[^\"]*\"|static let baseURL = \"http://${MAC_IP}:3000/api/v1\"|" "$CONFIG_FILE"
fi

echo "==> Verificando backend..."
if ! curl -sf -m 5 "http://127.0.0.1:3000/api/v1/health" >/dev/null; then
  echo "Frontend não está rodando. Inicie com: make dev" >&2
  exit 1
fi

cd "$IOS_DIR"

resolve_simulator_udid() {
  local booted
  booted="$(xcrun simctl list devices booted 2>/dev/null | grep "${SIMULATOR} (" | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/' | head -1)"
  if [[ -n "$booted" ]]; then
    echo "$booted"
    return
  fi

  local available
  available="$(xcrun simctl list devices available 2>/dev/null | grep "${SIMULATOR} (" | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/' | tail -1)"
  if [[ -n "$available" ]]; then
    echo "$available"
    return
  fi

  local runtime
  runtime="$(xcrun simctl list runtimes available -j 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); ios=[r for r in d.get('runtimes',[]) if r.get('isAvailable') and 'iOS' in r.get('name','')]; print(ios[-1]['identifier'] if ios else '')" 2>/dev/null || true)"
  if [[ -n "$runtime" ]]; then
    echo "Criando simulador ${SIMULATOR}..." >&2
    xcrun simctl create "${SIMULATOR}" "com.apple.CoreSimulator.SimDeviceType.iPhone-SE-3rd-generation" "$runtime"
    return
  fi

  echo "Simulador '${SIMULATOR}' não encontrado. Abra Xcode → Settings → Platforms e baixe iOS Simulator." >&2
  exit 1
}

if xcrun xctrace list devices 2>/dev/null | grep -E "iPhone|iPad" | grep -v Simulator | grep -q .; then
  echo "    Dica: desconecte o iPhone físico para evitar conflito com o simulador." >&2
fi

DEVICE_UDID="$(resolve_simulator_udid)"
echo "    UDID: ${DEVICE_UDID}"

echo "==> Iniciando simulador ${SIMULATOR} (antes do build)..."
open "/Applications/Xcode.app/Contents/Developer/Applications/Simulator.app" 2>/dev/null || true
xcrun simctl boot "$DEVICE_UDID" 2>/dev/null || true

echo "==> Aguardando simulador ficar pronto..."
if ! xcrun simctl bootstatus "$DEVICE_UDID" -b 2>/dev/null; then
  xcrun simctl shutdown "$DEVICE_UDID" 2>/dev/null || true
  sleep 2
  xcrun simctl boot "$DEVICE_UDID"
  xcrun simctl bootstatus "$DEVICE_UDID" -b
fi

if ! xcrun simctl list devices booted 2>/dev/null | grep -q "$DEVICE_UDID"; then
  echo "Simulador não ficou ligado. Rode: make ios-sim-fix" >&2
  exit 1
fi

echo "==> Build..."
xcodebuild \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -destination "platform=iOS Simulator,id=${DEVICE_UDID}" \
  -sdk iphonesimulator \
  -configuration Debug \
  -destination-timeout 120 \
  build \
  CODE_SIGNING_ALLOWED=NO

APP_PATH="$(find ~/Library/Developer/Xcode/DerivedData -name 'OffMe.app' -path '*Debug-iphonesimulator*' -newer "$PROJECT/project.pbxproj" 2>/dev/null | head -1)"
if [[ -z "$APP_PATH" ]]; then
  APP_PATH="$(find ~/Library/Developer/Xcode/DerivedData -name 'OffMe.app' -path '*Debug-iphonesimulator*' 2>/dev/null | head -1)"
fi
if [[ -z "$APP_PATH" ]]; then
  echo "Não encontrei OffMe.app (simulador) após o build." >&2
  exit 1
fi

echo "==> Instalando app..."
xcrun simctl install "$DEVICE_UDID" "$APP_PATH"
xcrun simctl launch "$DEVICE_UDID" com.offme.app

echo ""
echo "App rodando no simulador."
echo "Login de teste: dev@offme.app / senha1234"