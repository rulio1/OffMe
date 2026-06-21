# OffMe Architecture

OffMe is a Twitter/X-inspired social media platform built as a microservices monorepo. The design mirrors production patterns from X: fanout-on-write for in-network timelines, pull-based hydration for celebrity accounts, a hybrid recommendation pipeline (Home Mixer), and event-driven async processing via Kafka.

## System Context

```mermaid
flowchart TB
    subgraph Clients
        Web[Next.js Web]
        iOS[Swift iOS]
        Android[Kotlin Android]
    end

    subgraph Edge
        GW[API Gateway<br/>Finatra HTTP/2]
        WS[Realtime Gateway<br/>WebSockets]
    end

    subgraph Core["Core Services (Scala/Finagle)"]
        ID[Identity Service]
        POST[Post Service]
        TL[Timeline Service]
        GRP[Graph Service]
        NOTIF[Notification Service]
        SRCH[Search Service]
        MED[Media Service]
        MOD[Moderation Service]
    end

    subgraph Recs["Recommendations"]
        HM[Home Mixer<br/>Scala orchestrator]
        RS[Rust Recs Serving<br/>Navi-like]
        PY[Python ML Training]
    end

    subgraph Data
        PG[(PostgreSQL)]
        CAS[(Cassandra)]
        RD[(Redis/Pelikan)]
        ES[(Elasticsearch)]
        NEO[(Neo4j Graph)]
    end

    subgraph Streaming
        KF[Kafka]
        ZK[Zookeeper]
    end

    subgraph Observability
        PROM[Prometheus]
        GRAF[Grafana]
        ZIP[Zipkin]
        ELK[ELK Stack]
    end

    Web --> GW
    iOS --> GW
    Android --> GW
    Web --> WS

    GW --> ID & POST & TL & GRP & NOTIF & SRCH & MED & HM
    WS --> KF

    POST --> CAS & PG & KF
    TL --> CAS & RD & GRP
    GRP --> NEO & PG & KF
    ID --> PG & RD
    NOTIF --> PG & KF & RD
    SRCH --> ES & KF
    MED --> PG
    MOD --> PG & KF

    HM --> TL & GRP & RS & POST
    RS --> RD & PY
    KF --> TL & NOTIF & SRCH & HM

    Core --> PROM & ZIP
    Recs --> PROM & ZIP
```

## Service Boundaries

| Service | Responsibility | Storage | Communication |
|---------|---------------|---------|---------------|
| **API Gateway** | Auth termination, rate limiting, request routing, BFF aggregation | Redis (sessions) | HTTP/2 → Thrift/gRPC |
| **Identity Service** | Registration, login, JWT, profiles, account settings | PostgreSQL, Redis | Thrift RPC |
| **Post Service** | Create/read posts, engagement counters, visibility rules | Cassandra (posts), PostgreSQL (metadata) | Thrift + Kafka events |
| **Timeline Service** | Fanout-on-write, home timeline reads, cache hydration | Cassandra (timelines), Redis | Thrift + Kafka consumer |
| **Graph Service** | Follow/unfollow, blocks, mutes, graph traversals | Neo4j, PostgreSQL | Thrift + Kafka |
| **Notification Service** | Like/reply/follow/mention notifications, push fanout | PostgreSQL, Redis | Thrift + Kafka |
| **Search Service** | Earlybird-style people/post search, typeahead | Elasticsearch | HTTP + Kafka indexer |
| **Media Service** | Upload, transcoding, CDN URL generation | S3-compatible, PostgreSQL | HTTP |
| **Moderation Service** | Visibility filtering, report handling, safety labels | PostgreSQL | Thrift + Kafka |
| **Home Mixer** | For You orchestration: candidate sourcing → ranking → filtering | Redis (feature cache) | Thrift to Recs + Timeline |
| **Recs Serving (Rust)** | Low-latency model inference, feature hydration | Redis, in-memory stores | gRPC |

## Timeline Strategy (Fanout-on-Write + Pull)

OffMe uses a hybrid timeline model identical to X's approach:

### Fanout-on-Write (Push)
When a user with **< 10,000 followers** posts:
1. Post Service writes to Cassandra `posts` table
2. Publishes `PostCreated` event to Kafka topic `offme.posts.created`
3. Timeline Service consumer reads event, fetches follower list from Graph Service
4. Writes post ID to each follower's `home_timeline` Cassandra row (bounded fanout batch)
5. Redis caches hot timelines for sub-millisecond reads

### Fanout-on-Read (Pull)
When a **celebrity** (>10K followers) posts:
1. Post is stored normally
2. Timeline Service does NOT fan out to all followers
3. On home timeline read, Timeline Service merges:
   - Pushed entries from `home_timeline` table
   - Pulled entries from followed celebrities via `user_timeline` table

### For You Timeline
Home Mixer orchestrates a 3-stage pipeline (inspired by [the-algorithm](https://github.com/twitter/the-algorithm)):

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ 1. Candidates   │ -> │ 2. Heavy Ranker  │ -> │ 3. Heuristics   │
│                 │    │                  │    │                 │
│ - In-network    │    │ - Rust ML serve  │    │ - Dedup         │
│ - Out-network   │    │ - Feature join   │    │ - Author divers │
│ - Trending      │    │ - Multi-task     │    │ - Visibility    │
│ - SimClusters   │    │   heads          │    │ - Feedback fat. │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Event Flow: Creating a Post

```mermaid
sequenceDiagram
    participant U as User
    participant GW as API Gateway
    participant P as Post Service
    participant K as Kafka
    participant T as Timeline Service
    participant G as Graph Service
    participant C as Cassandra

    U->>GW: POST /api/v1/posts
    GW->>P: createPost (Thrift)
    P->>C: INSERT posts
    P->>K: PostCreated event
    P-->>GW: PostId
    GW-->>U: 201 Created

    K->>T: consume PostCreated
    T->>G: getFollowers(authorId)
    alt followerCount < 10K
        T->>C: fanout to home_timeline rows
        T->>T: update Redis cache
    else celebrity
        T->>C: write user_timeline only
    end

    K->>NOTIF: consume PostCreated (mentions)
    K->>SRCH: index post
```

## Scalability Notes

- **Horizontal scaling**: All stateless services scale behind K8s HPA on CPU + custom metrics (p99 latency, Kafka lag)
- **Cassandra**: Partition by `user_id` for timelines; use TWCS compaction; RF=3 in prod
- **Redis**: Pelikan-compatible caching with TTL-based timeline segments; cache stampede protection via singleflight
- **Kafka**: Partition by `author_id` for ordering guarantees; 7-day retention for replay
- **Circuit breakers**: Finagle per-host circuit breakers on all RPC paths
- **Idempotency**: Post creation uses client-supplied `idempotency_key` stored in Redis (24h TTL)

## Observability

- **Metrics**: Prometheus histograms for `rpc_latency_seconds`, `timeline_fanout_size`, `recs_rank_latency`
- **Tracing**: Zipkin B3 propagation across Finagle, gRPC, and HTTP boundaries
- **Logging**: Structured JSON logs → ELK; correlation via `trace_id`
- **SLOs**: Home timeline p99 < 200ms; post creation p99 < 500ms; For You p99 < 350ms