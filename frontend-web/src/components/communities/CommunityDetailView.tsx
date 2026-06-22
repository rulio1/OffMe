'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Composer } from '@/components/composer/Composer';
import { PostCard } from '@/components/post/PostCard';
import { fetchCommunity, fetchCommunityTimeline, joinCommunity } from '@/lib/api';
import type { Post, TimelineEntry } from '@/types';

interface CommunityDetailViewProps {
  slug: string;
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

export function CommunityDetailView({ slug }: CommunityDetailViewProps) {
  const { data: communityData } = useSWR(`community-${slug}`, () => fetchCommunity(slug));
  const { data: timelineData, mutate: mutateTimeline } = useSWR(`community-timeline-${slug}`, () =>
    fetchCommunityTimeline(slug)
  );

  const community = communityData?.community;
  const posts = timelineData?.entries?.map(entryToPost) ?? [];

  const handleJoin = async () => {
    try {
      await joinCommunity(slug);
      window.alert('Você entrou na comunidade!');
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao entrar');
    }
  };

  if (!community) {
    return <p className="px-4 py-8 text-offme-muted">Carregando comunidade...</p>;
  }

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-offme-border bg-offme-bg/80 px-3 py-2 backdrop-blur-md">
        <Link href="/communities" className="rounded-full p-2 hover:bg-black/5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">{community.name}</h1>
          <p className="text-sm text-offme-muted">
            @{community.slug} · {community.memberCount} membros
          </p>
        </div>
        <button
          type="button"
          onClick={handleJoin}
          className="shrink-0 rounded-full bg-offme-accent px-4 py-1.5 text-sm font-bold text-white hover:bg-offme-accentHover"
        >
          Entrar
        </button>
      </header>

      {community.description && (
        <p className="border-b border-offme-border px-4 py-3 text-sm text-offme-muted">
          {community.description}
        </p>
      )}

      <Composer
        communityId={community.id}
        placeholder={`Postar em ${community.name}`}
        onPostCreated={() => void mutateTimeline()}
      />

      {posts.length === 0 ? (
        <p className="px-4 py-12 text-center text-offme-muted">Nenhum post nesta comunidade.</p>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}