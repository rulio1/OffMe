-- OffMe — Lists & communities

CREATE TABLE IF NOT EXISTS lists (
  id BIGSERIAL PRIMARY KEY,
  owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(200),
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lists_owner ON lists (owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS list_members (
  list_id BIGINT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (list_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_list_members_user ON list_members (user_id);

CREATE TABLE IF NOT EXISTS communities (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(500),
  creator_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT community_slug_format CHECK (slug ~ '^[a-z0-9_-]{2,50}$')
);

CREATE INDEX IF NOT EXISTS idx_communities_creator ON communities (creator_id);

CREATE TABLE IF NOT EXISTS community_members (
  community_id BIGINT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id),
  CONSTRAINT community_member_role CHECK (role IN ('member','moderator','admin'))
);

CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members (user_id);

ALTER TABLE posts ADD COLUMN IF NOT EXISTS community_id BIGINT REFERENCES communities(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_posts_community ON posts (community_id, created_at DESC) WHERE community_id IS NOT NULL;