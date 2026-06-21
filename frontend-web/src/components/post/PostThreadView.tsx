'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Composer } from '@/components/composer/Composer';
import { PostCard } from '@/components/post/PostCard';
import { fetchPost, fetchPostReplies } from '@/lib/api';
import type { Post, TimelineEntry } from '@/types';

interface PostThreadViewProps {
  postId: number;
}

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

export function PostThreadView({ postId }: PostThreadViewProps) {
  const { data: post, error: postError, mutate: mutatePost } = useSWR(
    `post-${postId}`,
    () => fetchPost(postId)
  );
  const { data: repliesData, error: repliesError, mutate: mutateReplies } = useSWR(
    `post-replies-${postId}`,
    () => fetchPostReplies(postId)
  );

  const replies: Post[] = repliesData?.entries?.map(entryToPost) ?? [];

  const handleReplyCreated = useCallback(() => {
    mutatePost();
    mutateReplies();
  }, [mutatePost, mutateReplies]);

  if (postError) {
    return (
      <div className="px-4 py-12 text-center text-red-400">Post não encontrado.</div>
    );
  }

  if (!post) {
    return (
      <div className="px-4 py-12 text-center text-offme-muted">Carregando...</div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-6 border-b border-offme-border bg-offme-bg/80 px-4 py-2 backdrop-blur-md">
        <Link href="/" className="rounded-full p-2 transition-colors hover:bg-black/5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">Post</h1>
      </header>

      <PostCard post={post} />

      <Composer
        replyToId={postId}
        placeholder="Poste sua resposta"
        onPostCreated={handleReplyCreated}
      />

      <div className="border-b border-offme-border px-4 py-3 text-sm text-offme-muted">
        {post.replyCount > 0
          ? `${post.replyCount} resposta${post.replyCount !== 1 ? 's' : ''}`
          : 'Nenhuma resposta ainda'}
      </div>

      {repliesError && (
        <div className="px-4 py-8 text-center text-red-400">Erro ao carregar respostas.</div>
      )}
      {replies.map((reply) => (
        <PostCard key={reply.id} post={reply} />
      ))}
    </div>
  );
}