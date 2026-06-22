'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { fetchConversations, fetchMessages, sendMessage } from '@/lib/api';
import { isSupabaseConfigured } from '@/lib/supabase';
import { usePostgresChanges } from '@/lib/use-supabase-realtime';
import type { DirectMessage } from '@/types';

interface ConversationThreadProps {
  conversationId: number;
}

export function ConversationThread({ conversationId }: ConversationThreadProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: convData } = useSWR('conversations', fetchConversations, {
    refreshInterval: 15000,
  });
  const conversation = convData?.conversations.find((c) => c.id === conversationId);

  const realtimeEnabled = isSupabaseConfigured();

  const { data, error: loadError, mutate, isLoading } = useSWR(
    `messages-${conversationId}`,
    () => fetchMessages(conversationId),
    { refreshInterval: realtimeEnabled ? 0 : 5000 }
  );

  const messages = data?.messages ?? [];

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  usePostgresChanges(
    `dm:${conversationId}`,
    {
      table: 'direct_messages',
      filter: `conversation_id=eq.${conversationId}`,
    },
    () => mutate(),
    realtimeEnabled
  );

  const handleSend = async () => {
    const body = text.trim();
    if (!body || sending) return;

    setSending(true);
    setError('');
    const optimistic: DirectMessage = {
      id: Date.now(),
      conversationId,
      senderId: -1,
      text: body,
      createdAt: Date.now(),
      isMine: true,
    };

    setText('');
    mutate(
      (current) => ({
        messages: [...(current?.messages ?? []), optimistic],
        nextCursor: current?.nextCursor,
      }),
      false
    );

    try {
      const sent = await sendMessage(conversationId, body);
      mutate(
        (current) => ({
          messages: [...(current?.messages ?? []).filter((m) => m.id !== optimistic.id), sent],
          nextCursor: current?.nextCursor,
        }),
        false
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar');
      mutate();
      setText(body);
    } finally {
      setSending(false);
    }
  };

  const participant = conversation?.participant;

  return (
    <div className="flex min-h-[calc(100dvh-56px)] flex-col md:min-h-dvh">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-offme-border bg-offme-bg/80 px-3 py-2 backdrop-blur-md">
        <Link href="/messages" className="rounded-full p-2 transition-colors hover:bg-offme-hover">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {participant ? (
          <Link href={`/profile/${participant.username}`} className="min-w-0 flex-1">
            <p className="truncate font-bold">{participant.displayName}</p>
            <p className="truncate text-sm text-offme-muted">@{participant.username}</p>
          </Link>
        ) : (
          <div className="h-10 w-32 animate-pulse rounded bg-offme-surface" />
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading && messages.length === 0 && (
          <div className="py-12 text-center text-offme-muted">Carregando mensagens...</div>
        )}
        {loadError && (
          <div className="py-12 text-center text-red-400">Erro ao carregar mensagens.</div>
        )}
        {!isLoading && !loadError && messages.length === 0 && (
          <div className="py-12 text-center text-offme-muted">
            Envie a primeira mensagem.
          </div>
        )}

        <div className="flex flex-col gap-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={clsx('flex', message.isMine ? 'justify-end' : 'justify-start')}
            >
              <div
                className={clsx(
                  'max-w-[80%] rounded-2xl px-4 py-2 text-[15px]',
                  message.isMine
                    ? 'bg-offme-accent text-white'
                    : 'bg-offme-surface text-offme-text'
                )}
              >
                <p className="whitespace-pre-wrap break-words">{message.text}</p>
                <time className="mt-1 block text-right text-[10px] opacity-70">
                  {formatDistanceToNow(new Date(message.createdAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </time>
              </div>
            </div>
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-offme-border bg-offme-bg p-3">
        {error && (
          <p className="mb-2 text-sm text-red-400">{error}</p>
        )}
        <div className="flex gap-2">
          <textarea
            data-testid="message-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Escreva uma mensagem..."
            rows={1}
            maxLength={1000}
            className="min-h-[44px] flex-1 resize-none rounded-2xl border border-offme-border bg-offme-surface px-4 py-2.5 outline-none focus:ring-1 focus:ring-offme-accent"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="offme-btn-primary shrink-0 px-4 py-2 disabled:opacity-50"
          >
            {sending ? '...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
}