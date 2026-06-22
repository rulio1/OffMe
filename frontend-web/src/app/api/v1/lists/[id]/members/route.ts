import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { addListMember } from '@/lib/list-repository';
import { getRequestUser } from '@/lib/request-auth';
import { findUserByUsername } from '@/lib/user-repository';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const listId = Number(params.id);
    if (!Number.isFinite(listId)) return jsonError('Lista inválida', 400);

    const body = await request.json();
    const username = String(body.username ?? '').trim();
    if (!username) return jsonError('Usuário é obrigatório', 400);

    const member = await findUserByUsername(username);
    if (!member) return jsonError('Usuário não encontrado', 404);

    const ok = await addListMember(listId, user.id, member.id);
    if (!ok) return jsonError('Sem permissão ou lista não encontrada', 403);

    return jsonOk({ added: true, userId: member.id, username: member.username });
  } catch (err) {
    console.error('[lists/members]', err);
    return jsonError('Erro ao adicionar membro', 500);
  }
}