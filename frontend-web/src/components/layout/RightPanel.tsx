'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import useSWR from 'swr';
import { VerifiedBadge } from '@/components/user/VerifiedBadge';
import { FollowButton } from '@/components/user/FollowButton';
import { UserAvatar } from '@/components/user/UserAvatar';
import { fetchSuggestedUsers, fetchTrendingPosts } from '@/lib/api';
import { formatPostTime } from '@/lib/format-time';

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return n.toString();
}

export function RightPanel() {
  const { data: trendingData } = useSWR('trending-posts', fetchTrendingPosts, {
    revalidateOnFocus: false,
    dedupingInterval: 120_000,
  });
  const { data: suggestionsData, mutate: mutateSuggestions } = useSWR(
    'user-suggestions',
    () => fetchSuggestedUsers(5),
    { revalidateOnFocus: false }
  );

  const trending = trendingData?.posts ?? [];
  const suggestions = suggestionsData?.users ?? [];

  return (
    <aside className="sticky top-0 hidden h-screen w-[350px] flex-col gap-4 overflow-y-auto px-6 py-2 lg:flex">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-offme-muted" />
        <input
          type="search"
          placeholder="Buscar no OffMe"
          className="w-full rounded-full bg-offme-surface py-3 pl-12 pr-4 text-offme-text outline-none ring-1 ring-transparent focus:ring-offme-accent"
        />
      </div>

      <div className="overflow-hidden rounded-2xl bg-offme-surface">
        <h2 className="px-4 py-3 text-xl font-extrabold">Trending</h2>
        {trending.length === 0 && (
          <p className="px-4 pb-3 text-sm text-offme-muted">Nenhum post em destaque ainda.</p>
        )}
        {trending.map((post) => {
          const author = post.author;
          const engagement = post.likeCount + post.repostCount + post.replyCount;
          return (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="block w-full px-4 py-3 text-left transition-colors hover:bg-black/[0.03]"
            >
              <p className="text-xs text-offme-muted">
                {author ? `@${author.username}` : 'OffMe'} · {formatPostTime(post.createdAt)}
              </p>
              <p className="line-clamp-2 font-bold">{post.text || 'Post com mídia'}</p>
              <p className="text-xs text-offme-muted">{formatCount(engagement)} interações</p>
            </Link>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl bg-offme-surface">
        <h2 className="px-4 py-3 text-xl font-extrabold">Quem seguir</h2>
        {suggestions.length === 0 && (
          <p className="px-4 pb-3 text-sm text-offme-muted">Nenhuma sugestão no momento.</p>
        )}
        {suggestions.map((user) => (
          <div key={user.username} className="flex items-center gap-3 px-4 py-3 hover:bg-black/[0.03]">
            <Link href={`/profile/${user.username}`}>
              <UserAvatar url={user.avatarUrl} size="md" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/profile/${user.username}`} className="block truncate font-bold hover:underline">
                {user.displayName}
                {user.verified && <VerifiedBadge className="ml-1 inline-block" label="Verified" />}
              </Link>
              <p className="truncate text-sm text-offme-muted">@{user.username}</p>
            </div>
            <FollowButton
              user={user}
              size="sm"
              onUpdate={() => mutateSuggestions()}
            />
          </div>
        ))}
      </div>

      <footer className="px-4 text-xs text-offme-muted">
        <p>© 2026 OffMe · Privacidade · Termos · Sobre</p>
      </footer>
    </aside>
  );
}