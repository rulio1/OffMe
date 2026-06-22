import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { findCommunityBySlug, listCommunityTimeline } from '@/lib/community-repository';
import { enrichTimelineEntries } from '@/lib/post-enrichment';
import { getRequestUser } from '@/lib/request-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const community = await findCommunityBySlug(params.slug);
    if (!community) return jsonError('Comunidade não encontrada', 404);

    const cursor = request.nextUrl.searchParams.get('cursor') ?? undefined;
    const { rows, nextCursor } = await listCommunityTimeline(community.id, cursor);
    const entries = await enrichTimelineEntries(rows, user.id, 'recommended');

    return jsonOk({
      community: { id: community.id, slug: community.slug, name: community.name },
      entries,
      nextCursor,
    });
  } catch (err) {
    console.error('[communities/timeline]', err);
    return jsonError('Erro ao carregar timeline da comunidade', 500);
  }
}