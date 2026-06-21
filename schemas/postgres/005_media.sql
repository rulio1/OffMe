-- OffMe — Media assets (files in MinIO/S3, metadata in Postgres)

CREATE TABLE IF NOT EXISTS media_assets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id         BIGINT REFERENCES posts(id) ON DELETE SET NULL,
    media_type      VARCHAR(20) NOT NULL DEFAULT 'image',
    url             TEXT NOT NULL,
    storage_key     TEXT NOT NULL,
    mime_type       VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_post ON media_assets (post_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_uploader ON media_assets (uploader_id);

-- Permite posts só com imagem (texto vazio)
ALTER TABLE posts DROP CONSTRAINT IF EXISTS post_text_length;
ALTER TABLE posts ADD CONSTRAINT post_text_length CHECK (char_length(text) BETWEEN 0 AND 280);