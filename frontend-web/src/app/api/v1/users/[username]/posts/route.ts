import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';
import { enrichTimelineEntries } from '@/lib/post-enrichment';
import { listByAuthor } from '@/lib/post-repository';
import { findUserByUsername } from '@/lib/user-repository';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const viewer = await getRequestUser(request);

    const user = await findUserByUsername(params.username);
    if (!user) return jsonError('Usuário não encontrado', 404);

    const cursor = request.nextUrl.searchParams.get('cursor') ?? undefined;
    const { rows, nextCursor } = await listByAuthor(user.id, cursor, undefined, viewer?.id);
    const entries = await enrichTimelineEntries(rows, viewer?.id, 'following');

    return jsonOk({ entries, nextCursor });
  } catch (err) {
    console.error('[users/posts]', err);
    return jsonError('Erro ao carregar posts', 500);
  }
}