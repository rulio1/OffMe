import { cookies } from 'next/headers';
import { verifyAccessToken } from './auth-server';
import { findUserById, type DbUser } from './user-repository';

export async function getServerUser(): Promise<DbUser | null> {
  const token = cookies().get('offme_token')?.value;
  if (!token) return null;

  const payload = verifyAccessToken(token);
  if (!payload) return null;

  return findUserById(Number(payload.sub));
}