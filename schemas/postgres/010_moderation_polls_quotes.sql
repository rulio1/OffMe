-- OffMe — Quotes, moderation, polls

ALTER TABLE posts ADD COLUMN IF NOT EXISTS quote_of_id BIGINT REFERENCES posts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_posts_quote_of ON posts (quote_of_id) WHERE quote_of_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS blocks (
    blocker_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id),
    CONSTRAINT no_self_block CHECK (blocker_id <> blocked_id)
);

CREATE TABLE IF NOT EXISTS mutes (
    muter_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    muted_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (muter_id, muted_id),
    CONSTRAINT no_self_mute CHECK (muter_id <> muted_id)
);

CREATE TABLE IF NOT EXISTS reports (
    id              BIGSERIAL PRIMARY KEY,
    reporter_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type     VARCHAR(20) NOT NULL,
    target_id       BIGINT NOT NULL,
    reason          VARCHAR(50) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'open',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ,
    CONSTRAINT report_target_type CHECK (target_type IN ('post', 'user')),
    CONSTRAINT report_status CHECK (status IN ('open', 'resolved', 'dismissed'))
);

CREATE INDEX IF NOT EXISTS idx_reports_target ON reports (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports (reporter_id, created_at DESC);

CREATE TABLE IF NOT EXISTS polls (
    post_id         BIGINT PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
    duration_secs   INT NOT NULL DEFAULT 86400,
    ends_at         TIMESTAMPTZ NOT NULL,
    total_votes     INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS poll_options (
    id              BIGSERIAL PRIMARY KEY,
    post_id         BIGINT NOT NULL REFERENCES polls(post_id) ON DELETE CASCADE,
    position        SMALLINT NOT NULL,
    label           VARCHAR(25) NOT NULL,
    vote_count      INT NOT NULL DEFAULT 0,
    UNIQUE (post_id, position)
);

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notification_type;
ALTER TABLE notifications ADD CONSTRAINT notification_type
    CHECK (type IN ('like', 'reply', 'follow', 'repost', 'quote'));

CREATE TABLE IF NOT EXISTS poll_votes (
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id         BIGINT NOT NULL REFERENCES polls(post_id) ON DELETE CASCADE,
    option_id       BIGINT NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);