# Crescimento pós-beta — OffMe

Pacote operacional após o lançamento do beta.

## Script único

```bash
./scripts/growth-launch.sh
```

Executa migrations, seed de contas demo e imprime checklist + mensagem para testadores.

## Contas demo (seed)

| Username | Função |
|----------|--------|
| `offme_news` | Novidades do beta |
| `offme_tips` | Dicas de uso |
| `offme_beta` | CTA de feedback |

Senha padrão: `OffMeBeta2026!` (ou `SEED_DEMO_PASSWORD`).

```bash
cd frontend-web && node scripts/seed-beta-content.js
```

## Métricas (Plausible)

1. Crie site em [plausible.io](https://plausible.io) (ou self-hosted).
2. Vercel → Production:

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | `offme.vercel.app` ou domínio próprio |

Opcional: `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL` para instância custom.

## Email

| Recurso | Quando |
|---------|--------|
| Boas-vindas | Cadastro |
| Reset senha | Esqueci senha |
| Resumo semanal | Domingos (cron diário + digest) |

Variáveis: `RESEND_API_KEY`, `RESEND_FROM`.

Resumo semanal: usuários com **Configurações → Notificações → Resumo por email** ativo.

## Admin feedback

`/moderation` → aba **Beta**:

- Filtros: Abertos / Resolvidos / Dispensados
- Ações: Resolver, Dispensar
- **Exportar CSV**

## Onboarding

- Modal pós-cadastro (4 passos)
- Checklist no feed: seguir 3, primeiro post, feedback opcional

## Domínio próprio

```bash
./scripts/domain-setup.sh offme.app
```

Detalhes: `docs/launch.md`.

## E2E

```bash
cd frontend-web
npm run test:e2e -- e2e/feedback.spec.ts
```

## Mobile

iOS/Android: link **Feedback beta (web)** em Configurações → abre `/settings/feedback`.

## Ordem recomendada

1. `./scripts/growth-launch.sh`
2. Convidar 10–30 testadores
3. Plausible + Resend na Vercel
4. Monitorar `/moderation` → Beta diariamente
5. Domínio próprio quando estável