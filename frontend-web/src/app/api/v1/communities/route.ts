import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { createCommunity, listCommunities, toApiCommunity } from '@/lib/community-repository';
import { getRequestUser } from '@/lib/request-auth';

export async function GET() {
  try {
    const communities = await listCommunities();
    return jsonOk({ communities: communities.map(toApiCommunity) });
  } catch (err) {
    console.error('[communities/get]', err);
    return jsonError('Erro ao carregar comunidades', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const body = await request.json();
    const community = await createCommunity(
      user.id,
      String(body.name ?? ''),
      body.description ? String(body.description) : undefined
    );

    return jsonOk(toApiCommunity(community), 201);
  } catch (err) {
    if (err instanceof Error && err.message.includes('Nome')) {
      return jsonError(err.message, 400);
    }
    console.error('[communities/create]', err);
    return jsonError('Erro ao criar comunidade', 500);
  }
}