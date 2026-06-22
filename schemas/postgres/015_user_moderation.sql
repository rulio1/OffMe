-- OffMe — User suspension metadata

ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_reason VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_by BIGINT REFERENCES users(id) ON DELETE SET NULL;