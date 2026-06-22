-- Pinned posts, @mention notifications

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pinned_post_id BIGINT REFERENCES posts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_pinned_post ON users (pinned_post_id) WHERE pinned_post_id IS NOT NULL;

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notification_type;
ALTER TABLE notifications ADD CONSTRAINT notification_type
    CHECK (type IN ('like', 'reply', 'follow', 'repost', 'quote', 'mention'));