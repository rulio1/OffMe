import { NextRequest } from 'next/server';
import { isAdminUser } from '@/lib/admin-auth';
import { jsonError, jsonOk } from '@/lib/api-response';
import { listOpenReports } from '@/lib/moderation-repository';
import { getRequestUser } from '@/lib/request-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);
    if (!isAdminUser(user)) return jsonError('Acesso negado', 403);

    const reports = await listOpenReports();
    return jsonOk({
      reports: reports.map((r) => ({
        id: Number(r.id),
        reporterId: Number(r.reporter_id),
        reporterUsername: r.reporter_username,
        reporterDisplayName: r.reporter_display_name,
        targetType: r.target_type,
        targetId: Number(r.target_id),
        reason: r.reason,
        status: r.status,
        createdAt: r.created_at.getTime(),
        postText: r.post_text ?? undefined,
        postAuthorUsername: r.post_author_username ?? undefined,
        targetUsername: r.target_username ?? undefined,
        targetDisplayName: r.target_display_name ?? undefined,
        targetSuspended: Boolean(r.target_suspended),
      })),
    });
  } catch (err) {
    console.error('[admin/reports]', err);
    return jsonError('Erro ao carregar denúncias', 500);
  }
}