import { query, queryOne } from './db';

export interface DbMediaAsset {
  id: string;
  uploader_id: number;
  post_id: number | null;
  media_type: string;
  url: string;
  storage_key: string;
  mime_type: string;
  file_size_bytes: number;
  created_at: Date;
}

export async function createMediaAsset(input: {
  uploaderId: number;
  url: string;
  storageKey: string;
  mimeType: string;
  fileSizeBytes: number;
  postId?: number;
}): Promise<DbMediaAsset> {
  const row = await queryOne<DbMediaAsset>(
    `INSERT INTO media_assets (uploader_id, post_id, media_type, url, storage_key, mime_type, file_size_bytes)
     VALUES ($1, $2, 'image', $3, $4, $5, $6)
     RETURNING id, uploader_id, post_id, media_type, url, storage_key, mime_type, file_size_bytes, created_at`,
    [
      input.uploaderId,
      input.postId ?? null,
      input.url,
      input.storageKey,
      input.mimeType,
      input.fileSizeBytes,
    ]
  );
  if (!row) throw new Error('Failed to create media asset');
  return row;
}

export async function linkMediaToPost(
  mediaIds: string[],
  postId: number,
  uploaderId: number
): Promise<void> {
  if (mediaIds.length === 0) return;

  await query(
    `UPDATE media_assets
     SET post_id = $1
     WHERE id = ANY($2::uuid[]) AND uploader_id = $3 AND post_id IS NULL`,
    [postId, mediaIds, uploaderId]
  );
}

export async function getMediaUrlsByPostIds(postIds: number[]): Promise<Map<number, string[]>> {
  if (postIds.length === 0) return new Map();

  const rows = await query<{ post_id: number; url: string }>(
    `SELECT post_id, url FROM media_assets
     WHERE post_id = ANY($1::bigint[])
     ORDER BY created_at ASC`,
    [postIds]
  );

  const map = new Map<number, string[]>();
  for (const row of rows) {
    const list = map.get(row.post_id) ?? [];
    list.push(row.url);
    map.set(row.post_id, list);
  }
  return map;
}

export function toApiMedia(row: DbMediaAsset) {
  return {
    id: row.id,
    url: row.url,
    mimeType: row.mime_type,
    fileSizeBytes: Number(row.file_size_bytes),
  };
}