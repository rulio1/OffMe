'use client';

import { useCallback, useState } from 'react';
import useSWRInfinite from 'swr/infinite';
import { Composer } from '@/components/composer/Composer';
import { ComposeFab } from '@/components/composer/ComposeFab';
import { ComposeSheet } from '@/components/composer/ComposeSheet';
import { FeedHeader } from '@/components/feed/FeedHeader';
import { PostCard } from '@/components/post/PostCard';
import { fetchHomeTimeline, fetchForYouTimeline } from '@/lib/api';
import type { FeedTab, Post, TimelineEntry } from '@/types';

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
  const [composeOpen, setComposeOpen] = useState(false);

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
    { revalidateOnFocus: true, dedupingInterval: 5000 }
  );

  const posts: Post[] = data?.flatMap((page) => page.entries.map(entryToPost)) ?? [];
  const hasMore = data?.[data.length - 1]?.nextCursor != null;
  const isLoadingMore = isValidating && size > 1;

  const handlePostCreated = useCallback(() => {
    mutate();
  }, [mutate]);

  return (
    <div className="min-h-dvh bg-offme-bg">
      <FeedHeader tab={tab} onTabChange={setTab} />

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
          <div className="border-b border-offme-border px-4 py-4 text-center">
            <button
              type="button"
              onClick={() => setSize(size + 1)}
              disabled={isLoadingMore}
              className="rounded-full px-4 py-2 text-[15px] font-bold text-offme-accent transition-colors hover:bg-sky-500/10 disabled:opacity-50"
            >
              {isLoadingMore ? 'Carregando...' : 'Mostrar mais'}
            </button>
          </div>
        )}
      </div>

      <ComposeFab onClick={() => setComposeOpen(true)} />
      <ComposeSheet
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}