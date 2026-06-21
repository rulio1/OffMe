-- OffMe — Bookmarks & reposts

CREATE TABLE IF NOT EXISTS post_bookmarks (
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id         BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_bookmarks_user ON post_bookmarks (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS post_reposts (
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id         BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_reposts_user ON post_reposts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_reposts_post ON post_reposts (post_id);

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notification_type;
ALTER TABLE notifications ADD CONSTRAINT notification_type
    CHECK (type IN ('like', 'reply', 'follow', 'repost'));