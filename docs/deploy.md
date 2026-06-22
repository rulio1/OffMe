# Deploy OffMe (MVP)

O MVP roda inteiro no **Next.js** (API Routes + PostgreSQL + S3). Duas opções:

**Produção atual:** https://offme.vercel.app — API em `/api/v1`.

> **Monorepo:** na Vercel, o **Root Directory** deve ser `frontend-web` (não a raiz do repositório). Sem isso o build falha.

## Opção A — Vercel + Neon + Cloudflare R2 (recomendado)

| Serviço | Função | Plano gratuito |
|---------|--------|----------------|
| [Vercel](https://vercel.com) | Frontend + API | Hobby |
| [Neon](https://neon.tech) | PostgreSQL | Free tier |
| [Cloudflare R2](https://developers.cloudflare.com/r2/) | Imagens (S3) | 10 GB/mês |

### 1. Banco (Neon)

1. Crie um projeto Postgres em Neon.
2. Copie a connection string **com pooler** (modo serverless).
3. Adicione `?sslmode=require` se não estiver na URL.

### 2. Imagens (R2)

1. Crie um bucket `offme-media`.
2. Gere API token (Object Read & Write).
3. Configure domínio público ou use a URL pública do bucket.
4. Variáveis:
   - `S3_ENDPOINT` = `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
   - `S3_ACCESS_KEY` / `S3_SECRET_KEY` = credenciais R2
   - `S3_BUCKET` = `offme-media`
   - `S3_PUBLIC_URL` = URL pública das imagens
   - `S3_REGION` = `auto`

### 3. Migrations

```bash
export DATABASE_URL="postgresql://...@...-pooler.../offme?sslmode=require"
make migrate-prod
```

### 4. Vercel via Git (recomendado)

Conecte o repositório GitHub à Vercel — cada push em `main` faz deploy automático.

#### 4.1 Enviar código ao GitHub

```bash
# Crie repo vazio em https://github.com/new (nome: OffMe, sem README)

bash scripts/git-push-github.sh https://github.com/SEU_USUARIO/OffMe.git
```

#### 4.2 Importar na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) → **Import Git Repository**
2. Autorize o GitHub e selecione o repo **OffMe**
3. **Root Directory:** `frontend-web` ← obrigatório (monorepo)
4. Framework: **Next.js** (detectado automaticamente)
5. **Environment Variables** → Production (veja tabela abaixo)
6. **Deploy**

Deploys seguintes: `git push origin main` → Vercel builda sozinha.

#### 4.3 Variáveis de ambiente (Production)

No painel **Settings → Environment Variables** (Production):

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | **Supavisor (transaction mode, porta 6543)** — obrigatório na Vercel (IPv4). Não use `db.*.supabase.co:5432` (só IPv6). Copie em Supabase → Connect → Transaction pooler |
| `DATABASE_SSL` | `true` |
| `JWT_SECRET` | `openssl rand -base64 48` |
| `S3_ENDPOINT` | endpoint R2 |
| `S3_ACCESS_KEY` | chave R2 |
| `S3_SECRET_KEY` | secret R2 |
| `S3_BUCKET` | `offme-media` |
| `S3_PUBLIC_URL` | URL pública |
| `S3_REGION` | `auto` |
| `NEXT_PUBLIC_DEV_AUTH` | `false` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave publishable (ou `ANON_KEY`) |
| `IMGBB_API_KEY` | Upload de imagens (ou use `S3_*`) |
**JWT:** o `JWT_SECRET` da Vercel deve ser **igual** ao JWT Secret do painel Supabase (Settings → API).

#### 4.4 Deploy manual (alternativa à Git)

```bash
make deploy-vercel
# ou: cd frontend-web && npx vercel --prod
```

### 5. Verificar

```bash
make deploy-check URL=https://seu-app.vercel.app
```

---

## Opção B — VPS / Docker (self-hosted)

Tudo em um servidor com Docker:

```bash
cp infra/.env.prod.example infra/.env.prod
# Edite senhas e JWT_SECRET

cd infra
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Aplique migrations extras (se o volume Postgres já existia):

```bash
export DATABASE_URL="postgresql://offme:SENHA@localhost:5432/offme"
make migrate-prod
```

Exponha a porta `APP_PORT` (padrão 3000) com HTTPS (Caddy, nginx ou Cloudflare Tunnel).

Para imagens em produção self-hosted, aponte `S3_PUBLIC_URL` para o MinIO público ou coloque um reverse proxy em `/offme-media`.

---

## iOS em produção

Em `mobile-ios/OffMe/Config/APIConfig.swift`, altere a URL base para o domínio de produção:

```swift
static let baseURL = "https://seu-app.vercel.app/api/v1"
```

---

## Checklist pós-deploy

- [ ] `GET /api/v1/health` retorna `database: connected`
- [ ] Login / registro funcionam
- [ ] Upload de imagem retorna URL pública acessível
- [ ] `JWT_SECRET` forte e único em produção
- [ ] Não commitar `.env` / `.env.prod` com segredos reais