'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Mail } from 'lucide-react';
import { fetchConversations } from '@/lib/api';
import { isSupabaseConfigured } from '@/lib/supabase';
import { usePostgresChanges } from '@/lib/use-supabase-realtime';
import type { Conversation } from '@/types';

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const { participant, lastMessage } = conversation;
  const preview = lastMessage?.text ?? 'Inicie a conversa';
  const time = lastMessage
    ? formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true, locale: ptBR })
    : '';

  return (
    <Link
      href={`/messages/${conversation.id}`}
      className="flex gap-3 border-b border-offme-border px-4 py-3 transition-colors hover:bg-offme-hover"
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-offme-surface">
        {participant.avatarUrl ? (
          <img src={participant.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-bold">{participant.displayName}</p>
          {time && <span className="shrink-0 text-xs text-offme-muted">{time}</span>}
        </div>
        <p className="truncate text-sm text-offme-muted">@{participant.username}</p>
        <p className="mt-0.5 truncate text-sm text-offme-text/80">{preview}</p>
      </div>
    </Link>
  );
}

export function MessagesView() {
  const realtimeEnabled = isSupabaseConfigured();

  const { data, error, isLoading, mutate } = useSWR('conversations', fetchConversations, {
    refreshInterval: realtimeEnabled ? 0 : 10000,
    revalidateOnFocus: false,
    dedupingInterval: 15_000,
  });

  usePostgresChanges(
    'conversations-list',
    { table: 'direct_messages' },
    () => mutate(),
    realtimeEnabled,
    400
  );

  const conversations = data?.conversations ?? [];

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 border-b border-offme-border bg-offme-bg/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold">Mensagens</h1>
          <Link
            href="/explore"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-offme-accent text-white transition-colors hover:bg-opacity-90"
          >
            <span className="text-lg font-bold">+</span>
          </Link>
        </div>
      </header>

      {isLoading && (
        <div className="flex flex-1 flex-col items-center justify-center py-12 px-4">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-offme-accent border-t-transparent" />
          <p className="text-offme-muted">Carregando conversas...</p>
        </div>
      )}
      {error && (
        <div className="flex flex-1 flex-col items-center justify-center py-12 px-4">
          <div className="mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <Mail className="h-6 w-6 text-red-400" />
          </div>
          <p className="text-red-400">Erro ao carregar conversas.</p>
        </div>
      )}
            {!isLoading && !error && conversations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="mb-4 h-16 w-16 rounded-full bg-offme-surface/50 flex items-center justify-center">
                        <Mail className="h-8 w-8 text-offme-muted" />
                    </div>
                    <p className="font-medium text-offme-text">Nenhuma conversa ainda</p>
                    <p className="mt-2 max-w-xs text-sm text-offme-muted">
                        Visite o perfil de alguém e toque em &ldquo;Mensagem&rdquo; para começar.
                    </p>
                </div>
            )}

      {conversations.length > 0 && (
        <div className="divide-y divide-offme-border">
          {conversations.map((conversation) => (
            <ConversationRow key={conversation.id} conversation={conversation} />
          ))}
        </div>
      )}
    </div>
  );
}
