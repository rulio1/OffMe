import { NextRequest } from 'next/server';
import { enforceRateLimit } from '@/lib/api-guard';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';
import { createReport } from '@/lib/moderation-repository';
import { findPostById } from '@/lib/post-repository';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const limited = enforceRateLimit(request, 'posts-report', 20, 60_000);
  if (limited) return limited;

  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const postId = Number(params.id);
    if (!Number.isFinite(postId)) return jsonError('Post inválido', 400);

    const post = await findPostById(postId);
    if (!post) return jsonError('Post não encontrado', 404);

    const body = await request.json();
    const reason = String(body.reason ?? 'spam').trim();

    const report = await createReport({
      reporterId: user.id,
      targetType: 'post',
      targetId: postId,
      reason,
    });

    return jsonOk({ reported: true, reportId: report.id }, 201);
  } catch (err) {
    if (err instanceof Error && err.message.includes('Motivo')) {
      return jsonError(err.message, 400);
    }
    console.error('[posts/report]', err);
    return jsonError('Erro ao denunciar post', 500);
  }
}