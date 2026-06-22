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

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-offme-border bg-offme-bg/80 px-4 py-3 backdrop-blur-md">
        <h1 className="text-xl font-bold">Notificações</h1>
      </header>

      {isLoading && (
        <div className="px-4 py-12 text-center text-offme-muted">Carregando...</div>
      )}
      {error && (
        <div className="px-4 py-12 text-center text-red-400">Erro ao carregar notificações.</div>
      )}
      {!isLoading && !error && notifications.length === 0 && (
        <div className="flex flex-col items-center gap-3 px-4 py-16 text-center text-offme-muted">
          <Bell className="h-12 w-12 opacity-50" aria-hidden />
          <p className="font-medium text-offme-text">Nenhuma notificação ainda.</p>
        </div>
      )}
      {notifications.map((n) => (
        <Link
          key={n.id}
          href={notificationLink(n)}
          className={`flex gap-3 border-b border-offme-border px-4 py-4 transition-colors hover:bg-offme-hover ${
            !n.read ? 'bg-offme-accent/5' : ''
          }`}
        >
          <div className="h-10 w-10 shrink-0 rounded-full bg-offme-surface" />
          <div className="min-w-0 flex-1">
            <p className="text-[15px]">
              <span className="font-bold">{n.actor.displayName}</span>{' '}
              <span className="text-offme-muted">{notificationText(n)}</span>
            </p>
            <p className="mt-1 text-sm text-offme-muted">
              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
            </p>
          </div>
          {!n.read && (
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-offme-accent" />
          )}
        </Link>
      ))}
    </div>
  );
}