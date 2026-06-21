#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_DIR="$ROOT/mobile-ios"
PROJECT="$IOS_DIR/OffMe.xcodeproj"
SCHEME="OffMe"
TEAM_ID="${IOS_DEVELOPMENT_TEAM:-HP25CSYA96}"
BUILD_DIR="$IOS_DIR/build/ipa"
ARCHIVE_PATH="$BUILD_DIR/OffMe.xcarchive"
EXPORT_DIR="$BUILD_DIR/export"
EXPORT_PLIST="$IOS_DIR/ExportOptions.plist"
CONFIG_FILE="$IOS_DIR/OffMe/Config/APIConfig.swift"
PRODUCTION_API_URL="${IOS_API_BASE_URL:-https://offme.vercel.app/api/v1}"

MAC_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")"

if [[ "${IOS_USE_LOCAL_API:-}" == "1" ]]; then
  API_URL="http://${MAC_IP}:3000/api/v1"
else
  API_URL="$PRODUCTION_API_URL"
fi

echo "==> OffMe — gerar IPA (development)"
echo "    Team: ${TEAM_ID}"
echo "    API:  ${API_URL}"

echo "==> Gerando ícones do app..."
python3 "$ROOT/scripts/generate-app-icon.py"

if [[ -f "$CONFIG_FILE" ]]; then
  sed -i '' "s|static let baseURL = \"[^\"]*\"|static let baseURL = \"${API_URL}\"|" "$CONFIG_FILE"
fi

if ! security find-identity -v -p codesigning 2>/dev/null | grep -q "valid identities found"; then
  echo "Nenhum certificado de assinatura encontrado." >&2
  echo "No Xcode: Settings → Accounts → adicione seu Apple ID." >&2
  exit 1
fi

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

cd "$IOS_DIR"

APP_BUNDLE="$ARCHIVE_PATH/Products/Applications/OffMe.app"

echo "==> Archive (Release)..."
xcodebuild archive \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  | tail -20

if [[ ! -f "$APP_BUNDLE/Assets.car" ]]; then
  echo "ERRO: Assets.car não encontrado no archive — o ícone não foi incluído." >&2
  echo "Verifique Assets.xcassets/AppIcon.appiconset no Xcode." >&2
  ls -la "$APP_BUNDLE" >&2 || true
  exit 1
fi

echo "==> Ícone OK (Assets.car incluído)"

echo "==> Exportando IPA..."
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist "$EXPORT_PLIST" \
  -allowProvisioningUpdates

IPA_PATH="$(find "$EXPORT_DIR" -name '*.ipa' | head -1)"
if [[ -z "$IPA_PATH" ]]; then
  echo "IPA não encontrado em $EXPORT_DIR" >&2
  exit 1
fi

FINAL_IPA="$IOS_DIR/OffMe.ipa"
cp "$IPA_PATH" "$FINAL_IPA"

echo ""
echo "IPA gerado:"
echo "  $FINAL_IPA"
echo ""
echo "Instalar no iPhone conectado:"
echo "  make ios-ipa-install"
echo ""
echo "Ou arraste o .ipa no Apple Configurator 2 / Xcode → Window → Devices."
echo "Conta gratuita: o app expira em ~7 dias e precisa reinstalar."