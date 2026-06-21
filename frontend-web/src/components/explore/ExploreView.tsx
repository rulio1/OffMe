'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { PostCard } from '@/components/post/PostCard';
import { FollowButton } from '@/components/user/FollowButton';
import { UserAvatar } from '@/components/user/UserAvatar';
import { fetchTrendingPosts, searchPosts, searchUsers } from '@/lib/api';
import type { Post, User } from '@/types';

type SearchTab = 'top' | 'people';

export function ExploreView() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [tab, setTab] = useState<SearchTab>('top');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const { data: userData, isLoading: usersLoading } = useSWR(
    debouncedQuery && tab === 'people' ? `search-users-${debouncedQuery}` : null,
    () => searchUsers(debouncedQuery),
    { revalidateOnFocus: false, dedupingInterval: 10_000 }
  );

  const { data: postData, isLoading: postsLoading } = useSWR(
    debouncedQuery && tab === 'top' ? `search-posts-${debouncedQuery}` : null,
    () => searchPosts(debouncedQuery),
    { revalidateOnFocus: false, dedupingInterval: 10_000 }
  );

  const { data: trendingData } = useSWR('trending-posts', fetchTrendingPosts, {
    revalidateOnFocus: false,
    dedupingInterval: 120_000,
  });

  const users: User[] = userData?.users ?? [];
  const posts: Post[] = postData?.posts ?? [];
  const trending: Post[] = trendingData?.posts ?? [];
  const isLoading = tab === 'people' ? usersLoading : postsLoading;

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-offme-border bg-offme-bg/80 px-4 py-3 backdrop-blur-md">
        <h1 className="text-xl font-bold">Explorar</h1>
        <div className="relative mt-3">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-offme-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar posts e pessoas"
            className="w-full rounded-full bg-offme-surface py-3 pl-12 pr-4 text-offme-text outline-none ring-1 ring-transparent focus:ring-offme-accent"
          />
        </div>
        {debouncedQuery && (
          <div className="mt-3 flex gap-6 border-b border-offme-border">
            {(['top', 'people'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={
                  tab === item
                    ? 'border-b-4 border-offme-accent pb-3 font-bold'
                    : 'pb-3 text-offme-muted hover:text-offme-text'
                }
              >
                {item === 'top' ? 'Top' : 'Pessoas'}
              </button>
            ))}
          </div>
        )}
      </header>

      <div>
        {!debouncedQuery && (
          <>
            <div className="px-4 py-4">
              <h2 className="text-lg font-bold">Em alta</h2>
              <p className="text-sm text-offme-muted">Posts com mais engajamento</p>
            </div>
            {trending.length === 0 ? (
              <div className="px-4 py-8 text-center text-offme-muted">
                Nenhum post em destaque ainda.
              </div>
            ) : (
              trending.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </>
        )}

        {debouncedQuery && isLoading && (
          <div className="px-4 py-8 text-center text-offme-muted">Buscando...</div>
        )}

        {debouncedQuery && !isLoading && tab === 'people' && users.length === 0 && (
          <div className="px-4 py-8 text-center text-offme-muted">
            Nenhum usuário encontrado para &ldquo;{debouncedQuery}&rdquo;.
          </div>
        )}

        {debouncedQuery && !isLoading && tab === 'top' && posts.length === 0 && (
          <div className="px-4 py-8 text-center text-offme-muted">
            Nenhum post encontrado para &ldquo;{debouncedQuery}&rdquo;.
          </div>
        )}

        {debouncedQuery && !isLoading && tab === 'people' &&
          users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 border-b border-offme-border px-4 py-3 hover:bg-black/[0.03]"
            >
              <Link href={`/profile/${user.username}`}>
                <UserAvatar url={user.avatarUrl} size="lg" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/profile/${user.username}`} className="block truncate font-bold hover:underline">
                  {user.displayName}
                  {user.verified && (
                    <span className="ml-1 text-offme-accent" aria-label="Verificado">
                      ✓
                    </span>
                  )}
                </Link>
                <Link href={`/profile/${user.username}`} className="block truncate text-sm text-offme-muted hover:underline">
                  @{user.username}
                </Link>
                {user.bio && (
                  <p className="mt-1 truncate text-sm text-offme-muted">{user.bio}</p>
                )}
              </div>
              <FollowButton user={user} size="sm" />
            </div>
          ))}

        {debouncedQuery && !isLoading && tab === 'top' &&
          posts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>
    </div>
  );
}