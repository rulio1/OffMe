import { query, queryOne } from './db';

export interface DbSession {
  id: string;
  user_id: number;
  refresh_token: string;
  expires_at: Date;
}

export async function createSession(
  userId: number,
  refreshToken: string,
  expiresAt: Date,
  ipAddress?: string
): Promise<void> {
  await query(
    `INSERT INTO sessions (user_id, refresh_token, expires_at, ip_address)
     VALUES ($1, $2, $3, $4)`,
    [userId, refreshToken, expiresAt, ipAddress ?? null]
  );
}

export async function findSessionByRefreshToken(token: string): Promise<DbSession | null> {
  return queryOne<DbSession>(
    `SELECT id, user_id, refresh_token, expires_at
     FROM sessions
     WHERE refresh_token = $1 AND expires_at > NOW()`,
    [token]
  );
}

export async function deleteSession(refreshToken: string): Promise<void> {
  await query(`DELETE FROM sessions WHERE refresh_token = $1`, [refreshToken]);
}

export async function deleteAllUserSessions(userId: number): Promise<void> {
  await query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
}

export async function cleanupExpiredSessions(): Promise<void> {
  await query(`DELETE FROM sessions WHERE expires_at <= NOW()`);
}