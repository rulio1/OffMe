.PHONY: minimal infra up down logs ps setup db-check db-shell reset-postgres docker-check minio-check prod-up prod-down

COMPOSE := docker compose
PROFILE_MINIMAL := --profile minimal
PROFILE_INFRA := --profile infra
PROFILE_APP := --profile app
PROFILE_ALL := --profile infra --profile app

minimal:
	$(COMPOSE) $(PROFILE_MINIMAL) up -d

infra:
	$(COMPOSE) $(PROFILE_INFRA) up -d

up:
	$(COMPOSE) $(PROFILE_ALL) up -d --build

down:
	$(COMPOSE) --profile minimal --profile infra --profile app down

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps -a

setup:
	@bash ../scripts/setup-dev.sh

docker-check:
	@bash ../scripts/docker-check.sh

db-check:
	@$(COMPOSE) exec -T postgres psql -U offme -d offme -c "SELECT 1 AS ok;"
	@$(COMPOSE) exec -T postgres psql -U offme -d offme -c "\dt"

minio-check:
	@curl -fs http://localhost:9000/minio/health/live && echo "MinIO OK"

prod-up:
	$(COMPOSE) -f docker-compose.prod.yml --env-file .env.prod up -d --build

prod-down:
	$(COMPOSE) -f docker-compose.prod.yml --env-file .env.prod down

db-shell:
	$(COMPOSE) exec postgres psql -U offme -d offme

reset-postgres:
	$(COMPOSE) $(PROFILE_MINIMAL) down postgres -v
	$(COMPOSE) $(PROFILE_MINIMAL) up -d postgres
	@echo "PostgreSQL recriado com schema inicial."