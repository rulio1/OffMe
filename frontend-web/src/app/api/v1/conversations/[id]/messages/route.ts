import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import {
  isConversationMember,
  listMessages,
  sendMessage,
  toApiMessage,
} from '@/lib/conversation-repository';
import { getRequestUser } from '@/lib/request-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const conversationId = Number(params.id);
    if (!Number.isFinite(conversationId)) return jsonError('Conversa inválida', 400);

    const member = await isConversationMember(conversationId, user.id);
    if (!member) return jsonError('Conversa não encontrada', 404);

    const before = request.nextUrl.searchParams.get('before') ?? undefined;
    const { rows, nextCursor } = await listMessages(conversationId, before);

    return jsonOk({
      messages: rows.map((row) => toApiMessage(row, user.id)),
      nextCursor,
    });
  } catch (err) {
    console.error('[conversations/messages/list]', err);
    return jsonError('Erro ao carregar mensagens', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const conversationId = Number(params.id);
    if (!Number.isFinite(conversationId)) return jsonError('Conversa inválida', 400);

    const member = await isConversationMember(conversationId, user.id);
    if (!member) return jsonError('Conversa não encontrada', 404);

    const body = await request.json();
    const text = String(body.text ?? '').trim();
    if (!text) return jsonError('Mensagem vazia', 400);
    if (text.length > 1000) return jsonError('Máximo de 1000 caracteres', 400);

    const row = await sendMessage(conversationId, user.id, text);
    return jsonOk(toApiMessage(row, user.id), 201);
  } catch (err) {
    console.error('[conversations/messages/send]', err);
    return jsonError('Erro ao enviar mensagem', 500);
  }
}