.PHONY: up down infra logs

up:
	docker compose up -d

down:
	docker compose down

infra:
	docker compose up -d postgres redis cassandra zookeeper kafka zipkin prometheus grafana elasticsearch neo4j

logs:
	docker compose logs -f

ps:
	docker compose ps