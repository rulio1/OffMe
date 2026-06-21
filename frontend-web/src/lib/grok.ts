export interface GrokMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

const SYSTEM_PROMPT =
  'Você é Grok no app OffMe, uma rede social estilo X. Responda em português do Brasil, de forma concisa e útil. Ajude com o app (posts, perfil, mensagens, notificações) e perguntas gerais.';

export function isGrokConfigured(): boolean {
  return Boolean(process.env.XAI_API_KEY || process.env.OPENAI_API_KEY);
}

export async function chatWithGrok(messages: GrokMessage[]): Promise<string> {
  const xaiKey = process.env.XAI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const apiKey = xaiKey || openaiKey;

  if (!apiKey) {
    throw new Error(
      'Grok não configurado. Defina XAI_API_KEY (recomendado) ou OPENAI_API_KEY no servidor.'
    );
  }

  const useXai = Boolean(xaiKey);
  const url = useXai
    ? 'https://api.x.ai/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';
  const model =
    process.env.GROK_MODEL ??
    (useXai ? 'grok-3-mini' : 'gpt-4o-mini');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  const data = (await res.json()) as ChatCompletionResponse;

  if (!res.ok) {
    throw new Error(data.error?.message ?? `Grok API erro ${res.status}`);
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('Resposta vazia do modelo');
  return content;
}