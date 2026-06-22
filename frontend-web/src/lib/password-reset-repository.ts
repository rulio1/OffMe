import { createHash, randomBytes } from 'crypto';
import { query, queryOne } from './db';
import { hashPassword } from './auth-server';
import { findUserByEmail } from './user-repository';

const TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createPasswordResetToken(email: string): Promise<{
  token: string;
  userId: number;
} | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await query(`DELETE FROM password_reset_tokens WHERE user_id = $1 AND used_at IS NULL`, [
    user.id,
  ]);

  await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [user.id, tokenHash, expiresAt]
  );

  return { token, userId: user.id };
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<boolean> {
  const tokenHash = hashToken(token.trim());
  const row = await queryOne<{ id: string; user_id: number }>(
    `SELECT id, user_id FROM password_reset_tokens
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [tokenHash]
  );
  if (!row) return false;

  const passwordHash = await hashPassword(newPassword);
  await query(`UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1`, [
    row.user_id,
    passwordHash,
  ]);
  await query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`, [row.id]);
  return true;
}