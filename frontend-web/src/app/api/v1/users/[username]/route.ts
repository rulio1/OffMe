import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';
import { isFollowing } from '@/lib/follow-repository';
import { findUserByUsername, toPublicUser } from '@/lib/user-repository';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const viewer = await getRequestUser(request);
    if (!viewer) return jsonError('Não autenticado', 401);

    const user = await findUserByUsername(params.username);
    if (!user) return jsonError('Usuário não encontrado', 404);

    const following =
      user.id !== viewer.id ? await isFollowing(viewer.id, user.id) : false;

    return jsonOk({
      user: toPublicUser(user, { isFollowing: following }),
      isOwnProfile: user.id === viewer.id,
    });
  } catch (err) {
    console.error('[users/get]', err);
    return jsonError('Erro ao carregar perfil', 500);
  }
}