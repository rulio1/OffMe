-- Weekly email digest preference

ALTER TABLE user_notification_prefs
  ADD COLUMN IF NOT EXISTS email_digest BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE user_notification_prefs
  ADD COLUMN IF NOT EXISTS last_digest_at TIMESTAMPTZ;