'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Link2, MapPin } from 'lucide-react';
import { PostCard } from '@/components/post/PostCard';
import { FollowButton } from '@/components/user/FollowButton';
import { VerifiedBadge } from '@/components/user/VerifiedBadge';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { fetchUserPosts, fetchUserProfile, reportUser, startConversation } from '@/lib/api';
import type { Post, TimelineEntry, User } from '@/types';

interface ProfileViewProps {
  username: string;
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

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function Avatar({ url, size = 'lg' }: { url?: string; size?: 'lg' | 'sm' }) {
  const dim = size === 'lg' ? 'h-20 w-20 sm:h-24 sm:w-24' : 'h-10 w-10';
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className={`${dim} shrink-0 rounded-full border-4 border-offme-bg object-cover`}
      />
    );
  }
  return (
    <div
      className={`${dim} shrink-0 rounded-full border-4 border-offme-bg bg-offme-border`}
    />
  );
}

export function ProfileView({ username }: ProfileViewProps) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [startingDm, setStartingDm] = useState(false);
  const [reporting, setReporting] = useState(false);
  const { data: profileData, error: profileError, mutate: mutateProfile } = useSWR(
    `profile-${username}`,
    () => fetchUserProfile(username)
  );
  const { data: postsData, error: postsError } = useSWR(`profile-posts-${username}`, () =>
    fetchUserPosts(username)
  );

  const user = profileData?.user;
  const isOwnProfile = profileData?.isOwnProfile ?? false;
  const posts: Post[] = postsData?.entries?.map(entryToPost) ?? [];

  if (profileError) {
    return (
      <div className="px-4 py-12 text-center text-red-400">
        Perfil não encontrado.
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-4 py-12 text-center text-offme-muted">Carregando perfil...</div>
    );
  }

  const handleFollowUpdate = (updated: User) => {
    mutateProfile({ user: updated, isOwnProfile }, false);
  };

  const handleProfileSaved = (updated: User) => {
    mutateProfile({ user: updated, isOwnProfile }, false);
  };

  const handleReportUser = async () => {
    if (!user || reporting) return;
    const confirmed = window.confirm(`Denunciar @${user.username}?`);
    if (!confirmed) return;
    setReporting(true);
    try {
      await reportUser(user.username, 'abuse');
      window.alert('Denúncia enviada. Obrigado.');
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao denunciar');
    } finally {
      setReporting(false);
    }
  };

  const handleMessage = async () => {
    if (!user || startingDm) return;
    setStartingDm(true);
    try {
      const conversation = await startConversation(user.username);
      router.push(`/messages/${conversation.id}`);
    } catch {
      setStartingDm(false);
    }
  };

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-offme-border bg-offme-bg/80 px-3 py-2 backdrop-blur-md sm:gap-6 sm:px-4">
        <Link href="/" className="rounded-full p-2 transition-colors hover:bg-offme-hover">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{user.displayName}</h1>
          <p className="text-sm text-offme-muted">{posts.length} posts</p>
        </div>
      </header>

      <div className="relative h-32 bg-offme-surface sm:h-48">
        {user.bannerUrl ? (
          <img src={user.bannerUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="px-4 pb-4">
        <div className="flex items-end justify-between gap-2">
          <div className="-mt-10 sm:-mt-12">
            <Avatar url={user.avatarUrl} size="lg" />
          </div>
          {isOwnProfile ? (
            <button
              onClick={() => setShowEdit(true)}
              className="mt-2 shrink-0 rounded-full border border-offme-border px-3 py-1.5 text-sm font-bold transition-colors hover:bg-offme-hover sm:mt-3 sm:px-4 sm:py-2"
            >
              Editar perfil
            </button>
          ) : (
            <div className="mt-2 flex shrink-0 flex-wrap gap-2 sm:mt-3">
              <button
                onClick={handleMessage}
                disabled={startingDm}
                className="rounded-full border border-offme-border px-3 py-1.5 text-sm font-bold transition-colors hover:bg-offme-hover disabled:opacity-50 sm:px-4 sm:py-2"
              >
                {startingDm ? '...' : 'Mensagem'}
              </button>
              <FollowButton user={user} onUpdate={handleFollowUpdate} />
              <button
                onClick={handleReportUser}
                disabled={reporting}
                className="rounded-full border border-red-500/40 px-3 py-1.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50 sm:px-4 sm:py-2"
              >
                {reporting ? '...' : 'Denunciar usuário'}
              </button>
            </div>
          )}
        </div>

        <div className="mt-3">
          <h2 className="text-xl font-bold">
            {user.displayName}
            {user.verified && <VerifiedBadge className="ml-1 inline-block" />}
          </h2>
          <p className="text-offme-muted">@{user.username}</p>
          {user.bio && <p className="mt-3 text-[15px]">{user.bio}</p>}
          {(user.location || user.websiteUrl) && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-offme-muted">
              {user.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {user.location}
                </span>
              )}
              {user.websiteUrl && (
                <a
                  href={user.websiteUrl.startsWith('http') ? user.websiteUrl : `https://${user.websiteUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-offme-accent hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link2 className="h-4 w-4" />
                  {user.websiteUrl.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          )}
          <div className="mt-3 flex gap-4 text-sm text-offme-muted">
            <span>
              <strong className="text-offme-text">{formatCount(user.followingCount ?? 0)}</strong>{' '}
              seguindo
            </span>
            <span>
              <strong className="text-offme-text">{formatCount(user.followerCount ?? 0)}</strong>{' '}
              seguidores
            </span>
          </div>
        </div>
      </div>

      <div className="border-b border-offme-border">
        <div className="px-4 py-4 text-center font-bold">Posts</div>
      </div>

      {postsError && (
        <div className="px-4 py-8 text-center text-red-400">Erro ao carregar posts.</div>
      )}
      {!postsError && posts.length === 0 && (
        <div className="px-4 py-12 text-center text-offme-muted">
          {isOwnProfile ? 'Você ainda não publicou nada.' : 'Este usuário ainda não publicou nada.'}
        </div>
      )}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {showEdit && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEdit(false)}
          onSaved={handleProfileSaved}
        />
      )}
    </div>
  );
}