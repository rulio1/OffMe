import { NextRequest } from 'next/server';
import { jsonError } from '@/lib/api-response';
import { isAdminUser } from '@/lib/admin-auth';
import { feedbackToCsv, listFeedback, type FeedbackStatus } from '@/lib/feedback-repository';
import { getRequestUser } from '@/lib/request-auth';

const STATUSES = new Set<FeedbackStatus>(['open', 'resolved', 'dismissed']);

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);
    if (!isAdminUser(user)) return jsonError('Acesso negado', 403);

    const statusParam = request.nextUrl.searchParams.get('status');
    const status =
      statusParam && STATUSES.has(statusParam as FeedbackStatus)
        ? (statusParam as FeedbackStatus)
        : undefined;
    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 500), 1000);

    const items = await listFeedback(limit, status);
    const csv = feedbackToCsv(items);
    const filename = `offme-feedback-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('[admin/feedback/export]', err);
    return jsonError('Erro ao exportar feedback', 500);
  }
}