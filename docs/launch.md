# Lançamento público — OffMe

Guia para domínio próprio, SEO e compartilhamento social.

**Produção atual:** https://offme.vercel.app

## Domínio próprio na Vercel

1. Compre um domínio (Cloudflare, Namecheap, Registro.br, etc.).
2. Vercel → projeto **offme** → **Settings → Domains**.
3. Adicione o domínio (ex.: `offme.app` ou `www.offme.app`).
4. Configure DNS conforme instruções da Vercel:
   - **Apex** (`offme.app`): registro `A` → `76.76.21.21`
   - **www**: CNAME → `cname.vercel-dns.com`
5. Aguarde propagação (até 48h, geralmente minutos).
6. Defina o domínio como **Primary**.

### Variável de ambiente

Após configurar o domínio, adicione na Vercel (Production):

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://seu-dominio.com` |

Redeploy após salvar. Open Graph e links compartilhados usarão o domínio correto.

```bash
cd /caminho/OffMe && npx vercel deploy --prod
```

## Landing page

Visitantes sem login em `/` são redirecionados para **`/welcome`** — página pública com CTA de cadastro.

- Logado: `/welcome` redireciona para o feed.
- Links: `/login`, `/signup`, `/about`, `/terms`, `/privacy`.

## Open Graph (compartilhamento)

Metadados automáticos para:

| Rota | Preview |
|------|---------|
| `/welcome` | Logo + descrição do OffMe |
| `/post/[id]` | Autor + trecho do post |
| `/profile/[username]` | Nome + bio |

Posts e perfis são **públicos para leitura** (sem login) para crawlers e visitantes.

## Recuperação de senha

Configure na Vercel (opcional, [Resend](https://resend.com) grátis):

| Variável | Valor |
|----------|-------|
| `RESEND_API_KEY` | API key do Resend |
| `RESEND_FROM` | `OffMe <noreply@seu-dominio.com>` |

Sem Resend, o link de reset só aparece nos logs em desenvolvimento.

## Convites

Cada usuário tem link `https://offme.vercel.app/signup?ref=@username` em **Configurações → Convidar amigos**.

## Checklist de lançamento

- [ ] Domínio configurado e `NEXT_PUBLIC_SITE_URL` definido
- [ ] `GET /api/v1/health` ok em produção
- [ ] Testar compartilhar um post no WhatsApp/Telegram (preview com texto)
- [ ] Testar `/welcome` em mobile
- [ ] Dark mode em **Configurações → Aparência**
- [ ] Posts agendados em **Configurações → Agendados**
- [ ] Convide primeiros usuários beta

## SEO básico

O `layout.tsx` já inclui `metadataBase`, `openGraph` e `twitter:card`. Para melhorar:

1. Submeta o sitemap quando houver mais páginas públicas.
2. Use `@username` consistente nas redes ao divulgar.
3. Página `/about` descreve o produto para buscadores.