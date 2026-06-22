-- Beta feedback from testers

CREATE TABLE IF NOT EXISTS beta_feedback (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES users(id) ON DELETE SET NULL,
    category    VARCHAR(30) NOT NULL DEFAULT 'general',
    message     TEXT NOT NULL,
    page_url    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT beta_feedback_message_len CHECK (char_length(message) BETWEEN 5 AND 2000)
);

CREATE INDEX IF NOT EXISTS idx_beta_feedback_created ON beta_feedback (created_at DESC);