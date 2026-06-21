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
      className="flex gap-3 border-b border-offme-border px-4 py-3 transition-colors hover:bg-black/[0.03]"
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
  });

  usePostgresChanges(
    'conversations-list',
    { table: 'direct_messages' },
    () => mutate(),
    realtimeEnabled
  );

  const conversations = data?.conversations ?? [];

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-offme-border bg-offme-bg/80 px-4 py-3 backdrop-blur-md">
        <h1 className="text-xl font-bold">Mensagens</h1>
      </header>

      {isLoading && (
        <div className="px-4 py-12 text-center text-offme-muted">Carregando...</div>
      )}
      {error && (
        <div className="px-4 py-12 text-center text-red-400">Erro ao carregar conversas.</div>
      )}
      {!isLoading && !error && conversations.length === 0 && (
        <div className="flex flex-col items-center gap-3 px-4 py-16 text-center text-offme-muted">
          <Mail className="h-12 w-12 opacity-50" />
          <p className="font-medium text-offme-text">Nenhuma conversa ainda</p>
          <p className="max-w-xs text-sm">
            Visite o perfil de alguém e toque em &quot;Mensagem&quot; para começar.
          </p>
        </div>
      )}

      {conversations.map((conversation) => (
        <ConversationRow key={conversation.id} conversation={conversation} />
      ))}
    </div>
  );
}