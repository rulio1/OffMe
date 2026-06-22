import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';
import {
  createVerificationRequest,
  getLatestVerificationRequest,
} from '@/lib/verification-repository';

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const body = await request.json();
    const reason = String(body.reason ?? '');

    const created = await createVerificationRequest(user.id, reason);
    const latest = await getLatestVerificationRequest(user.id);

    return jsonOk(
      {
        requestId: created.id,
        request: latest
          ? {
              id: Number(latest.id),
              status: latest.status,
              reason: latest.reason,
              createdAt: latest.created_at.getTime(),
            }
          : undefined,
      },
      201
    );
  } catch (err) {
    if (err instanceof Error) {
      return jsonError(err.message, 400);
    }
    console.error('[verification/request]', err);
    return jsonError('Erro ao enviar solicitação', 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const latest = await getLatestVerificationRequest(user.id);
    if (!latest) return jsonOk({ request: null });

    return jsonOk({
      request: {
        id: Number(latest.id),
        status: latest.status,
        reason: latest.reason,
        createdAt: latest.created_at.getTime(),
        reviewedAt: latest.reviewed_at?.getTime(),
      },
      verified: latest.verified,
    });
  } catch (err) {
    console.error('[verification/request/get]', err);
    return jsonError('Erro ao carregar solicitação', 500);
  }
}