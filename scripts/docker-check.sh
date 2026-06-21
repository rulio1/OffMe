#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker não instalado."
  echo "Instale o Docker Desktop: https://www.docker.com/products/docker-desktop/"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker instalado, mas o daemon não está rodando."
  echo "Abra o Docker Desktop e aguarde iniciar."
  exit 1
fi

echo "Docker OK: $(docker --version)"
echo "Compose OK: $(docker compose version)"

cd "$ROOT/infra"

echo ""
echo "==> Containers OffMe"
docker compose ps -a 2>/dev/null || true

echo ""
echo "==> Health checks"
check() {
  local name="$1" cmd="$2"
  if eval "$cmd" >/dev/null 2>&1; then
    echo "  ✓ $name"
  else
    echo "  ✗ $name"
  fi
}

check "PostgreSQL" "docker compose exec -T postgres pg_isready -U offme -d offme"
check "Redis" "docker compose exec -T redis redis-cli ping | grep -q PONG"
check "MinIO" "curl -fs http://localhost:9000/minio/health/live"
check "Elasticsearch" "curl -fs http://localhost:9200/_cluster/health"
check "Kafka" "docker compose exec -T kafka kafka-broker-api-versions --bootstrap-server localhost:9092"