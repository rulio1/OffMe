import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { createList, listListsForUser, toApiList } from '@/lib/list-repository';
import { getRequestUser } from '@/lib/request-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const lists = await listListsForUser(user.id);
    return jsonOk({ lists: lists.map(toApiList) });
  } catch (err) {
    console.error('[lists/get]', err);
    return jsonError('Erro ao carregar listas', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const body = await request.json();
    const list = await createList(
      user.id,
      String(body.name ?? ''),
      body.description ? String(body.description) : undefined,
      Boolean(body.isPrivate)
    );

    return jsonOk(toApiList(list), 201);
  } catch (err) {
    if (err instanceof Error && err.message.includes('Nome')) {
      return jsonError(err.message, 400);
    }
    console.error('[lists/create]', err);
    return jsonError('Erro ao criar lista', 500);
  }
}