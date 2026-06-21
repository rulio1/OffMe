#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROFILE="${OFFME_DOCKER_PROFILE:-minimal}"

cd "$ROOT"

echo "==> OffMe — setup de desenvolvimento"

# ── Arquivos de ambiente ─────────────────────────────────────
if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Criado .env a partir de .env.example"
else
  echo ".env já existe — mantido"
fi

if [[ ! -f frontend-web/.env.local ]]; then
  cp frontend-web/.env.example frontend-web/.env.local
  echo "Criado frontend-web/.env.local"
else
  echo "frontend-web/.env.local já existe — mantido"
fi

# ── Dependências do frontend ─────────────────────────────────
if [[ ! -d frontend-web/node_modules ]]; then
  echo "==> Instalando dependências do frontend..."
  (cd frontend-web && npm install)
else
  echo "frontend-web/node_modules já existe"
fi

# ── Docker ───────────────────────────────────────────────────
# macOS: Docker CLI fica dentro do .app até entrar no PATH
if [[ "$(uname)" == "Darwin" ]] && [[ -x "/Applications/Docker.app/Contents/Resources/bin/docker" ]]; then
  export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "" >&2
  echo "Docker não encontrado." >&2
  echo "1. Instale o Docker Desktop: https://www.docker.com/products/docker-desktop/" >&2
  echo "   macOS Ventura 13: use Docker Desktop 4.36 (build 175267)" >&2
  echo "2. Abra o Docker Desktop e aguarde iniciar" >&2
  echo "3. Rode novamente: make setup" >&2
  echo "" >&2
  if [[ "$(uname)" == "Darwin" ]]; then
    open "https://desktop.docker.com/mac/main/amd64/175267/Docker.dmg" 2>/dev/null || true
  fi
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker instalado, mas o daemon não está rodando. Abra o Docker Desktop." >&2
  if [[ "$(uname)" == "Darwin" ]]; then
    open -a Docker 2>/dev/null || open -a "Docker Desktop" 2>/dev/null || true
  fi
  exit 1
fi

cd infra

case "$PROFILE" in
  minimal)
    echo "==> Subindo perfil minimal (PostgreSQL + Redis + MinIO)..."
    docker compose --profile minimal up -d
    ;;
  infra)
    echo "==> Subindo perfil infra (todos os data stores)..."
    docker compose --profile infra up -d
    ;;
  full)
    echo "==> Subindo stack completa..."
    docker compose --profile infra --profile app up -d --build
    ;;
  *)
    echo "Perfil inválido: $PROFILE (use: minimal, infra, full)" >&2
    exit 1
    ;;
esac

echo "==> Aguardando PostgreSQL..."
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U offme -d offme >/dev/null 2>&1; then
    echo "PostgreSQL pronto."
    break
  fi
  if [[ $i -eq 30 ]]; then
    echo "Timeout aguardando PostgreSQL." >&2
    exit 1
  fi
  sleep 2
done

echo "==> Verificando schema PostgreSQL..."
TABLES=$(docker compose exec -T postgres psql -U offme -d offme -tAc \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('users','sessions');")
if [[ "$TABLES" -lt 2 ]]; then
  echo "Aplicando schema offme_init.sql..."
  docker compose exec -T postgres psql -U offme -d offme -f /docker-entrypoint-initdb.d/001_offme_init.sql
else
  echo "Tabelas users/sessions já existem."
fi

echo "==> Aplicando migrations (002–007)..."
for migration in 002_posts.sql 003_likes.sql 004_notifications.sql 005_media.sql 006_bookmarks_reposts.sql 007_messages.sql; do
  docker compose exec -T postgres psql -U offme -d offme < "../schemas/postgres/$migration"
done

echo "==> Aguardando MinIO..."
for i in $(seq 1 30); do
  if curl -fs http://localhost:9000/minio/health/live >/dev/null 2>&1; then
    echo "MinIO pronto."
    break
  fi
  if [[ $i -eq 30 ]]; then
    echo "MinIO ainda não respondeu — rode: make minimal" >&2
  fi
  sleep 2
done

cd "$ROOT"

echo ""
echo "Setup concluído (perfil: $PROFILE)."
echo ""
echo "Comandos úteis:"
echo "  make minimal       # PostgreSQL + Redis + MinIO"
echo "  MinIO console:     http://localhost:9001  (offme / offme_dev)"
echo "  make infra         # + Cassandra, Kafka, Neo4j, ES, etc."
echo "  make up            # + microserviços + frontend em Docker"
echo "  make docker-check  # verificar saúde dos containers"
echo ""
echo "Próximos passos:"
echo "  1. Frontend:  make dev"
echo "  2. Health:    curl http://localhost:3000/api/v1/health"
if [[ "$PROFILE" != "minimal" ]]; then
  echo "  3. Grafana:   http://localhost:3001  (admin / offme)"
  echo "  4. Neo4j:     http://localhost:7474  (neo4j / offme_dev)"
fi
echo ""