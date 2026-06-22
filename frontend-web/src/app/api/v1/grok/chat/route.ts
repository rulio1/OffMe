import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/api-response';
import { getRequestUser } from '@/lib/request-auth';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface GrokMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * POST /api/v1/grok/chat
 *
 * Body: { messages: [{ role, content }] }
 *
 * Usa OpenAI-compatible API (xAi Grok, OpenAI, OpenRouter, etc.)
 * Configure via env:
 *   GROK_API_KEY   — API key
 *   GROK_BASE_URL  — base URL (default: https://api.x.ai/v1)
 *   GROK_MODEL     — modelo (default: grok-beta)
 *
 * Sem chave configurada, retorna uma resposta demo amigável.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return jsonError('Não autenticado', 401);

    const body = await request.json();
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];

    if (rawMessages.length === 0) {
      return jsonError('Mensagem vazia', 400);
    }

    const messages: GrokMessage[] = rawMessages
      .filter((m: { role?: string; content?: string }) => m && typeof m.content === 'string')
      .slice(-20)
      .map((m: { role?: string; content?: string }) => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: String(m.content).slice(0, 4000),
      }));

    const systemMessage: GrokMessage = {
      role: 'system',
      content: `Você é o assistente do OffMe, uma rede social brasileira. Responda em português do Brasil, de forma útil e concisa. O usuário logado é @${user.username}.`,
    };

    const apiKey = process.env.GROK_API_KEY;
    const baseUrl = process.env.GROK_BASE_URL ?? 'https://api.x.ai/v1';
    const model = process.env.GROK_MODEL ?? 'grok-beta';

    // --- Modo demo (sem chave de API configurada) ---
    if (!apiKey) {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      const demoReply = generateDemoReply(lastUserMsg?.content ?? '', user.username);
      return jsonOk({
        reply: demoReply,
        model: 'offme-demo',
        demo: true,
      });
    }

    // --- Chamada real à API de IA ---
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [systemMessage, ...messages],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => 'unknown');
      console.error('[grok/chat] API error:', res.status, detail);
      return jsonError('Erro no assistente de IA. Tente novamente.', 502);
    }

    const data = await res.json();
    const reply =
      data?.choices?.[0]?.message?.content ??
      'Desculpe, não consegui gerar uma resposta.';

    return jsonOk({
      reply: String(reply).trim(),
      model,
    });
  } catch (err) {
    console.error('[grok/chat]', err);
    return jsonError('Erro interno no assistente', 500);
  }
}

function generateDemoReply(userMessage: string, username: string): string {
  const msg = userMessage.toLowerCase();

  if (msg.includes('oi') || msg.includes('olá') || msg.includes('ola') || msg.includes('eai')) {
    return `Oi, @${username}! 👋 Sou o assistente do OffMe. Em modo demo ainda — configure GROK_API_KEY para respostas com IA real. Como posso ajudar?`;
  }

  if (msg.includes('postar') || msg.includes('publicar')) {
    return `Para postar, clique no botão "Postar" na barra lateral ou use o ícone de caneta. Posts têm limite de 280 caracteres. Você pode adicionar imagens, enquetes e até agendar! 📝`;
  }

  if (msg.includes('seguir') || msg.includes('amigo')) {
    return `Para encontrar pessoas, vá em "Explorar" 🔍. Você também pode convidar amigos pelo link em Configurações → Convidar amigos!`;
  }

  if (msg.includes('beta') || msg.includes('feedback') || msg.includes('bug')) {
    return `Encontrou um bug ou tem uma ideia? Mande em Configurações → Feedback beta! Sua opinião ajuda a melhorar o OffMe. 🐛💡`;
  }

  return `Recebi sua mensagem! Estou em modo demo (sem chave de IA configurada). Em produção, o administrador pode ativar o Grok configurando a variável GROK_API_KEY. 🔧`;
}