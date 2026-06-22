import { NextRequest } from 'next/server';
import { enforceRateLimit } from '@/lib/api-guard';
import { jsonError, jsonOk } from '@/lib/api-response';
import { createFeedback, type FeedbackCategory } from '@/lib/feedback-repository';
import { getRequestUser } from '@/lib/request-auth';

const CATEGORIES = new Set<FeedbackCategory>(['bug', 'idea', 'general']);

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, 'feedback', 10, 60_000);
  if (limited) return limited;

  try {
    const user = await getRequestUser(request);
    const body = await request.json();
    const category = String(body.category ?? 'general') as FeedbackCategory;
    const message = String(body.message ?? '');
    const pageUrl = body.pageUrl != null ? String(body.pageUrl) : undefined;

    if (!CATEGORIES.has(category)) {
      return jsonError('Categoria inválida', 400);
    }

    const row = await createFeedback({
      userId: user?.id,
      category,
      message,
      pageUrl,
    });

    return jsonOk({ id: row.id, received: true }, 201);
  } catch (err) {
    if (err instanceof Error && err.message.includes('caracteres')) {
      return jsonError(err.message, 400);
    }
    console.error('[feedback]', err);
    return jsonError('Erro ao enviar feedback', 500);
  }
}