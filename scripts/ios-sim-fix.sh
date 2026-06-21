#!/usr/bin/env bash
set -euo pipefail

echo "==> Corrigindo simulador iOS..."

# Encerra processos travados (ignora erros se não existirem)
killall Simulator 2>/dev/null || true
killall simctl 2>/dev/null || true
pkill -9 -f "CoreSimulator/Volumes" 2>/dev/null || true
pkill -9 -f migrationpluginwrapper 2>/dev/null || true
killall -9 com.apple.CoreSimulator.CoreSimulatorService 2>/dev/null || true
sleep 3

xcrun simctl shutdown all 2>/dev/null || true
xcrun simctl delete unavailable 2>/dev/null || true
rm -rf "$HOME/Library/Developer/CoreSimulator/Caches/"* 2>/dev/null || true

RUNTIME="com.apple.CoreSimulator.SimRuntime.iOS-17-0"
if ! xcrun simctl list runtimes available 2>/dev/null | grep -q "iOS 17.0"; then
  echo "Runtime iOS 17 não encontrado. Xcode → Settings → Platforms → baixe iOS 17." >&2
  exit 1
fi

# Remove simuladores antigos duplicados (iPhone 15 etc.)
set +e
while IFS= read -r udid; do
  [[ -n "$udid" ]] && xcrun simctl delete "$udid" 2>/dev/null
done < <(xcrun simctl list devices 2>/dev/null | grep -E "iPhone (15|15 Pro|15 Plus|15 Pro Max)" | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')
set -e

# Recria simulador leve
while IFS= read -r udid; do
  [[ -n "$udid" ]] && xcrun simctl delete "$udid" 2>/dev/null
done < <(xcrun simctl list devices 2>/dev/null | grep "OffMe Test" | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')

UDID="$(xcrun simctl create "OffMe Test" "com.apple.CoreSimulator.SimDeviceType.iPhone-SE-3rd-generation" "$RUNTIME")"
echo "    Simulador: OffMe Test ($UDID)"

open "/Applications/Xcode.app/Contents/Developer/Applications/Simulator.app" 2>/dev/null || true
sleep 4

STATE="$(xcrun simctl list devices 2>/dev/null | grep "$UDID" | sed -E 's/.*\((Booted|Shutdown).*/\1/')"
if [[ "$STATE" != "Booted" ]]; then
  echo "==> Boot (pode demorar 1–3 min na primeira vez)..."
  xcrun simctl boot "$UDID" 2>/dev/null || true
  xcrun simctl bootstatus "$UDID" -b 2>/dev/null || true
fi

if xcrun simctl list devices booted 2>/dev/null | grep -q "$UDID"; then
  echo ""
  echo "Simulador OK."
  echo "Rode: make ios"
else
  echo ""
  echo "Boot falhou. Reinicie o Mac e rode de novo:" >&2
  echo "  make ios-sim-fix && make ios" >&2
  exit 1
fi