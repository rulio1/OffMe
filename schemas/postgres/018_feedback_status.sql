-- Admin workflow for beta feedback

ALTER TABLE beta_feedback
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'open';

ALTER TABLE beta_feedback
  ADD COLUMN IF NOT EXISTS admin_note TEXT;

ALTER TABLE beta_feedback
  DROP CONSTRAINT IF EXISTS beta_feedback_status_check;

ALTER TABLE beta_feedback
  ADD CONSTRAINT beta_feedback_status_check
  CHECK (status IN ('open', 'resolved', 'dismissed'));

CREATE INDEX IF NOT EXISTS idx_beta_feedback_status ON beta_feedback (status, created_at DESC);