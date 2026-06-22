import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';
import { listSuggestedUsers, toPublicUser } from '@/lib/user-repository';

export async function GET(request: NextRequest) {
  try {
    const viewer = await getRequestUser(request);
    if (!viewer) return jsonError('Não autenticado', 401);

    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 5), 10);
    const users = await listSuggestedUsers(viewer.id, limit);

    return jsonOk({ users: users.map((u) => toPublicUser(u)) });
  } catch (err) {
    console.error('[users/suggestions]', err);
    return jsonError('Erro ao carregar sugestões', 500);
  }
}