import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { listFollowers, usersToPublic } from '@/lib/follow-repository';
import { findUserByUsername } from '@/lib/user-repository';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const user = await findUserByUsername(params.username);
    if (!user) return jsonError('Usuário não encontrado', 404);

    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 50), 100);
    const rows = await listFollowers(params.username, limit);
    return jsonOk({ users: usersToPublic(rows) });
  } catch (err) {
    console.error('[users/followers]', err);
    return jsonError('Erro ao carregar seguidores', 500);
  }
}