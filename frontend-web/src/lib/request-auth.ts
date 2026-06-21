import { NextRequest } from 'next/server';
import { extractBearerToken, verifyAccessToken } from './auth-server';
import { findUserById, type DbUser } from './user-repository';

export async function getRequestUser(request: NextRequest): Promise<DbUser | null> {
  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('offme_token')?.value;
  const token = extractBearerToken(authHeader) ?? cookieToken ?? null;
  if (!token) return null;

  const payload = verifyAccessToken(token);
  if (!payload) return null;

  return findUserById(Number(payload.sub));
}