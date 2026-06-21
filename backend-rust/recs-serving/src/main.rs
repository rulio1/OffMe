//! OffMe Recs Serving — Navi-inspired low-latency model inference.
//!
//! 3-stage pipeline (called by Home Mixer via gRPC):
//!   1. Feature hydration from Redis
//!   2. Multi-task neural ranker inference
//!   3. Score aggregation + candidate return

mod pipeline;
mod features;
mod ranker;
mod metrics;

use axum::{routing::get, Router, Json};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(Debug, Deserialize)]
struct RankRequest {
    user_id: i64,
    candidate_post_ids: Vec<i64>,
    candidate_author_ids: Vec<i64>,
    request_id: String,
}

#[derive(Debug, Serialize)]
struct RankedCandidate {
    post_id: i64,
    score: f64,
    p_like: f64,
    p_repost: f64,
    p_reply: f64,
    p_click: f64,
    p_dwell: f64,
}

#[derive(Debug, Serialize)]
struct RankResponse {
    ranked: Vec<RankedCandidate>,
    latency_ms: u64,
    model_version: String,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .with(tracing_subscriber::fmt::layer())
        .init();

    let redis_url = std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".into());
    let pipeline = pipeline::RecsPipeline::new(&redis_url).await.expect("Failed to init pipeline");

    let app = Router::new()
        .route("/health", get(|| async { "ok" }))
        .route("/metrics", get(metrics::handler))
        .route("/v1/rank", axum::routing::post(rank_handler))
        .with_state(pipeline);

    let addr = SocketAddr::from(([0, 0, 0, 0], 8090));
    tracing::info!("Recs serving on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn rank_handler(
    axum::extract::State(pipeline): axum::extract::State<pipeline::RecsPipeline>,
    Json(req): Json<RankRequest>,
) -> Json<RankResponse> {
    let start = std::time::Instant::now();
    let ranked = pipeline.rank(&req).await;
    let latency_ms = start.elapsed().as_millis() as u64;

    metrics::RANK_LATENCY.observe(latency_ms as f64);
    metrics::RANK_REQUESTS.inc();

    Json(RankResponse {
        ranked,
        latency_ms,
        model_version: "offme-ranker-v1".into(),
    })
}