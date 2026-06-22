-- OffMe — Verification requests and admin flag

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS verification_requests (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason          TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at     TIMESTAMPTZ,
    reviewed_by     BIGINT REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT verification_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_status
    ON verification_requests (status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_requests_user_pending
    ON verification_requests (user_id) WHERE status = 'pending';