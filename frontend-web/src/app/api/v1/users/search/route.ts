import { NextRequest } from 'next/server';
import { enforceRateLimit } from '@/lib/api-guard';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';
import { isFollowing } from '@/lib/follow-repository';
import { searchUsers, toPublicUser } from '@/lib/user-repository';

export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(request, 'users-search', 60);
  if (limited) return limited;

  try {
    const viewer = await getRequestUser(request);
    if (!viewer) return jsonError('Não autenticado', 401);

    const q = request.nextUrl.searchParams.get('q') ?? '';
    const users = await searchUsers(q);

    const results = await Promise.all(
      users.map(async (user) => {
        const following =
          user.id !== viewer.id ? await isFollowing(viewer.id, user.id) : false;
        return toPublicUser(user, { isFollowing: following });
      })
    );

    return jsonOk({ users: results });
  } catch (err) {
    console.error('[users/search]', err);
    return jsonError('Erro ao buscar usuários', 500);
  }
}