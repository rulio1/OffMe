import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { findCommunityBySlug, joinCommunity, toApiCommunity } from '@/lib/community-repository';
import { getRequestUser } from '@/lib/request-auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const community = await findCommunityBySlug(params.slug);
    if (!community) return jsonError('Comunidade não encontrada', 404);
    return jsonOk({ community: toApiCommunity(community) });
  } catch (err) {
    console.error('[communities/get-slug]', err);
    return jsonError('Erro ao carregar comunidade', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const community = await findCommunityBySlug(params.slug);
    if (!community) return jsonError('Comunidade não encontrada', 404);

    await joinCommunity(community.id, user.id);
    return jsonOk({ joined: true, communityId: community.id });
  } catch (err) {
    console.error('[communities/join]', err);
    return jsonError('Erro ao entrar na comunidade', 500);
  }
}