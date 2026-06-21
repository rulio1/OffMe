import { NextRequest } from 'next/server';
import { extractBearerToken, verifyAccessToken } from './auth-server';
import { findUserById, type DbUser } from './user-repository';

const USER_CACHE_TTL_MS = 60_000;
const userCache = new Map<number, { user: DbUser; expiresAt: number }>();

export async function getRequestUser(request: NextRequest): Promise<DbUser | null> {
  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('offme_token')?.value;
  const token = extractBearerToken(authHeader) ?? cookieToken ?? null;
  if (!token) return null;

  const payload = verifyAccessToken(token);
  if (!payload) return null;

  const userId = Number(payload.sub);
  const cached = userCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }

  const user = await findUserById(userId);
  if (user) {
    userCache.set(userId, { user, expiresAt: Date.now() + USER_CACHE_TTL_MS });
  }
  return user;
}