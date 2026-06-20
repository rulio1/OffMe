"""
Pulse Home Mixer — recommendation orchestrator outline.

Mirrors X's the-algorithm Home Mixer pipeline:
  1. Candidate Generation (multiple sources)
  2. Feature Hydration
  3. Heavy Ranker (Rust serving)
  4. Light Ranker / Heuristics
  5. Visibility Filtering
  6. Tweet Mixer (dedup, author diversity, feedback fatigue)

Training happens offline in this Python package; serving via backend-rust/recs-serving.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
import httpx


class CandidateSource(str, Enum):
    IN_NETWORK = "in_network"       # Followed accounts, SimClusters
    OUT_OF_NETWORK = "out_of_network"  # Graph traversal, embeddings
    TRENDING = "trending"           # Trending topic injection
    RECENT_ENGAGEMENT = "recent_engagement"  # Liked/replied authors


@dataclass
class Candidate:
    post_id: int
    author_id: int
    source: CandidateSource
    raw_score: float = 0.0


@dataclass
class RankedPost:
    post_id: int
    score: float
    p_like: float
    p_repost: float
    p_reply: float


@dataclass
class HomeMixerConfig:
    max_candidates: int = 1500
    return_count: int = 50
    recs_serving_url: str = "http://localhost:8090"
    author_diversity_max: int = 3  # max posts per author in final feed
    dedup_window_hours: int = 24


class CandidateSourcer:
    """Stage 1: Aggregate candidates from multiple sources."""

    def in_network(self, user_id: int, limit: int = 800) -> list[Candidate]:
        # Pull from Timeline Service + SimClusters
        return [
            Candidate(post_id=i, author_id=i % 100, source=CandidateSource.IN_NETWORK)
            for i in range(limit)
        ]

    def out_of_network(self, user_id: int, limit: int = 400) -> list[Candidate]:
        # Graph-based discovery: friends-of-friends, embedding similarity
        return [
            Candidate(post_id=10_000 + i, author_id=200 + i, source=CandidateSource.OUT_OF_NETWORK)
            for i in range(limit)
        ]

    def trending(self, region: str = "global", limit: int = 100) -> list[Candidate]:
        return [
            Candidate(post_id=20_000 + i, author_id=300 + i, source=CandidateSource.TRENDING, raw_score=1.0 - i * 0.01)
            for i in range(limit)
        ]

    def gather_all(self, user_id: int, config: HomeMixerConfig) -> list[Candidate]:
        candidates = []
        candidates.extend(self.in_network(user_id, 800))
        candidates.extend(self.out_of_network(user_id, 400))
        candidates.extend(self.trending(limit=100))
        return candidates[: config.max_candidates]


class HeavyRankerClient:
    """Stage 2: Call Rust recs-serving for multi-task model inference."""

    def __init__(self, base_url: str):
        self.base_url = base_url

    async def rank(self, user_id: int, candidates: list[Candidate]) -> list[RankedPost]:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/v1/rank",
                json={
                    "user_id": user_id,
                    "candidate_post_ids": [c.post_id for c in candidates],
                    "candidate_author_ids": [c.author_id for c in candidates],
                    "request_id": f"hm-{user_id}",
                },
                timeout=0.1,  # 100ms SLO
            )
            resp.raise_for_status()
            data = resp.json()
            return [
                RankedPost(
                    post_id=r["post_id"],
                    score=r["score"],
                    p_like=r["p_like"],
                    p_repost=r["p_repost"],
                    p_reply=r["p_reply"],
                )
                for r in data["ranked"]
            ]


class HeuristicFilter:
    """Stage 3: Post-ranking filters — dedup, diversity, visibility, fatigue."""

    def __init__(self, config: HomeMixerConfig):
        self.config = config
        self._seen_posts: set[int] = set()
        self._author_counts: dict[int, int] = {}

    def apply(self, ranked: list[RankedPost], candidates: list[Candidate]) -> list[RankedPost]:
        author_map = {c.post_id: c.author_id for c in candidates}
        result = []

        for post in ranked:
            author_id = author_map.get(post.post_id, 0)

            if post.post_id in self._seen_posts:
                continue

            if self._author_counts.get(author_id, 0) >= self.config.author_diversity_max:
                continue

            result.append(post)
            self._seen_posts.add(post.post_id)
            self._author_counts[author_id] = self._author_counts.get(author_id, 0) + 1

            if len(result) >= self.config.return_count:
                break

        return result


class HomeMixer:
    """Full For You pipeline orchestrator."""

    def __init__(self, config: Optional[HomeMixerConfig] = None):
        self.config = config or HomeMixerConfig()
        self.sourcer = CandidateSourcer()
        self.ranker = HeavyRankerClient(self.config.recs_serving_url)
        self.filter = HeuristicFilter(self.config)

    async def get_for_you(self, user_id: int) -> list[RankedPost]:
        candidates = self.sourcer.gather_all(user_id, self.config)
        ranked = await self.ranker.rank(user_id, candidates)
        return self.filter.apply(ranked, candidates)