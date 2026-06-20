'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { Composer } from '@/components/composer/Composer';
import { PostCard } from '@/components/post/PostCard';
import { fetchHomeTimeline, fetchForYouTimeline } from '@/lib/api';
import type { FeedTab, Post, TimelineEntry } from '@/types';
import clsx from 'clsx';

const MOCK_POSTS: Post[] = [
  {
    id: 1,
    authorId: 1,
    author: { id: 1, username: 'offme', displayName: 'OffMe', verified: true },
    text: 'Bem-vindo ao OffMe — sua rede social no seu ritmo. Sem algoritmo, sem ruído. 🚀',
    createdAt: Date.now() - 3600000,
    likeCount: 4200,
    repostCount: 890,
    replyCount: 312,
  },
  {
    id: 2,
    authorId: 2,
    author: { id: 2, username: 'finagle_fan', displayName: 'Finagle Fan', verified: false },
    text: 'Fanout-on-write timelines with celebrity pull model — just like the real thing. The hybrid approach scales to billions of timeline reads.',
    createdAt: Date.now() - 7200000,
    likeCount: 156,
    repostCount: 42,
    replyCount: 18,
  },
  {
    id: 3,
    authorId: 3,
    author: { id: 3, username: 'rust_recs', displayName: 'Rust Recs', verified: true },
    text: 'Our Heavy Ranker serves multi-task predictions in <10ms p99. Five heads: like, repost, reply, click, dwell. Inspired by the open-source X algorithm.',
    createdAt: Date.now() - 10800000,
    likeCount: 892,
    repostCount: 201,
    replyCount: 67,
  },
];

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

  const fetcher = tab === 'for-you' ? fetchForYouTimeline : fetchHomeTimeline;
  const { data, mutate, isLoading } = useSWR(`timeline-${tab}`, fetcher, {
    fallbackData: undefined,
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  const posts: Post[] = data?.entries?.length
    ? data.entries.map(entryToPost)
    : MOCK_POSTS;

  const handlePostCreated = useCallback(() => {
    mutate();
  }, [mutate]);

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-pulse-border bg-pulse-bg/80 backdrop-blur-md">
        <h1 className="px-4 py-3 text-xl font-bold">Home</h1>
        <div className="flex">
          {(['for-you', 'following'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'relative flex-1 py-4 text-center text-[15px] transition-colors hover:bg-white/5',
                tab === t ? 'font-bold' : 'text-pulse-muted'
              )}
            >
              {t === 'for-you' ? 'For you' : 'Following'}
              {tab === t && (
                <span className="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-pulse-accent" />
              )}
            </button>
          ))}
        </div>
      </header>

      <Composer onPostCreated={handlePostCreated} />

      <div>
        {isLoading && posts === MOCK_POSTS && (
          <div className="px-4 py-8 text-center text-pulse-muted">Loading timeline...</div>
        )}
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}