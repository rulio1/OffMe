import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { findListById, listMembers, toApiList } from '@/lib/list-repository';
import { getRequestUser } from '@/lib/request-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const listId = Number(params.id);
    if (!Number.isFinite(listId)) return jsonError('Lista inválida', 400);

    const list = await findListById(listId, user.id);
    if (!list) return jsonError('Lista não encontrada', 404);

    const members = await listMembers(listId, user.id);
    return jsonOk({ list: toApiList(list), members });
  } catch (err) {
    console.error('[lists/get-id]', err);
    return jsonError('Erro ao carregar lista', 500);
  }
}