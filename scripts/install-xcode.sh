#!/usr/bin/env bash
set -euo pipefail

# Instala Xcode compatível com macOS Ventura 13.x
# A App Store só oferece Xcode 26+ (exige macOS 26+) — usamos Xcode 15.2.

LOCAL_BIN="$HOME/.local/bin"
mkdir -p "$LOCAL_BIN"
export PATH="$LOCAL_BIN:$HOME/usr/local/opt/mas/bin:$PATH"

XCODE_VERSION="${XCODE_VERSION:-15.2}"
OS_VERSION="$(sw_vers -productVersion)"

echo "==> OffMe — instalação do Xcode"
echo "    macOS: ${OS_VERSION}"
echo "    Versão alvo: Xcode ${XCODE_VERSION}"
echo ""

# ── Ferramentas (sem Homebrew/sudo) ──────────────────────────
if ! command -v jq >/dev/null 2>&1; then
  echo "==> Instalando jq..."
  curl -fsSL "https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-macos-amd64" \
    -o "$LOCAL_BIN/jq"
  chmod +x "$LOCAL_BIN/jq"
fi

if ! command -v mas >/dev/null 2>&1; then
  echo "==> Instalando mas..."
  curl -fsSL "https://github.com/mas-cli/mas/releases/download/v7.0.0/mas-7.0.0-x86_64.pkg" \
    -o /tmp/mas.pkg
  installer -pkg /tmp/mas.pkg -target CurrentUserHomeDirectory
  export PATH="$HOME/usr/local/opt/mas/bin:$PATH"
  ln -sf "$HOME/usr/local/opt/mas/bin/mas" "$LOCAL_BIN/mas"
fi

if ! command -v xcodes >/dev/null 2>&1; then
  echo "==> Instalando xcodes..."
  curl -fsSL "https://github.com/XcodesOrg/xcodes/releases/download/2.0.2/xcodes.zip" \
    -o /tmp/xcodes.zip
  unzip -qo /tmp/xcodes.zip -d /tmp/xcodes-install
  chmod +x /tmp/xcodes-install/xcodes
  ln -sf /tmp/xcodes-install/xcodes "$LOCAL_BIN/xcodes"
fi

FREE_GB=$(df -g / | awk 'NR==2 {print $4}')
echo "Espaço livre: ${FREE_GB} GB (mínimo recomendado: 25 GB)"
echo ""

# App Store não serve no Ventura 13
if command -v mas >/dev/null 2>&1; then
  MIN_OS=$(mas lookup 497799835 2>/dev/null | grep "Minimum OS" | awk '{print $NF}' || echo "?")
  echo "⚠️  App Store: Xcode exige macOS ${MIN_OS} — incompatível com este Mac."
  echo "    Usando download direto da Apple (conta Apple ID gratuita)."
  echo ""
fi

# XIP manual (se baixou de developer.apple.com)
XIP_PATH="${XCODE_XIP_PATH:-}"
if [[ -z "$XIP_PATH" ]]; then
  for candidate in \
    "$HOME/Downloads/Xcode_${XCODE_VERSION}.xip" \
    "$HOME/Downloads/Xcode_${XCODE_VERSION//./_}.xip" \
    "$HOME/Downloads/Xcode.xip"; do
    if [[ -f "$candidate" ]]; then
      XIP_PATH="$candidate"
      break
    fi
  done
fi

if [[ -n "$XIP_PATH" && -f "$XIP_PATH" ]]; then
  echo "==> Instalando a partir de: $XIP_PATH"
  xcodes install "$XCODE_VERSION" --path "$XIP_PATH" --select --no-superuser
else
  echo "==> Baixando Xcode ${XCODE_VERSION} (~7 GB, 20-40 min)..."
  echo "    Será solicitado Apple ID + senha (+ 2FA se ativo)."
  echo ""
  xcodes install "$XCODE_VERSION" --update --select --no-superuser
fi

echo ""
echo "==> Configurando Xcode (pode pedir senha do Mac)..."
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept 2>/dev/null || true
sudo xcodebuild -runFirstLaunch 2>/dev/null || true

echo ""
xcodebuild -version
echo ""
echo "Instalação concluída. Rode: make ios"