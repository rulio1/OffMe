# OffMe iOS

Cliente nativo SwiftUI para OffMe.

## Requisitos

- **Xcode 15.2** (Ventura 13) — a App Store só oferece Xcode 26+ que não roda no Ventura
- Frontend rodando: `make dev` (porta 3000)
- Docker: `make minimal` (PostgreSQL)

## Instalar Xcode (Ventura 13)

```bash
make install-xcode
```

Pedirá Apple ID (conta gratuita) + senha. Alternativa manual:

1. Baixe [Xcode 15.2](https://developer.apple.com/download/all/?q=Xcode%2015.2) (login Apple)
2. Coloque o `.xip` em `~/Downloads/`
3. `XCODE_XIP_PATH=~/Downloads/Xcode_15.2.xip make install-xcode`

## Rodar no simulador

```bash
# Na raiz do projeto
make ios

# Ou manualmente
bash scripts/ios-run.sh
```

O script detecta o IP do Mac e configura a API automaticamente.

## Abrir no Xcode

```bash
open mobile-ios/OffMe.xcodeproj
```

Selecione um simulador iPhone e pressione **Run** (⌘R).

## API

O simulador iOS **não** acessa `localhost` do Mac. A URL da API fica em:

`mobile-ios/OffMe/Config/APIConfig.swift`

```swift
static let baseURL = "http://SEU_IP_LOCAL:3000/api/v1"
```

Descubra seu IP: `ipconfig getifaddr en0`

## Funcionalidades

- Login / cadastro
- Feed (Para você / Seguindo)
- Criar posts
- Pull-to-refresh