# OffMe

A production-grade Twitter/X-inspired social media platform built with microservices architecture, fanout-on-write timelines, and a hybrid recommendation pipeline.

```
OffMe/
├── docs/                    # Architecture documentation
├── schemas/                 # PostgreSQL + Cassandra schemas
├── thrift/                  # Inter-service Thrift IDL
├── backend-scala/           # Core microservices (Finagle/Finatra)
├── backend-rust/            # High-performance recs serving
├── backend-python/          # ML model training
├── frontend-web/            # Next.js 14 web client
├── mobile-ios/              # Swift iOS (stub)
├── mobile-android/          # Kotlin Android (stub)
└── infra/                   # Docker Compose, Prometheus, Grafana
```

## Architecture Overview

OffMe mirrors X's production architecture:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Edge | Finatra HTTP/2 Gateway | Auth, rate limiting, BFF |
| Core Services | Scala 3 + Finagle | Posts, timelines, graph, identity |
| Recs Serving | Rust (Axum) | Sub-10ms model inference |
| ML Training | Python (PyTorch) | Offline Heavy Ranker training |
| Post Storage | Cassandra | High-write post + timeline data |
| Relational | PostgreSQL | Users, sessions, notifications |
| Graph | Neo4j | Follow/block/mute relationships |
| Cache | Redis | Timeline segments, feature store |
| Search | Elasticsearch | Earlybird-style inverted index |
| Events | Kafka | Async fanout, indexing, notifications |

See [docs/architecture.md](docs/architecture.md) for full system diagrams and service boundaries.

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Java 21+ (for Scala services)
- sbt 1.10+ (for Scala services)
- Node.js 20+ (for frontend)
- Rust 1.79+ (for recs serving, optional)

### 1. Start Infrastructure

```bash
cd infra
docker compose up -d postgres redis cassandra cassandra-init kafka zookeeper zipkin prometheus grafana elasticsearch neo4j
```

Wait for health checks (~60s for Cassandra).

### 2. Run Backend Services

```bash
cd backend-scala

# Post Service (Thrift :8081, Admin :9081)
sbt "postService/run"

# Timeline Service (Thrift :8082, Kafka consumer)
sbt "timelineService/run"

# API Gateway (HTTP :8080)
sbt "apiGateway/run"
```

### 3. Run Recs Serving

```bash
cd backend-rust/recs-serving
cargo run
# Listens on :8090
```

### 4. Run Frontend

```bash
cd frontend-web
npm install
npm run dev
# Open http://localhost:3000
```

### Full Stack via Docker

```bash
cd infra
docker compose up --build
```

| Service | Port |
|---------|------|
| Web UI | 3000 |
| API Gateway | 8080 |
| Post Service | 8081 |
| Timeline Service | 8082 |
| Recs Serving | 8090 |
| Grafana | 3001 |
| Prometheus | 9090 |
| Zipkin | 9411 |

## Microservices

### Post Service (`backend-scala/post-service`)

Authoritative write path for all posts. On `createPost`:
1. Validates (280 char limit, visibility)
2. Generates Snowflake ID
3. Writes to Cassandra `posts` + `user_timeline`
4. Publishes `offme.posts.created` Kafka event

### Timeline Service (`backend-scala/timeline-service`)

Hybrid fanout model:
- **Push** (< 10K followers): writes to each follower's `home_timeline` row
- **Pull** (celebrities): followers merge on read from `user_timeline`
- Redis cache for hot timeline segments (300s TTL)

### Graph Service (`backend-scala/graph-service`)

Neo4j-backed social graph with PostgreSQL denormalized counters. Emits `offme.graph.follow.created` events.

### Identity Service (`backend-scala/identity-service`)

JWT auth (15min access + 30d refresh), registration, profiles.

### API Gateway (`backend-scala/api-gateway`)

HTTP/JSON BFF — terminates auth, fans out to Thrift services.

## Recommendation Pipeline

Inspired by [X's open-source algorithm](https://github.com/twitter/the-algorithm):

```
Candidates (1500)  →  Heavy Ranker (Rust)  →  Heuristics  →  Top 50
  ├─ In-network         ├─ P(like)              ├─ Dedup
  ├─ Out-of-network     ├─ P(repost)            ├─ Author diversity
  ├─ Trending           ├─ P(reply)            ├─ Visibility filter
  └─ Recent engagement  ├─ P(click)             └─ Feedback fatigue
                        └─ P(dwell)
```

- **Training**: `backend-python/ml-training/models/heavy_ranker.py`
- **Serving**: `backend-rust/recs-serving/` (Navi-inspired, <10ms p99)
- **Orchestration**: `backend-python/ml-training/pipelines/home_mixer.py`

## Database Schemas

- **PostgreSQL**: `schemas/postgres/001_init.sql` — users, sessions, follows, notifications, polls, moderation
- **Cassandra**: `schemas/cassandra/001_init.cql` — posts, home_timeline, user_timeline, counters
- **Thrift IDL**: `thrift/offme.thrift` — PostService, TimelineService, GraphService, IdentityService

## Frontend

Next.js 14 App Router with Twitter-style dark UI:

| Component | Path | Purpose |
|-----------|------|---------|
| `Feed` | `src/components/feed/Feed.tsx` | For You / Following tabs |
| `Composer` | `src/components/composer/Composer.tsx` | Post creation (280 char) |
| `Sidebar` | `src/components/layout/Sidebar.tsx` | Navigation |
| `PostCard` | `src/components/post/PostCard.tsx` | Post display + engagement |
| `RightPanel` | `src/components/layout/RightPanel.tsx` | Trends + suggestions |

## Scaling Notes (Production)

Engineering practices from real X:

1. **Timeline fanout**: Batch followers in groups of 500; resumable via `fanout_state` cursor
2. **Celebrity threshold**: Configurable (default 10K); prevents O(n) write amplification
3. **Cache stampede**: Singleflight pattern on timeline cache miss
4. **Circuit breakers**: Finagle per-host breakers on all RPC paths (default 5 failures → open)
5. **Idempotency**: Client `idempotency_key` on post creation (Redis, 24h TTL)
6. **Kafka partitioning**: By `author_id` for ordering; 7-day retention for replay
7. **Cassandra**: TWCS compaction on timeline tables; RF=3; CL=LOCAL_QUORUM
8. **Observability SLOs**: Home timeline p99 < 200ms; For You p99 < 350ms; post create p99 < 500ms

## Observability

- **Metrics**: Prometheus histograms (`rpc_latency_seconds`, `timeline_fanout_size`, `recs_rank_latency_ms`)
- **Tracing**: Zipkin B3 propagation across Finagle → gRPC → HTTP
- **Dashboards**: Grafana at `:3001` (admin/offme)
- **Logging**: Structured JSON → ELK (configure in production)

## Mobile (Stubs)

- `mobile-ios/` — Swift native client (URLSession + WebSocket)
- `mobile-android/` — Kotlin native client (OkHttp + WebSocket)

## Development

```bash
# Copy environment
cp .env.example .env

# Run all infra
make -C infra up  # or: cd infra && docker compose up -d

# Typecheck frontend
cd frontend-web && npm run typecheck

# Test recs serving
curl -X POST http://localhost:8090/v1/rank \
  -H 'Content-Type: application/json' \
  -d '{"user_id":1,"candidate_post_ids":[1,2,3],"candidate_author_ids":[10,20,30],"request_id":"test"}'
```

## License

MIT