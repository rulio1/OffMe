use axum::response::IntoResponse;
use prometheus::{Encoder, TextEncoder, Histogram, IntCounter, opts, register_histogram, register_int_counter};

lazy_static::lazy_static! {
    pub static ref RANK_LATENCY: Histogram = register_histogram!(
        opts!("offme_recs_rank_latency_ms", "Ranking pipeline latency in ms")
            .buckets(vec![1.0, 5.0, 10.0, 25.0, 50.0, 100.0, 250.0])
    ).unwrap();

    pub static ref RANK_REQUESTS: IntCounter = register_int_counter!(
        opts!("offme_recs_rank_requests_total", "Total rank requests")
    ).unwrap();
}

pub async fn handler() -> impl IntoResponse {
    let encoder = TextEncoder::new();
    let metric_families = prometheus::gather();
    let mut buffer = Vec::new();
    encoder.encode(&metric_families, &mut buffer).unwrap();
    (
        [(axum::http::header::CONTENT_TYPE, encoder.format_type())],
        buffer,
    )
}