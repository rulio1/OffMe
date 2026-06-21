import { NextRequest } from 'next/server';
import { enforceRateLimit } from '@/lib/api-guard';
import { jsonError, jsonOk } from '@/lib/api-response';
import { chatWithGrok, isGrokConfigured, type GrokMessage } from '@/lib/grok';
import { getRequestUser } from '@/lib/request-auth';

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, 'grok-chat', 30, 60_000);
  if (limited) return limited;

  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    if (!isGrokConfigured()) {
      return jsonError(
        'Grok não configurado no servidor. Adicione XAI_API_KEY nas variáveis de ambiente.',
        503
      );
    }

    const body = await request.json();
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];

    const messages: GrokMessage[] = rawMessages
      .map((m: { role?: string; content?: string }): GrokMessage => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content ?? '').trim(),
      }))
      .filter((m: GrokMessage) => m.content.length > 0)
      .slice(-20);

    if (messages.length === 0) {
      return jsonError('Envie pelo menos uma mensagem', 400);
    }

    const reply = await chatWithGrok(messages);
    return jsonOk({ reply, model: process.env.GROK_MODEL ?? 'grok-3-mini' });
  } catch (err) {
    console.error('[grok/chat]', err);
    const message = err instanceof Error ? err.message : 'Erro ao conversar com Grok';
    return jsonError(message, 500);
  }
}