#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IPA="$ROOT/mobile-ios/OffMe.ipa"

if [[ ! -f "$IPA" ]]; then
  echo "IPA não encontrado. Rode primeiro: make ios-ipa" >&2
  exit 1
fi

DEVICE_UDID="$(xcrun xctrace list devices 2>/dev/null | grep -E "iPhone|iPad" | grep -v Simulator | grep -v Offline | head -1 | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')"

if [[ -z "$DEVICE_UDID" ]]; then
  echo "Nenhum iPhone conectado (desbloqueie e confie neste Mac)." >&2
  exit 1
fi

echo "==> Instalando OffMe.ipa em ${DEVICE_UDID}..."

if xcrun devicectl device install app --device "$DEVICE_UDID" "$IPA" 2>/dev/null; then
  echo "==> Abrindo app..."
  xcrun devicectl device process launch --device "$DEVICE_UDID" com.offme.app 2>/dev/null || true
  echo "Instalado."
  exit 0
fi

# Fallback: Xcode 15
xcrun simctl list devices >/dev/null 2>&1 || true
if command -v ios-deploy >/dev/null 2>&1; then
  ios-deploy --bundle "$IPA" --id "$DEVICE_UDID"
  exit 0
fi

echo "Instalação automática falhou." >&2
echo "Tente:" >&2
echo "  1. Abra o Xcode → Window → Devices and Simulators" >&2
echo "  2. Selecione seu iPhone → clique + em Installed Apps → escolha:" >&2
echo "     $IPA" >&2
exit 1