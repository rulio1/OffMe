.PHONY: setup minimal infra up down logs db-check dev docker-check migrate-prod deploy-check deploy-vercel deploy-wizard prod-up prod-down icons

setup:
	bash scripts/setup-dev.sh

minimal:
	$(MAKE) -C infra minimal

infra:
	$(MAKE) -C infra infra

up:
	$(MAKE) -C infra up

down:
	$(MAKE) -C infra down

logs:
	$(MAKE) -C infra logs

db-check:
	$(MAKE) -C infra db-check

docker-check:
	$(MAKE) -C infra docker-check

dev:
	cd frontend-web && npm run dev

start:
	bash scripts/setup-dev.sh
	$(MAKE) dev

ios:
	bash scripts/ios-run.sh

ios-sim-fix:
	bash scripts/ios-sim-fix.sh

ios-device:
	bash scripts/ios-device-run.sh

icons:
	python3 scripts/generate-app-icon.py

ios-ipa:
	bash scripts/ios-ipa.sh

ios-ipa-install:
	bash scripts/ios-ipa-install.sh

install-xcode:
	bash scripts/install-xcode.sh

migrate-prod:
	bash scripts/migrate-prod.sh

deploy-check:
	bash scripts/deploy-check.sh $(URL)

git-push:
	@echo "Uso: bash scripts/git-push-github.sh https://github.com/SEU_USUARIO/OffMe.git"

deploy-vercel:
	bash scripts/deploy-vercel.sh

deploy-wizard:
	bash scripts/deploy-wizard.sh

prod-up:
	cd infra && docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

prod-down:
	cd infra && docker compose -f docker-compose.prod.yml --env-file .env.prod down