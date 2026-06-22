'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FollowButton } from '@/components/user/FollowButton';
import { UserAvatar } from '@/components/user/UserAvatar';
import { VerifiedBadge } from '@/components/user/VerifiedBadge';
import { fetchUserFollowers, fetchUserFollowing, fetchUserProfile } from '@/lib/api';

export function UserConnectionsView({
  username,
  tab,
}: {
  username: string;
  tab: 'followers' | 'following';
}) {
  const { data: profileData } = useSWR(`profile-${username}`, () => fetchUserProfile(username));
  const { data, error, mutate, isLoading } = useSWR(
    `${tab}-${username}`,
    () => (tab === 'followers' ? fetchUserFollowers(username) : fetchUserFollowing(username))
  );

  const displayName = profileData?.user.displayName ?? username;
  const users = data?.users ?? [];

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-offme-border bg-offme-bg/80 px-4 py-3 backdrop-blur-md">
        <Link href={`/profile/${username}`} className="rounded-full p-2 hover:bg-offme-hover">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{displayName}</h1>
          <p className="text-sm text-offme-muted">@{username}</p>
        </div>
      </header>

      <div className="flex border-b border-offme-border">
        <Link
          href={`/profile/${username}/followers`}
          className={`flex-1 py-4 text-center text-[15px] font-bold ${
            tab === 'followers' ? 'border-b-4 border-offme-accent' : 'text-offme-muted'
          }`}
        >
          Seguidores
        </Link>
        <Link
          href={`/profile/${username}/following`}
          className={`flex-1 py-4 text-center text-[15px] font-bold ${
            tab === 'following' ? 'border-b-4 border-offme-accent' : 'text-offme-muted'
          }`}
        >
          Seguindo
        </Link>
      </div>

      {isLoading && <p className="px-4 py-8 text-center text-offme-muted">Carregando...</p>}
      {error && (
        <p className="px-4 py-8 text-center text-red-500">Não foi possível carregar a lista.</p>
      )}
      {!isLoading && !error && users.length === 0 && (
        <p className="px-4 py-8 text-center text-offme-muted">Ninguém aqui ainda.</p>
      )}
      {users.map((user) => (
        <div key={user.username} className="flex items-center gap-3 border-b border-offme-border px-4 py-3">
          <Link href={`/profile/${user.username}`}>
            <UserAvatar url={user.avatarUrl} size="md" />
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/profile/${user.username}`} className="block truncate font-bold hover:underline">
              {user.displayName}
              {user.verified && <VerifiedBadge className="ml-1 inline-block" />}
            </Link>
            <p className="truncate text-sm text-offme-muted">@{user.username}</p>
          </div>
          <FollowButton user={user} size="sm" onUpdate={() => mutate()} />
        </div>
      ))}
    </div>
  );
}