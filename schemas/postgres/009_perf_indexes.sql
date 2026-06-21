-- Performance indexes for hot queries

CREATE INDEX IF NOT EXISTS idx_posts_reply_to_created
  ON posts (reply_to_id, created_at DESC, id DESC)
  WHERE reply_to_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_posts_created_id
  ON posts (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_posts_text_trgm
  ON posts USING gin (text gin_trgm_ops);