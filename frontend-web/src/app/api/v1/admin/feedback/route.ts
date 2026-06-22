import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { isAdminUser } from '@/lib/admin-auth';
import { listFeedback } from '@/lib/feedback-repository';
import { getRequestUser } from '@/lib/request-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);
    if (!isAdminUser(user)) return jsonError('Acesso negado', 403);

    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 50), 100);
    const items = await listFeedback(limit);
    return jsonOk({
      feedback: items.map((f) => ({
        id: f.id,
        category: f.category,
        message: f.message,
        pageUrl: f.page_url,
        createdAt: f.created_at.getTime(),
        username: f.username,
        displayName: f.display_name,
      })),
    });
  } catch (err) {
    console.error('[admin/feedback]', err);
    return jsonError('Erro ao carregar feedback', 500);
  }
}