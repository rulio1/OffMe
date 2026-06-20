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
  verified: boolean;
  follower_count: number;
  following_count: number;
  created_at: Date;
}

export interface CreateUserInput {
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  return queryOne<DbUser>(
    `SELECT id, public_id, username, email, password_hash, display_name, bio,
            avatar_url, verified, follower_count, following_count, created_at
     FROM users WHERE LOWER(email) = LOWER($1) AND deactivated_at IS NULL`,
    [email]
  );
}

export async function findUserByUsername(username: string): Promise<DbUser | null> {
  return queryOne<DbUser>(
    `SELECT id, public_id, username, email, password_hash, display_name, bio,
            avatar_url, verified, follower_count, following_count, created_at
     FROM users WHERE LOWER(username) = LOWER($1) AND deactivated_at IS NULL`,
    [username]
  );
}

export async function findUserById(id: number): Promise<DbUser | null> {
  return queryOne<DbUser>(
    `SELECT id, public_id, username, email, password_hash, display_name, bio,
            avatar_url, verified, follower_count, following_count, created_at
     FROM users WHERE id = $1 AND deactivated_at IS NULL`,
    [id]
  );
}

export async function createUser(input: CreateUserInput): Promise<DbUser> {
  const row = await queryOne<DbUser>(
    `INSERT INTO users (username, email, password_hash, display_name)
     VALUES ($1, $2, $3, $4)
     RETURNING id, public_id, username, email, password_hash, display_name, bio,
               avatar_url, verified, follower_count, following_count, created_at`,
    [input.username, input.email.toLowerCase(), input.passwordHash, input.displayName]
  );

  if (!row) throw new Error('Failed to create user');
  return row;
}

export function toPublicUser(user: DbUser) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    avatarUrl: user.avatar_url ?? '',
    verified: user.verified,
    bio: user.bio,
    followerCount: user.follower_count,
    followingCount: user.following_count,
  };
}