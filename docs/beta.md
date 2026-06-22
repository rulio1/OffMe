# Beta aberto — OffMe

Playbook para lançar e operar o beta público.

**Produção:** https://offme.vercel.app

## O que está incluído

| Área | Recurso |
|------|---------|
| Landing | Badge "Beta aberto" em `/welcome` |
| App | Banner dismissível no feed (localStorage) |
| Settings | `/settings/feedback` — bugs, ideias, geral |
| Admin | `/moderation` → aba **Beta** (só `ADMIN_USERNAMES`) |
| Onboarding | Email de boas-vindas no cadastro (Resend) |
| Feed vazio | Sugestões de quem seguir + CTA para postar |
| SEO | `robots.txt` com rotas públicas/privadas |

## Checklist de lançamento

1. **Migration 017** — tabela `beta_feedback`:
   ```bash
   cd frontend-web
   DATABASE_URL="..." node scripts/migrate.js
   ```
   Ou use o script automatizado:
   ```bash
   ./scripts/beta-launch-setup.sh
   ```

2. **Variáveis Vercel** (Production):
   | Variável | Obrigatório | Notas |
   |----------|-------------|-------|
   | `DATABASE_URL` | Sim | Neon/Supabase |
   | `JWT_SECRET` | Sim | |
   | `ADMIN_USERNAMES` | Sim | ex.: `rulio` |
   | `RESEND_API_KEY` | Recomendado | Email de boas-vindas |
   | `RESEND_FROM` | Recomendado | `OffMe <noreply@dominio>` |
   | `NEXT_PUBLIC_SITE_URL` | Opcional | Domínio próprio |

3. **Deploy**
   ```bash
   cd frontend-web && npx vercel deploy --prod
   ```

4. **Smoke test**
   - Criar conta → ver banner beta + modal onboarding
   - Enviar feedback em Configurações
   - Admin: `/moderation` → aba Beta
   - Feed vazio mostra sugestões

## Convites e crescimento

- Link de convite: `https://offme.vercel.app/signup?ref=SEU_USERNAME`
- Card de convite em **Configurações → Geral**
- Trending hashtags no painel direito (24h)

## Monitoramento

- Health: `GET /api/v1/health` (CI a cada 6h)
- Feedback: aba Beta em `/moderation`
- Denúncias e verificação: mesma tela de moderação

## Comunicação com testadores

Mensagem sugerida:

> O OffMe está em **beta aberto**. Crie sua conta, explore o feed e envie feedback em **Configurações → Feedback beta**. Bugs e ideias são muito bem-vindos.

## Próximos passos pós-beta

- Domínio próprio (`docs/launch.md`)
- Push nativo iOS (Apple Developer)
- PWA Android com Firebase
- Métricas (PostHog/Plausible)