import { NextRequest } from 'next/server';
import { enforceRateLimit } from '@/lib/api-guard';
import { jsonError, jsonOk } from '@/lib/api-response';
import { enrichPosts } from '@/lib/post-enrichment';
import { getTrendingPosts, searchPosts } from '@/lib/post-repository';
import { getRequestUser } from '@/lib/request-auth';

export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(request, 'posts-search', 60);
  if (limited) return limited;

  try {
    const viewer = await getRequestUser(request);
    if (!viewer) return jsonError('Não autenticado', 401);

    const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
    const trending = request.nextUrl.searchParams.get('trending') === '1';

    if (trending && !q) {
      const rows = await getTrendingPosts(12);
      const posts = await enrichPosts(rows, viewer.id);
      return jsonOk({ posts, trending: true });
    }

    if (!q) return jsonOk({ posts: [] });

    const rows = await searchPosts(q);
    const posts = await enrichPosts(rows, viewer.id);
    return jsonOk({ posts });
  } catch (err) {
    console.error('[posts/search]', err);
    return jsonError('Erro ao buscar posts', 500);
  }
}