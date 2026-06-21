import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import {
  getConversationListItem,
  getOrCreateConversation,
  listConversations,
  resolveOtherUser,
  toApiConversation,
} from '@/lib/conversation-repository';
import { getRequestUser } from '@/lib/request-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const rows = await listConversations(user.id);
    return jsonOk({ conversations: rows.map(toApiConversation) });
  } catch (err) {
    console.error('[conversations/list]', err);
    return jsonError('Erro ao carregar conversas', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const body = await request.json();
    const username = String(body.username ?? '').trim();
    if (!username) return jsonError('Informe o usuário', 400);

    const other = await resolveOtherUser(username);
    if (!other) return jsonError('Usuário não encontrado', 404);

    const conversationId = await getOrCreateConversation(user.id, other.id);
    const row = await getConversationListItem(conversationId, user.id);
    if (!row) return jsonError('Conversa não encontrada', 404);

    return jsonOk({ conversation: toApiConversation(row) }, 201);
  } catch (err) {
    if (err instanceof Error && err.message.includes('consigo mesmo')) {
      return jsonError(err.message, 400);
    }
    console.error('[conversations/create]', err);
    return jsonError('Erro ao iniciar conversa', 500);
  }
}