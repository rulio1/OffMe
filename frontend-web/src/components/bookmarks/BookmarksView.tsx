'use client';

import useSWRInfinite from 'swr/infinite';
import { PostCard } from '@/components/post/PostCard';
import { fetchBookmarks } from '@/lib/api';
import type { Post, TimelineEntry } from '@/types';

function entryToPost(entry: TimelineEntry): Post {
  return (
    entry.post ?? {
      id: entry.postId,
      authorId: entry.authorId,
      text: '',
      createdAt: entry.createdAt,
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
    }
  );
}

export function BookmarksView() {
  const getKey = (pageIndex: number, previousPageData: { nextCursor?: string } | null) => {
    if (previousPageData && !previousPageData.nextCursor) return null;
    const cursor = pageIndex === 0 ? '' : (previousPageData?.nextCursor ?? '');
    return `bookmarks:${cursor}`;
  };

  const { data, error, isLoading, size, setSize, isValidating } = useSWRInfinite(
    getKey,
    (key) => {
      const cursor = key.split(':')[1] || undefined;
      return fetchBookmarks(cursor);
    },
    { revalidateOnFocus: true }
  );

  const posts = data?.flatMap((page) => page.entries.map(entryToPost)) ?? [];
  const hasMore = data?.[data.length - 1]?.nextCursor != null;
  const isLoadingMore = isValidating && size > 1;

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-offme-border bg-offme-bg/80 px-4 py-3 backdrop-blur-md">
        <h1 className="text-xl font-bold">Salvos</h1>
      </header>

      {isLoading && posts.length === 0 && (
        <div className="px-4 py-12 text-center text-offme-muted">Carregando...</div>
      )}
      {error && (
        <div className="px-4 py-12 text-center text-red-400">Erro ao carregar salvos.</div>
      )}
      {!isLoading && !error && posts.length === 0 && (
        <div className="px-4 py-12 text-center text-offme-muted">
          Nenhum post salvo ainda. Toque no ícone de bookmark em um post para salvar.
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {hasMore && (
        <div className="border-b border-offme-border px-4 py-4 text-center">
          <button
            onClick={() => setSize(size + 1)}
            disabled={isLoadingMore}
            className="text-sm font-medium text-offme-accent hover:underline disabled:opacity-50"
          >
            {isLoadingMore ? 'Carregando...' : 'Carregar mais'}
          </button>
        </div>
      )}
    </div>
  );
}