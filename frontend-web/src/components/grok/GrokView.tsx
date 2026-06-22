'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Send, Sparkles, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { sendGrokMessage, type GrokChatMessage } from '@/lib/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  demo?: boolean;
}

const STORAGE_KEY = 'offme_grok_history';

function loadHistory(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return [];
  }
}

function saveHistory(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
  } catch {
    // ignore quota errors
  }
}

export function GrokView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const history = loadHistory();
    if (history.length > 0) {
      setMessages(history);
      setIsDemo(history.some((m) => m.demo));
    } else {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content:
            'Oi! 👋 Sou o assistente do OffMe. Posso ajudar com dúvidas sobre a plataforma, sugerir posts, ou apenas conversar. Como posso ajudar?',
        },
      ]);
    }
  }, []);

  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const apiMessages: GrokChatMessage[] = newMessages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const result = await sendGrokMessage(apiMessages);

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: result.reply,
        demo: result.demo,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsDemo(Boolean(result.demo));
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content:
          err instanceof Error
            ? `Erro: ${err.message}`
            : 'Algo deu errado. Tente novamente.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleClear = () => {
    const welcome: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content:
        'Oi! 👋 Sou o assistente do OffMe. Posso ajudar com dúvidas sobre a plataforma, sugerir posts, ou apenas conversar. Como posso ajudar?',
    };
    setMessages([welcome]);
    setIsDemo(false);
  };

  return (
    <div className="flex h-[100dvh] flex-col border-x border-offme-border">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-offme-border bg-offme-bg/80 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-offme-accent" />
          <h1 className="text-lg font-bold">Assistente</h1>
          {isDemo && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-500">
              Demo
            </span>
          )}
        </div>
        {messages.length > 1 && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full p-2 text-offme-muted transition-colors hover:bg-offme-hover hover:text-offme-text"
            title="Limpar conversa"
            aria-label="Limpar conversa"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
        role="log"
        aria-live="polite"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={clsx(
                'max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed',
                msg.role === 'user'
                  ? 'rounded-br-md bg-offme-accent text-white'
                  : 'rounded-bl-md bg-offme-hover text-offme-text'
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-offme-hover px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-offme-muted [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-offme-muted [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-offme-muted" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-offme-border p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte algo..."
            rows={1}
            maxLength={4000}
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-offme-border bg-offme-bg px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-offme-muted focus:border-offme-accent"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!input.trim() || loading}
            aria-label="Enviar mensagem"
            className={clsx(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors',
              input.trim() && !loading
                ? 'bg-offme-accent text-white hover:opacity-90'
                : 'cursor-not-allowed bg-offme-hover text-offme-muted'
            )}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        {isDemo && (
          <p className="mt-2 px-1 text-xs text-offme-muted">
            ⚙️ Modo demo ativo. Configure <code className="font-mono">GROK_API_KEY</code> para IA real.
          </p>
        )}
      </div>
    </div>
  );
}