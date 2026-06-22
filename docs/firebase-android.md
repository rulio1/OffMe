# Push Android com Firebase (FCM)

O app Android (`mobile-android/`) já tem Firebase Messaging integrado. Falta criar o projeto Firebase (grátis) e configurar as chaves.

**Package name:** `com.offme`

## Passo a passo

### 1. Criar projeto Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com).
2. **Adicionar projeto** → nome: `OffMe` → desative Google Analytics (opcional).
3. No projeto: **Adicionar app** → **Android**.
4. Package: `com.offme` → Registrar app.
5. Baixe `google-services.json`.
6. Substitua o placeholder:

```bash
cp ~/Downloads/google-services.json mobile-android/app/google-services.json
```

### 2. Server key na Vercel

1. Firebase → **Configurações do projeto** (engrenagem) → **Cloud Messaging**.
2. Em **Cloud Messaging API (Legacy)**, copie a **Server key** (ou ative a API legada se pedido).
3. Configure na Vercel:

```bash
cp secrets/push-keys.env.example secrets/push-keys.env
# Edite e preencha FCM_SERVER_KEY=AAAA...
bash scripts/vercel-push-env-setup.sh
```

Ou use o assistente:

```bash
bash scripts/firebase-android-setup.sh
```

### 3. Build e teste

```bash
cd mobile-android
./gradlew assembleDebug
# Instale o APK no dispositivo ou emulador com Google Play Services
```

1. Abra o app, faça login.
2. Aceite permissão de notificações (Android 13+).
3. O token FCM é enviado automaticamente para `/api/v1/push/register`.
4. Gere uma notificação (curtida, menção, DM) e confira se chega.

## Variáveis na Vercel

| Variável | Origem |
|----------|--------|
| `FCM_SERVER_KEY` | Firebase → Cloud Messaging → Server key |

As variáveis APNs (`APNS_*`) são para iOS nativo e podem ficar vazias se você usa só PWA no iPhone.

## Arquivos no repositório

| Arquivo | Função |
|---------|--------|
| `mobile-android/app/google-services.json` | Config do Firebase (substituir placeholder) |
| `mobile-android/.../OffMeFirebaseMessagingService.kt` | Recebe push FCM |
| `mobile-android/.../PushRegistrationHelper.kt` | Registra token na API |
| `frontend-web/src/lib/fcm-client.ts` | Envia push pelo servidor |
| `secrets/push-keys.env` | Chaves locais (gitignored) |

## Solução de problemas

**Token não registra** — Confirme login, `google-services.json` real e API em produção (`https://offme.vercel.app/api/v1`).

**Push não chega** — Verifique `FCM_SERVER_KEY` na Vercel e redeploy. Teste com notificação real (não só toast in-app).

**Build falha sem google-services.json** — O placeholder permite compilar; push só funciona com o arquivo real do Firebase.

## iOS vs Android

| Plataforma | Opção recomendada | Custo |
|------------|-------------------|-------|
| iPhone | PWA + Web Push | Grátis |
| Android | App nativo + FCM | Grátis (Firebase) |
| iPhone nativo (sideload) | APNs | US$ 99/ano (Apple Developer) |