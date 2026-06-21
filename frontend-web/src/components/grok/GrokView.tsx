'use client';

import { useRef, useState } from 'react';
import { XNavIcon } from '@/components/icons/XNavIcons';
import { chatWithGrok } from '@/lib/api';

type Message = { id: string; role: 'user' | 'assistant'; text: string };

const GREETING =
  'Olá! Sou o Grok do OffMe. Pergunte sobre o app, tendências ou qualquer assunto.';

export function GrokView() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', text: GREETING },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    });
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setSending(true);
    setError(null);

    try {
      const apiMessages = history
        .filter((m) => m.id !== '0')
        .map((m) => ({ role: m.role, content: m.text }));

      const reply = await chatWithGrok(apiMessages);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', text: reply },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar mensagem';
      setError(msg);
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  return (
    <div className="flex h-full min-h-[calc(100dvh-52px)] flex-col md:min-h-screen">
      <header className="sticky top-0 z-10 border-b border-offme-border bg-offme-bg/80 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <XNavIcon name="grok" active className="h-6 w-6" />
          <h1 className="text-xl font-bold">Grok</h1>
        </div>
        <p className="mt-1 text-sm text-offme-muted">Assistente com IA</p>
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-xl flex-col gap-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={
                msg.role === 'user'
                  ? 'ml-auto max-w-[85%] rounded-2xl bg-offme-accent px-4 py-2.5 text-sm text-white'
                  : 'max-w-[85%] rounded-2xl bg-offme-surface px-4 py-2.5 text-sm text-offme-text ring-1 ring-offme-border'
              }
            >
              {msg.text}
            </div>
          ))}
          {sending && (
            <div className="max-w-[85%] rounded-2xl bg-offme-surface px-4 py-2.5 text-sm text-offme-muted ring-1 ring-offme-border">
              Pensando...
            </div>
          )}
          {error && (
            <p className="text-center text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-offme-border bg-offme-bg px-4 py-3">
        <form
          className="mx-auto flex max-w-xl gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte qualquer coisa..."
            className="flex-1 rounded-full bg-offme-surface px-4 py-2.5 text-sm outline-none ring-1 ring-offme-border focus:ring-offme-accent"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="offme-btn-primary shrink-0 px-5 py-2.5 text-sm disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}