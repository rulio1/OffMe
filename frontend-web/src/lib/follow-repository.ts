import { query, queryOne } from './db';

export async function isFollowing(followerId: number, followingId: number): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2
     ) AS exists`,
    [followerId, followingId]
  );
  return row?.exists ?? false;
}

export async function followUser(followerId: number, followingId: number): Promise<boolean> {
  if (followerId === followingId) return false;

  const inserted = await queryOne<{ follower_id: number }>(
    `INSERT INTO follows (follower_id, following_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING follower_id`,
    [followerId, followingId]
  );

  if (!inserted) return false;

  await query(
    `UPDATE users SET following_count = following_count + 1, updated_at = NOW() WHERE id = $1`,
    [followerId]
  );
  await query(
    `UPDATE users SET follower_count = follower_count + 1, updated_at = NOW() WHERE id = $1`,
    [followingId]
  );

  return true;
}

export async function unfollowUser(followerId: number, followingId: number): Promise<boolean> {
  const deleted = await queryOne<{ follower_id: number }>(
    `DELETE FROM follows WHERE follower_id = $1 AND following_id = $2 RETURNING follower_id`,
    [followerId, followingId]
  );

  if (!deleted) return false;

  await query(
    `UPDATE users SET following_count = GREATEST(following_count - 1, 0), updated_at = NOW() WHERE id = $1`,
    [followerId]
  );
  await query(
    `UPDATE users SET follower_count = GREATEST(follower_count - 1, 0), updated_at = NOW() WHERE id = $1`,
    [followingId]
  );

  return true;
}