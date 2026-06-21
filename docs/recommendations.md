# OffMe Recommendation System

## Overview

OffMe's For You feed uses a 3-stage pipeline directly inspired by X's [Home Mixer](https://github.com/twitter/the-algorithm/tree/main/home-mixer) and [Product Mixer](https://github.com/twitter/the-algorithm/tree/main/product-mixer) frameworks.

## Pipeline Stages

### Stage 1: Candidate Generation

Multiple independent sources produce ~1500 candidates:

| Source | Method | Limit |
|--------|--------|-------|
| In-Network | Followed accounts + SimClusters | 800 |
| Out-of-Network | Graph traversal, embedding similarity | 400 |
| Trending | Regional trending topic injection | 100 |
| Recent Engagement | Authors from recent likes/replies | 200 |

Implementation: `backend-python/ml-training/pipelines/home_mixer.py` → `CandidateSourcer`

### Stage 2: Heavy Ranking

Multi-task neural network predicts 5 engagement probabilities per candidate:

- P(favorite | impression)
- P(retweet | impression)
- P(reply | impression)
- P(click | impression)
- P(dwell > threshold | impression)

Final score = weighted sum:
```
score = 0.30·P(like) + 0.20·P(repost) + 0.15·P(reply) + 0.20·P(click) + 0.15·P(dwell)
```

- **Training**: `backend-python/ml-training/models/heavy_ranker.py` (PyTorch)
- **Serving**: `backend-rust/recs-serving/` (<10ms p99 via Rust + Redis feature cache)
- **Export**: TorchScript → ONNX for production inference

### Stage 3: Heuristics & Filtering

Post-ranking filters applied in order:

1. **Deduplication**: Remove posts seen in last 24h
2. **Author diversity**: Max 3 posts per author in final feed
3. **Visibility filtering**: Moderation labels, blocked/muted authors
4. **Feedback fatigue**: Demote repeatedly dismissed content types
5. **Social proof**: Boost posts with engagement from followed accounts

Implementation: `HeuristicFilter` in `home_mixer.py`

## Feature Store (Redis)

| Key Pattern | Features |
|-------------|----------|
| `feat:user:{id}` | follower_count, avg_dwell, likes_per_day, languages |
| `feat:post:{id}` | age_hours, engagement counts, has_media, text_length |
| `feat:author:{id}` | follower_count, verified, avg_engagement_rate |

Features computed by offline Spark/Flink jobs from Kafka engagement events.

## Model Training Pipeline

```
Kafka engagement events
    → Feature engineering (Spark)
    → Training data (Parquet)
    → HeavyRankerModel.train (PyTorch)
    → MLflow experiment tracking
    → Export TorchScript
    → Deploy to recs-serving (Rust)
```

## SLOs

| Metric | Target |
|--------|--------|
| Rank latency p99 | < 10ms |
| End-to-end For You | < 350ms |
| Candidate count | 1500 |
| Return count | 50 |
| Model refresh | Daily |