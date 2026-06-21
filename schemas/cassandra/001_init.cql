-- OffMe Cassandra Schema
-- High-write paths: posts, timelines, engagement counters

CREATE KEYSPACE IF NOT EXISTS offme
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE offme;

-- ============================================================
-- POSTS (authoritative post storage, like Twemcache-backed Tweets DB)
-- Partition: post_id | Clustering: none (single row per post)
-- ============================================================

CREATE TABLE IF NOT EXISTS posts (
    post_id         bigint PRIMARY KEY,
    author_id       bigint,
    text            text,
    post_type       text,       -- text, media, poll, quote
    visibility      text,
    reply_to_id     bigint,
    quote_of_id     bigint,
    conversation_id bigint,
    media_ids       list<uuid>,
    language        text,
    like_count      counter,
    repost_count    counter,
    reply_count     counter,
    quote_count     counter,
    bookmark_count  counter,
    view_count      counter,
    created_at      timestamp,
    updated_at      timestamp,
    deleted         boolean
);

-- User's own posts (profile timeline)
CREATE TABLE IF NOT EXISTS user_timeline (
    user_id         bigint,
    created_at      timestamp,
    post_id         bigint,
    source          text,       -- 'original' | 'repost'
    PRIMARY KEY ((user_id), created_at, post_id)
) WITH CLUSTERING ORDER BY (created_at DESC, post_id DESC);

-- ============================================================
-- HOME TIMELINE (fanout-on-write cache)
-- Partition: user_id | Clustering: created_at DESC
-- Each row is a lightweight reference; hydration happens at read time
-- ============================================================

CREATE TABLE IF NOT EXISTS home_timeline (
    user_id         bigint,
    created_at      timestamp,
    post_id         bigint,
    author_id       bigint,
    source          text,       -- 'following' | 'repost' | 'recommended'
    PRIMARY KEY ((user_id), created_at, post_id)
) WITH CLUSTERING ORDER BY (created_at DESC, post_id DESC)
  AND compaction = {'class': 'TimeWindowCompactionStrategy',
                    'compaction_window_size': 1,
                    'compaction_window_unit': 'DAYS'};

-- ============================================================
-- FOR YOU TIMELINE (precomputed recommendation slots)
-- ============================================================

CREATE TABLE IF NOT EXISTS for_you_timeline (
    user_id         bigint,
    slot            int,        -- 0..N precomputed slots
    post_id         bigint,
    score           double,
    source          text,       -- 'in_network' | 'out_network' | 'trending'
    computed_at     timestamp,
    PRIMARY KEY ((user_id), slot)
);

-- ============================================================
-- ENGAGEMENT (idempotent write paths)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_likes (
    user_id         bigint,
    created_at      timestamp,
    post_id         bigint,
    PRIMARY KEY ((user_id), created_at, post_id)
) WITH CLUSTERING ORDER BY (created_at DESC);

CREATE TABLE IF NOT EXISTS post_likers (
    post_id         bigint,
    user_id         bigint,
    created_at      timestamp,
    PRIMARY KEY ((post_id), user_id)
);

-- ============================================================
-- CONVERSATIONS (reply threads)
-- ============================================================

CREATE TABLE IF NOT EXISTS conversation_replies (
    conversation_id bigint,
    created_at      timestamp,
    post_id         bigint,
    author_id       bigint,
    PRIMARY KEY ((conversation_id), created_at, post_id)
) WITH CLUSTERING ORDER BY (created_at ASC);

-- ============================================================
-- FANOUT TRACKING (idempotency + backfill state)
-- ============================================================

CREATE TABLE IF NOT EXISTS fanout_state (
    post_id         bigint PRIMARY KEY,
    author_id       bigint,
    follower_count  int,
    fanout_type     text,       -- 'push' | 'pull'
    status          text,       -- 'pending' | 'in_progress' | 'completed'
    started_at      timestamp,
    completed_at    timestamp,
    cursor          bigint      -- last processed follower_id for resumable fanout
);

-- ============================================================
-- COUNTER TABLES (separate from posts for write isolation)
-- ============================================================

CREATE TABLE IF NOT EXISTS post_counters (
    post_id         bigint PRIMARY KEY,
    like_count      counter,
    repost_count    counter,
    reply_count     counter,
    quote_count     counter,
    bookmark_count  counter,
    view_count      counter
);