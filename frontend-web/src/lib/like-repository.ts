import { query, queryOne } from './db';

export async function isPostLiked(userId: number, postId: number): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM post_likes WHERE user_id = $1 AND post_id = $2
     ) AS exists`,
    [userId, postId]
  );
  return row?.exists ?? false;
}

export async function getLikedPostIds(userId: number, postIds: number[]): Promise<Set<number>> {
  if (postIds.length === 0) return new Set();

  const rows = await query<{ post_id: number }>(
    `SELECT post_id FROM post_likes WHERE user_id = $1 AND post_id = ANY($2::bigint[])`,
    [userId, postIds]
  );

  return new Set(rows.map((r) => r.post_id));
}

export async function likePost(userId: number, postId: number): Promise<boolean> {
  const inserted = await queryOne<{ user_id: number }>(
    `INSERT INTO post_likes (user_id, post_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING user_id`,
    [userId, postId]
  );

  if (!inserted) return false;

  await query(
    `UPDATE posts SET like_count = like_count + 1 WHERE id = $1`,
    [postId]
  );

  return true;
}

export async function unlikePost(userId: number, postId: number): Promise<boolean> {
  const deleted = await queryOne<{ user_id: number }>(
    `DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2 RETURNING user_id`,
    [userId, postId]
  );

  if (!deleted) return false;

  await query(
    `UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1`,
    [postId]
  );

  return true;
}