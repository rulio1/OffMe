# OffMe — Autenticação com PostgreSQL

## Visão geral

A autenticação roda nas **API Routes do Next.js** (`frontend-web/src/app/api/v1/auth/`) conectadas ao PostgreSQL.

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/v1/auth/register` | POST | Criar conta |
| `/api/v1/auth/login` | POST | Entrar |
| `/api/v1/auth/logout` | POST | Revogar refresh token |
| `/api/v1/auth/me` | GET | Usuário autenticado |
| `/api/v1/health` | GET | Status + conexão DB |

## Schema

Tabelas em `schemas/postgres/offme_init.sql`:

- **users** — perfil, e-mail, senha (bcrypt), username
- **sessions** — refresh tokens com expiração (30 dias)

## Setup local

### 1. Subir PostgreSQL

```bash
cd infra
docker compose up -d postgres
```

### 2. Configurar ambiente

```bash
cp frontend-web/.env.example frontend-web/.env.local
```

```env
DATABASE_URL=postgresql://offme:offme_dev@localhost:5432/offme
JWT_SECRET=sua_chave_secreta_longa
NEXT_PUBLIC_DEV_AUTH=false
```

### 3. Rodar o frontend

```bash
cd frontend-web
npm install
npm run dev
```

### 4. Testar

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Criar conta
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"maria","email":"maria@email.com","password":"senha1234","displayName":"Maria"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"maria@email.com","password":"senha1234"}'
```

## Segurança

- Senhas: **bcrypt** (12 rounds)
- Access token: **JWT** (15 minutos)
- Refresh token: UUID armazenado em `sessions`
- Logout revoga o refresh token no banco