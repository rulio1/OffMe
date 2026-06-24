'use client';

import { useEffect } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell } from 'lucide-react';
import { fetchNotifications, markNotificationsRead } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { usePostgresChanges } from '@/lib/use-supabase-realtime';
import type { Notification } from '@/types';

function notificationText(n: Notification): string {
  switch (n.type) {
    case 'like':
      return 'curtiu seu post';
    case 'reply':
      return 'respondeu seu post';
    case 'follow':
      return 'começou a seguir você';
    case 'repost':
      return 'repostou seu post';
    case 'mention':
      return 'mencionou você em um post';
    default:
      return 'interagiu com você';
  }
}

function notificationLink(n: Notification): string {
  if (n.postId) return `/post/${n.postId}`;
  return `/profile/${n.actor.username}`;
}

export function NotificationsView() {
  const user = getStoredUser();
  const { data, error, mutate, isLoading } = useSWR('notifications', fetchNotifications, {
    revalidateOnFocus: false,
    dedupingInterval: 15_000,
  });

  useEffect(() => {
    if (data && data.unreadCount > 0) {
      markNotificationsRead().then(() => mutate());
    }
  }, [data, mutate]);

  usePostgresChanges(
    `notifications:${user?.id ?? 'guest'}`,
    {
      table: 'notifications',
      filter: user ? `user_id=eq.${user.id}` : undefined,
    },
    () => mutate(),
    Boolean(user),
    400
  );

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 border-b border-offme-border bg-offme-bg/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold">Notificações</h1>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-offme-muted">Novo</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-offme-accent text-xs font-bold text-white">
                {unreadCount}
              </span>
            </div>
          )}
        </div>
      </header>

      {isLoading && (
        <div className="flex flex-1 flex-col items-center justify-center py-12 px-4">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-offme-accent border-t-transparent" />
          <p className="text-offme-muted">Carregando notificações...</p>
        </div>
      )}
      {error && (
        <div className="flex flex-1 flex-col items-center justify-center py-12 px-4">
          <div className="mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <Bell className="h-6 w-6 text-red-400" aria-hidden />
          </div>
          <p className="text-red-400">Erro ao carregar notificações.</p>
        </div>
      )}
      {!isLoading && !error && notifications.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center py-16 px-4 text-center">
          <div className="mb-4 h-16 w-16 rounded-full bg-offme-surface/50 flex items-center justify-center">
            <Bell className="h-8 w-8 text-offme-muted" aria-hidden />
          </div>
          <p className="font-medium text-offme-text">Nenhuma notificação ainda.</p>
          <p className="mt-2 text-sm text-offme-muted">Você receberá notificações aqui quando alguém interagir com você.</p>
        </div>
      )}
      {notifications.length > 0 && (
        <div className="divide-y divide-offme-border">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={notificationLink(n)}
              className={`flex items-start gap-3 px-4 py-4 transition-colors hover:bg-offme-hover ${
                !n.read ? 'bg-offme-accent/5' : ''
              }`}
            >
              <div className="mt-1 h-10 w-10 shrink-0 rounded-full bg-offme-surface" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[15px]">
                    <span className="font-bold">{n.actor.displayName}</span>{' '}
                    <span className="text-offme-muted">{notificationText(n)}</span>
                  </p>
                  {!n.read && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-offme-accent" />
                  )}
                </div>
                <p className="mt-1 text-sm text-offme-muted">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
