-- OffMe — Scheduled posts

ALTER TABLE posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'published';

UPDATE posts SET status = 'published', published_at = created_at WHERE status IS NULL OR published_at IS NULL;

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts ADD CONSTRAINT posts_status_check
  CHECK (status IN ('draft','scheduled','published','failed'));

CREATE INDEX IF NOT EXISTS idx_posts_scheduled
  ON posts (scheduled_at)
  WHERE status = 'scheduled';