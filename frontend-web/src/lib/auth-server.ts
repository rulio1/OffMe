import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { createSession, deleteSession, findSessionByRefreshToken } from './session-repository';
import { findUserById, toPublicUser, type DbUser } from './user-repository';

const JWT_SECRET = process.env.JWT_SECRET || 'offme_dev_secret_change_in_production';
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_DAYS = 30;
const BCRYPT_ROUNDS = 12;

export interface TokenPayload {
  sub: string;
  username: string;
  type: 'access';
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: ReturnType<typeof toPublicUser>;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(user: DbUser): string {
  const payload: TokenPayload & { role: string; aud: string } = {
    sub: String(user.id),
    username: user.username,
    type: 'access',
    // Claims exigidos pelo Supabase Realtime (RLS + postgres_changes)
    role: 'authenticated',
    aud: 'authenticated',
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    if (decoded.type !== 'access') return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function issueAuthTokens(user: DbUser, ipAddress?: string): Promise<AuthResult> {
  const accessToken = signAccessToken(user);
  const refreshToken = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

  await createSession(user.id, refreshToken, expiresAt, ipAddress);

  return {
    accessToken,
    refreshToken,
    user: toPublicUser(user),
  };
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  await deleteSession(refreshToken);
}

export async function refreshAuthTokens(refreshToken: string): Promise<AuthResult | null> {
  const session = await findSessionByRefreshToken(refreshToken);
  if (!session) return null;

  const user = await findUserById(session.user_id);
  if (!user) return null;

  return {
    accessToken: signAccessToken(user),
    refreshToken,
    user: toPublicUser(user),
  };
}

export function extractBearerToken(header: string | null): string | null {
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}