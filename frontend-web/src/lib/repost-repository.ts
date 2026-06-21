import { query, queryOne } from './db';

export async function getRepostedPostIds(
  userId: number,
  postIds: number[]
): Promise<Set<number>> {
  if (postIds.length === 0) return new Set();

  const rows = await query<{ post_id: number }>(
    `SELECT post_id FROM post_reposts WHERE user_id = $1 AND post_id = ANY($2::bigint[])`,
    [userId, postIds]
  );

  return new Set(rows.map((r) => r.post_id));
}

export async function repostPost(userId: number, postId: number): Promise<boolean> {
  const inserted = await queryOne<{ user_id: number }>(
    `INSERT INTO post_reposts (user_id, post_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING user_id`,
    [userId, postId]
  );

  if (!inserted) return false;

  await query(`UPDATE posts SET repost_count = repost_count + 1 WHERE id = $1`, [postId]);
  return true;
}

export async function unrepostPost(userId: number, postId: number): Promise<boolean> {
  const deleted = await queryOne<{ user_id: number }>(
    `DELETE FROM post_reposts WHERE user_id = $1 AND post_id = $2 RETURNING user_id`,
    [userId, postId]
  );

  if (!deleted) return false;

  await query(
    `UPDATE posts SET repost_count = GREATEST(repost_count - 1, 0) WHERE id = $1`,
    [postId]
  );
  return true;
}