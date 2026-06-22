# PWA no iPhone (sem conta Apple Developer)

O OffMe funciona como app na tela de início do iPhone via PWA — **grátis**, sem precisar da conta Apple Developer de US$ 99/ano. Push web (VAPID) funciona quando o app é aberto a partir do ícone instalado.

**Produção:** https://offme.vercel.app

## Instalar no iPhone

1. Abra **Safari** (obrigatório — Chrome/Firefox no iOS não instalam PWA com push).
2. Acesse https://offme.vercel.app e faça login.
3. Toque em **Compartilhar** (ícone de quadrado com seta para cima).
4. Role e toque em **Adicionar à Tela de Início**.
5. Confirme com **Adicionar**.

O OffMe abre em tela cheia, sem a barra do Safari.

> Na primeira visita, um banner na parte inferior do app também mostra esses passos.

## Ativar notificações push

1. Abra o OffMe **pelo ícone na tela de início** (não pelo Safari).
2. Na primeira vez, o iOS pede permissão para notificações — toque em **Permitir**.
3. Se negou antes: **Ajustes → Notificações → OffMe** → ative **Permitir Notificações**.

As notificações usam Web Push (VAPID), configurado na Vercel:

| Variável | Função |
|----------|--------|
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Par de chaves do servidor |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Mesma chave pública (cliente) |
| `VAPID_SUBJECT` | `mailto:seu@email.com` |

## O que funciona / limitações

| Recurso | PWA iPhone |
|---------|------------|
| Feed, posts, DMs | Sim |
| Notificações in-app (Supabase realtime) | Sim |
| Push em background | Sim (com app instalado + permissão) |
| Push nativo APNs (app sideload) | Não — exige conta Apple paga + chave `.p8` |
| Atualização automática | Sim (service worker) |
| Offline | Parcial (ícones e shell em cache) |

## Desenvolvimento local

```bash
cd frontend-web
npm run dev
```

Acesse pelo IP da máquina no iPhone (mesma rede Wi‑Fi). HTTPS é necessário para push em produção; em `localhost` o Safari aceita exceção.

## Arquivos relevantes

| Arquivo | Função |
|---------|--------|
| `frontend-web/public/site.webmanifest` | Metadados do app instalável |
| `frontend-web/public/sw.js` | Service worker (cache + push) |
| `frontend-web/src/components/layout/InstallPwaBanner.tsx` | Banner de instalação iOS |
| `frontend-web/src/lib/push-client.ts` | Inscrição Web Push |
| `frontend-web/src/lib/pwa.ts` | Detecção iOS / standalone |

## Solução de problemas

**Banner não aparece** — Só no Safari, fora do modo standalone (já instalado). Feche o app da tela de início e abra no Safari.

**Push não chega** — Confirme que abriu pelo ícone instalado, permissão concedida e variáveis VAPID na Vercel. Faça logout/login para re-inscrever.

**App desatualizado** — Feche todas as abas/janelas do OffMe e reabra pelo ícone. O service worker atualiza na próxima visita.