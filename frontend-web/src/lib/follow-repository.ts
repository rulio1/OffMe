import { query, queryOne } from './db';
import { toPublicUser, type DbUser } from './user-repository';

const USER_LIST_SELECT = `u.id, u.public_id, u.username, u.email, u.password_hash, u.display_name, u.bio,
  u.avatar_url, u.banner_url, u.location, u.website_url, u.verified, u.follower_count, u.following_count,
  u.post_count, u.created_at`;

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

export async function listFollowers(username: string, limit = 50): Promise<DbUser[]> {
  return query<DbUser>(
    `SELECT ${USER_LIST_SELECT}
     FROM follows f
     JOIN users u ON u.id = f.follower_id
     JOIN users target ON target.id = f.following_id
     WHERE LOWER(target.username) = LOWER($1) AND u.deactivated_at IS NULL
     ORDER BY f.created_at DESC
     LIMIT $2`,
    [username, limit]
  );
}

export async function listFollowing(username: string, limit = 50): Promise<DbUser[]> {
  return query<DbUser>(
    `SELECT ${USER_LIST_SELECT}
     FROM follows f
     JOIN users u ON u.id = f.following_id
     JOIN users target ON target.id = f.follower_id
     WHERE LOWER(target.username) = LOWER($1) AND u.deactivated_at IS NULL
     ORDER BY f.created_at DESC
     LIMIT $2`,
    [username, limit]
  );
}

export function usersToPublic(users: DbUser[]) {
  return users.map((u) => toPublicUser(u));
}