-- OffMe PostgreSQL Schema
-- Relational data: users, profiles, notifications, moderation, media metadata

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- IDENTITY
-- ============================================================

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    public_id       UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    username        VARCHAR(15) NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(50) NOT NULL DEFAULT '',
    bio             VARCHAR(160) NOT NULL DEFAULT '',
    avatar_url      TEXT,
    banner_url      TEXT,
    location        VARCHAR(30),
    website_url     TEXT,
    verified        BOOLEAN NOT NULL DEFAULT FALSE,
    protected       BOOLEAN NOT NULL DEFAULT FALSE,
    follower_count  INT NOT NULL DEFAULT 0,
    following_count INT NOT NULL DEFAULT 0,
    post_count      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deactivated_at  TIMESTAMPTZ,
    CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]{1,15}$')
);

CREATE INDEX idx_users_username_trgm ON users USING gin (username gin_trgm_ops);
CREATE INDEX idx_users_display_name_trgm ON users USING gin (display_name gin_trgm_ops);

CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token   VARCHAR(512) NOT NULL UNIQUE,
    device_info     JSONB,
    ip_address      INET,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ============================================================
-- GRAPH (denormalized counters; authoritative graph in Neo4j)
-- ============================================================

CREATE TABLE follows (
    follower_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followee_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, followee_id),
    CONSTRAINT no_self_follow CHECK (follower_id != followee_id)
);

CREATE INDEX idx_follows_followee ON follows(followee_id);

CREATE TABLE blocks (
    blocker_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE mutes (
    muter_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    muted_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (muter_id, muted_id)
);

-- ============================================================
-- POST METADATA (authoritative post bodies in Cassandra)
-- ============================================================

CREATE TABLE post_metadata (
    post_id         BIGINT PRIMARY KEY,
    author_id       BIGINT NOT NULL REFERENCES users(id),
    post_type       VARCHAR(20) NOT NULL DEFAULT 'text', -- text, media, poll, quote
    visibility      VARCHAR(20) NOT NULL DEFAULT 'public', -- public, followers, mentioned
    reply_to_id     BIGINT,
    quote_of_id     BIGINT,
    conversation_id BIGINT,
    language        VARCHAR(10),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_post_metadata_author ON post_metadata(author_id, created_at DESC);
CREATE INDEX idx_post_metadata_conversation ON post_metadata(conversation_id, created_at);

-- ============================================================
-- ENGAGEMENT (write-through to Cassandra counters async)
-- ============================================================

CREATE TABLE likes (
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id         BIGINT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

CREATE INDEX idx_likes_post ON likes(post_id);

CREATE TABLE reposts (
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id         BIGINT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

CREATE INDEX idx_reposts_post ON reposts(post_id);

CREATE TABLE bookmarks (
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id         BIGINT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

-- ============================================================
-- POLLS
-- ============================================================

CREATE TABLE polls (
    post_id         BIGINT PRIMARY KEY REFERENCES post_metadata(post_id),
    duration_secs   INT NOT NULL DEFAULT 86400,
    ends_at         TIMESTAMPTZ NOT NULL,
    total_votes     INT NOT NULL DEFAULT 0
);

CREATE TABLE poll_options (
    id              BIGSERIAL PRIMARY KEY,
    post_id         BIGINT NOT NULL REFERENCES polls(post_id) ON DELETE CASCADE,
    position        SMALLINT NOT NULL,
    label           VARCHAR(25) NOT NULL,
    vote_count      INT NOT NULL DEFAULT 0,
    UNIQUE (post_id, position)
);

CREATE TABLE poll_votes (
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id         BIGINT NOT NULL,
    option_id       BIGINT NOT NULL REFERENCES poll_options(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

-- ============================================================
-- MEDIA
-- ============================================================

CREATE TABLE media_assets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id     BIGINT NOT NULL REFERENCES users(id),
    post_id         BIGINT,
    media_type      VARCHAR(20) NOT NULL, -- image, video, gif
    original_url    TEXT NOT NULL,
    thumbnail_url   TEXT,
    width           INT,
    height          INT,
    duration_ms     INT,
    file_size_bytes BIGINT,
    processing_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_uploader ON media_assets(uploader_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TYPE notification_type AS ENUM (
    'like', 'repost', 'reply', 'quote', 'follow', 'mention', 'poll_ended'
);

CREATE TABLE notifications (
    id              BIGSERIAL PRIMARY KEY,
    recipient_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id        BIGINT NOT NULL REFERENCES users(id),
    type            notification_type NOT NULL,
    post_id         BIGINT,
    read            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, created_at DESC)
    WHERE NOT read;

-- ============================================================
-- MODERATION
-- ============================================================

CREATE TABLE reports (
    id              BIGSERIAL PRIMARY KEY,
    reporter_id     BIGINT NOT NULL REFERENCES users(id),
    target_type     VARCHAR(20) NOT NULL, -- post, user
    target_id       BIGINT NOT NULL,
    reason          VARCHAR(50) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'open',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);

CREATE TABLE visibility_overrides (
    post_id         BIGINT PRIMARY KEY,
    safety_label    VARCHAR(50) NOT NULL, -- spam, nsfw, violence, etc.
    applied_by      VARCHAR(20) NOT NULL DEFAULT 'automated',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRENDING
-- ============================================================

CREATE TABLE trending_topics (
    id              BIGSERIAL PRIMARY KEY,
    topic           VARCHAR(100) NOT NULL,
    tweet_volume    INT NOT NULL DEFAULT 0,
    region          VARCHAR(10) NOT NULL DEFAULT 'global',
    rank            INT NOT NULL,
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trending_region_rank ON trending_topics(region, rank, computed_at DESC);

-- ============================================================
-- ID GENERATION (Snowflake-style sequence ranges per service)
-- ============================================================

CREATE TABLE id_ranges (
    service_name    VARCHAR(50) PRIMARY KEY,
    current_id      BIGINT NOT NULL,
    max_id          BIGINT NOT NULL
);

INSERT INTO id_ranges (service_name, current_id, max_id) VALUES
    ('post-service', 1000000000000000000, 1000999999999999999),
    ('timeline-service', 2000000000000000000, 2000999999999999999);