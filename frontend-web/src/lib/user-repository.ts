import { query, queryOne } from './db';

export interface DbUser {
  id: number;
  public_id: string;
  username: string;
  email: string;
  password_hash: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  banner_url: string | null;
  location: string | null;
  website_url: string | null;
  verified: boolean;
  follower_count: number;
  following_count: number;
  created_at: Date;
}

const USER_SELECT = `id, public_id, username, email, password_hash, display_name, bio,
            avatar_url, banner_url, location, website_url, verified, follower_count, following_count, created_at`;

export interface CreateUserInput {
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
  referredById?: number;
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  return queryOne<DbUser>(
    `SELECT ${USER_SELECT} FROM users WHERE LOWER(email) = LOWER($1) AND deactivated_at IS NULL`,
    [email]
  );
}

export async function findUserByUsername(username: string): Promise<DbUser | null> {
  return queryOne<DbUser>(
    `SELECT ${USER_SELECT} FROM users WHERE LOWER(username) = LOWER($1) AND deactivated_at IS NULL`,
    [username]
  );
}

export async function findUserById(id: number): Promise<DbUser | null> {
  return queryOne<DbUser>(
    `SELECT ${USER_SELECT} FROM users WHERE id = $1 AND deactivated_at IS NULL`,
    [id]
  );
}

export async function createUser(input: CreateUserInput): Promise<DbUser> {
  const row = await queryOne<DbUser>(
    `INSERT INTO users (username, email, password_hash, display_name, referred_by_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${USER_SELECT}`,
    [
      input.username,
      input.email.toLowerCase(),
      input.passwordHash,
      input.displayName,
      input.referredById ?? null,
    ]
  );

  if (!row) throw new Error('Failed to create user');
  return row;
}

export function toPublicUser(user: DbUser, extra?: { isFollowing?: boolean }) {
  return {
    id: Number(user.id),
    username: user.username,
    displayName: user.display_name,
    avatarUrl: user.avatar_url || undefined,
    bannerUrl: user.banner_url || undefined,
    location: user.location || undefined,
    websiteUrl: user.website_url || undefined,
    verified: user.verified,
    bio: user.bio,
    followerCount: Number(user.follower_count),
    followingCount: Number(user.following_count),
    ...(extra?.isFollowing != null ? { isFollowing: extra.isFollowing } : {}),
  };
}

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  location?: string | null;
  websiteUrl?: string | null;
}

export async function updateUserProfile(
  userId: number,
  input: UpdateProfileInput
): Promise<DbUser | null> {
  const sets: string[] = [];
  const params: unknown[] = [userId];
  let idx = 2;

  if (input.displayName !== undefined) {
    const name = input.displayName.trim();
    if (name.length < 1 || name.length > 50) {
      throw new Error('Nome deve ter entre 1 e 50 caracteres');
    }
    sets.push(`display_name = $${idx++}`);
    params.push(name);
  }
  if (input.bio !== undefined) {
    const bio = input.bio.trim();
    if (bio.length > 160) throw new Error('Bio deve ter no máximo 160 caracteres');
    sets.push(`bio = $${idx++}`);
    params.push(bio);
  }
  if (input.avatarUrl !== undefined) {
    sets.push(`avatar_url = $${idx++}`);
    params.push(input.avatarUrl || null);
  }
  if (input.bannerUrl !== undefined) {
    sets.push(`banner_url = $${idx++}`);
    params.push(input.bannerUrl || null);
  }
  if (input.location !== undefined) {
    const location = input.location?.trim() ?? '';
    if (location.length > 30) throw new Error('Localização deve ter no máximo 30 caracteres');
    sets.push(`location = $${idx++}`);
    params.push(location || null);
  }
  if (input.websiteUrl !== undefined) {
    const website = input.websiteUrl?.trim() ?? '';
    if (website.length > 200) throw new Error('Site deve ter no máximo 200 caracteres');
    sets.push(`website_url = $${idx++}`);
    params.push(website || null);
  }

  if (sets.length === 0) return findUserById(userId);

  sets.push('updated_at = NOW()');

  return queryOne<DbUser>(
    `UPDATE users SET ${sets.join(', ')}
     WHERE id = $1 AND deactivated_at IS NULL
     RETURNING ${USER_SELECT}`,
    params
  );
}

export async function searchUsers(queryText: string, limit = 20): Promise<DbUser[]> {
  const term = queryText.trim();
  if (!term) return [];

  const pattern = `%${term}%`;
  return query<DbUser>(
    `SELECT ${USER_SELECT}
     FROM users
     WHERE deactivated_at IS NULL
       AND (username ILIKE $1 OR display_name ILIKE $1)
     ORDER BY follower_count DESC, username ASC
     LIMIT $2`,
    [pattern, limit]
  );
}

export async function suspendUser(
  userId: number,
  adminId: number,
  reason: string
): Promise<boolean> {
  const trimmed = reason.trim();
  if (!trimmed) throw new Error('Motivo da suspensão é obrigatório');

  const row = await queryOne<{ id: number }>(
    `UPDATE users
     SET deactivated_at = NOW(),
         suspended_reason = $2,
         suspended_by = $3,
         updated_at = NOW()
     WHERE id = $1 AND deactivated_at IS NULL
     RETURNING id`,
    [userId, trimmed, adminId]
  );
  return Boolean(row);
}

export async function unsuspendUser(userId: number): Promise<boolean> {
  const row = await queryOne<{ id: number }>(
    `UPDATE users
     SET deactivated_at = NULL,
         suspended_reason = NULL,
         suspended_by = NULL,
         updated_at = NOW()
     WHERE id = $1 AND deactivated_at IS NOT NULL
     RETURNING id`,
    [userId]
  );
  return Boolean(row);
}

export async function findUserByUsernameIncludingSuspended(
  username: string
): Promise<DbUser | null> {
  return queryOne<DbUser>(
    `SELECT ${USER_SELECT} FROM users WHERE LOWER(username) = LOWER($1)`,
    [username]
  );
}

export async function deactivateOwnAccount(userId: number): Promise<boolean> {
  const row = await queryOne<{ id: number }>(
    `UPDATE users
     SET deactivated_at = NOW(),
         updated_at = NOW()
     WHERE id = $1 AND deactivated_at IS NULL
     RETURNING id`,
    [userId]
  );
  return Boolean(row);
}

export async function listSuggestedUsers(viewerId: number, limit = 5): Promise<DbUser[]> {
  return query<DbUser>(
    `SELECT ${USER_SELECT}
     FROM users u
     WHERE u.deactivated_at IS NULL
       AND u.id <> $1
       AND NOT EXISTS (
         SELECT 1 FROM follows f
         WHERE f.follower_id = $1 AND f.following_id = u.id
       )
       AND NOT EXISTS (
         SELECT 1 FROM blocks b
         WHERE b.blocker_id = $1 AND b.blocked_id = u.id
       )
     ORDER BY u.follower_count DESC, u.username ASC
     LIMIT $2`,
    [viewerId, limit]
  );
}