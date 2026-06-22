'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import useSWRInfinite from 'swr/infinite';
import { Composer } from '@/components/composer/Composer';
import { ComposeFab } from '@/components/composer/ComposeFab';
import { FeedHeader } from '@/components/feed/FeedHeader';
import { useCompose } from '@/components/providers/ComposeProvider';
import { PostCard } from '@/components/post/PostCard';
import { fetchHomeTimeline, fetchForYouTimeline } from '@/lib/api';
import type { FeedTab, Post, TimelineEntry } from '@/types';

const SWR_FEED_OPTS = {
  revalidateOnFocus: false,
  dedupingInterval: 30_000,
  revalidateFirstPage: false,
} as const;

function entryToPost(entry: TimelineEntry): Post {
  return (
    entry.post ?? {
      id: entry.postId,
      authorId: entry.authorId,
      text: `Post #${entry.postId}`,
      createdAt: entry.createdAt,
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
    }
  );
}

export function Feed() {
  const [tab, setTab] = useState<FeedTab>('for-you');
  const { openCompose } = useCompose();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const getKey = (pageIndex: number, previousPageData: { nextCursor?: string } | null) => {
    if (previousPageData && !previousPageData.nextCursor) return null;
    const cursor = pageIndex === 0 ? '' : (previousPageData?.nextCursor ?? '');
    return JSON.stringify({ tab, cursor });
  };

  const fetcher = async (key: string) => {
    const { tab: activeTab, cursor } = JSON.parse(key) as { tab: FeedTab; cursor: string };
    const c = cursor || undefined;
    return activeTab === 'for-you' ? fetchForYouTimeline(c) : fetchHomeTimeline(c);
  };

  const { data, error, mutate, isLoading, size, setSize, isValidating } = useSWRInfinite(
    getKey,
    fetcher,
    SWR_FEED_OPTS
  );

  const posts: Post[] = data?.flatMap((page) => page.entries.map(entryToPost)) ?? [];
  const hasMore = data?.[data.length - 1]?.nextCursor != null;
  const isLoadingMore = isValidating && size > 1;

  const handleTabChange = useCallback(
    (next: FeedTab) => {
      setTab(next);
      setSize(1);
    },
    [setSize]
  );

  const handlePostCreated = useCallback(() => {
    mutate();
  }, [mutate]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      setSize(size + 1);
    }
  }, [hasMore, isLoadingMore, setSize, size]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <div className="min-h-dvh bg-offme-bg">
      <FeedHeader tab={tab} onTabChange={handleTabChange} />

      <div className="hidden md:block">
        <Composer onPostCreated={handlePostCreated} />
      </div>

      <div>
        {isLoading && posts.length === 0 && (
          <div className="px-4 py-10 text-center text-[15px] text-offme-muted">
            Carregando timeline...
          </div>
        )}
        {error && posts.length === 0 && (
          <div className="px-4 py-10 text-center text-[15px] text-red-500">
            Não foi possível carregar o feed. Tente novamente.
          </div>
        )}
        {!isLoading && !error && posts.length === 0 && (
          <div className="px-4 py-16 text-center">
            <p className="text-xl font-extrabold text-offme-text">Nenhum post ainda</p>
            <p className="mt-2 text-[15px] text-offme-muted">Seja o primeiro a publicar algo.</p>
          </div>
        )}
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {hasMore && (
          <div
            ref={loadMoreRef}
            className="border-b border-offme-border px-4 py-4 text-center text-[15px] text-offme-muted"
          >
            {isLoadingMore ? 'Carregando...' : ''}
          </div>
        )}
      </div>

      <ComposeFab onClick={() => openCompose({ onPostCreated: handlePostCreated })} />
    </div>
  );
}