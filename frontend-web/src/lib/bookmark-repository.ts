import { query, queryOne } from './db';

export async function getBookmarkedPostIds(
  userId: number,
  postIds: number[]
): Promise<Set<number>> {
  if (postIds.length === 0) return new Set();

  const rows = await query<{ post_id: number }>(
    `SELECT post_id FROM post_bookmarks WHERE user_id = $1 AND post_id = ANY($2::bigint[])`,
    [userId, postIds]
  );

  return new Set(rows.map((r) => r.post_id));
}

export async function bookmarkPost(userId: number, postId: number): Promise<boolean> {
  const inserted = await queryOne<{ user_id: number }>(
    `INSERT INTO post_bookmarks (user_id, post_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING user_id`,
    [userId, postId]
  );
  return Boolean(inserted);
}

export async function unbookmarkPost(userId: number, postId: number): Promise<boolean> {
  const deleted = await queryOne<{ user_id: number }>(
    `DELETE FROM post_bookmarks WHERE user_id = $1 AND post_id = $2 RETURNING user_id`,
    [userId, postId]
  );
  return Boolean(deleted);
}