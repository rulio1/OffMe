'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { PenLine } from 'lucide-react';
import { FollowButton } from '@/components/user/FollowButton';
import { UserAvatar } from '@/components/user/UserAvatar';
import { VerifiedBadge } from '@/components/user/VerifiedBadge';
import { fetchSuggestedUsers } from '@/lib/api';

export function FeedEmptyState({ onCompose }: { onCompose: () => void }) {
  const { data, mutate } = useSWR('feed-empty-suggestions', () => fetchSuggestedUsers(5), {
    revalidateOnFocus: false,
  });

  const suggestions = data?.users ?? [];

  return (
    <div className="px-4 py-10">
      <div className="text-center">
        <p className="text-xl font-extrabold text-offme-text">Seu feed está vazio</p>
        <p className="mt-2 text-[15px] text-offme-muted">
          Publique algo ou siga pessoas para ver posts aqui.
        </p>
        <button
          type="button"
          onClick={onCompose}
          className="offme-btn-primary mt-6 inline-flex items-center gap-2 px-6 py-2.5"
        >
          <PenLine className="h-4 w-4" />
          Criar primeiro post
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-10 overflow-hidden rounded-2xl border border-offme-border">
          <h2 className="border-b border-offme-border px-4 py-3 text-lg font-extrabold">
            Sugestões para seguir
          </h2>
          {suggestions.map((user) => (
            <div
              key={user.username}
              className="flex items-center gap-3 border-b border-offme-border px-4 py-3 last:border-b-0"
            >
              <Link href={`/profile/${user.username}`}>
                <UserAvatar url={user.avatarUrl} size="md" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${user.username}`}
                  className="block truncate font-bold hover:underline"
                >
                  {user.displayName}
                  {user.verified && <VerifiedBadge className="ml-1 inline-block" />}
                </Link>
                <p className="truncate text-sm text-offme-muted">@{user.username}</p>
              </div>
              <FollowButton user={user} size="sm" onUpdate={() => mutate()} />
            </div>
          ))}
        </div>
      )}

      <p className="mt-8 text-center text-[13px] text-offme-muted">
        Em beta?{' '}
        <Link href="/settings/feedback" className="font-bold text-offme-accent hover:underline">
          Conte como está sua experiência
        </Link>
      </p>
    </div>
  );
}