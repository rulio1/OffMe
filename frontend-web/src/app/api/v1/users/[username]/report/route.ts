import { NextRequest } from 'next/server';
import { enforceRateLimit } from '@/lib/api-guard';
import { jsonError, jsonOk } from '@/lib/api-response';
import { createReport } from '@/lib/moderation-repository';
import { getRequestUser } from '@/lib/request-auth';
import { findUserByUsernameIncludingSuspended } from '@/lib/user-repository';

export async function POST(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const limited = enforceRateLimit(request, 'users-report', 20, 60_000);
  if (limited) return limited;

  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const target = await findUserByUsernameIncludingSuspended(params.username);
    if (!target) return jsonError('Usuário não encontrado', 404);
    if (target.id === user.id) return jsonError('Não é possível denunciar a si mesmo', 400);

    const body = await request.json();
    const reason = String(body.reason ?? 'abuse').trim();

    const report = await createReport({
      reporterId: user.id,
      targetType: 'user',
      targetId: target.id,
      reason,
    });

    return jsonOk({ reported: true, reportId: report.id }, 201);
  } catch (err) {
    if (err instanceof Error && err.message.includes('Motivo')) {
      return jsonError(err.message, 400);
    }
    console.error('[users/report]', err);
    return jsonError('Erro ao denunciar usuário', 500);
  }
}