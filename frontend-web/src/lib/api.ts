import type { Conversation, DirectMessage, Notification, TimelineResponse, Post, User } from '@/types';
import {
  getToken,
  getRefreshToken,
  getStoredUser,
  setSession,
  type AuthSession,
} from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

let refreshInFlight: Promise<AuthSession | null> | null = null;

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  const user = getStoredUser();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (user) headers['X-User-Id'] = String(user.id);
  return headers;
}

async function refreshSession(): Promise<AuthSession | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      const session: AuthSession = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: normalizeUser(data.user),
      };
      setSession(session);
      return session;
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

export async function bootstrapSession(): Promise<AuthSession | null> {
  return refreshSession();
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = { ...getAuthHeaders(), ...(init.headers as Record<string, string> | undefined) };

  let res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (res.status === 401 && getRefreshToken()) {
    const session = await refreshSession();
    if (session) {
      const retryHeaders = {
        ...getAuthHeaders(),
        ...(init.headers as Record<string, string> | undefined),
      };
      res = await fetch(`${API_BASE}${path}`, { ...init, headers: retryHeaders });
    }
  }

  return res;
}

async function parseError(res: Response, fallback: string): Promise<never> {
  const err = await res.json().catch(() => ({}));
  throw new Error(err.message || fallback);
}

export async function login(identifier: string, password: string): Promise<AuthSession> {
  const value = identifier.trim().toLowerCase();
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: value, email: value, password }),
  });

  if (!res.ok) await parseError(res, 'E-mail/usuário ou senha inválidos');

  const data = await res.json();
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: normalizeUser(data.user),
  };
}

export async function register(
  username: string,
  email: string,
  password: string,
  displayName: string
): Promise<AuthSession> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password, displayName }),
  });

  if (!res.ok) await parseError(res, 'Não foi possível criar a conta');

  const data = await res.json();
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: normalizeUser(data.user),
  };
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => {});
}

export async function fetchCurrentUser(): Promise<User | null> {
  const res = await apiFetch('/auth/me');
  if (!res.ok) return null;
  const data = await res.json();
  return normalizeUser(data.user);
}

function normalizeUser(raw: Record<string, unknown>): User {
  return {
    id: Number(raw.id),
    username: String(raw.username),
    displayName: String(raw.displayName ?? raw.display_name ?? raw.username),
    avatarUrl: raw.avatarUrl ? String(raw.avatarUrl) : undefined,
    bannerUrl:
      raw.bannerUrl != null && String(raw.bannerUrl).trim() !== ''
        ? String(raw.bannerUrl)
        : undefined,
    location: raw.location ? String(raw.location) : undefined,
    websiteUrl: raw.websiteUrl ? String(raw.websiteUrl) : undefined,
    verified: Boolean(raw.verified),
    bio: raw.bio ? String(raw.bio) : undefined,
    followerCount: raw.followerCount != null ? Number(raw.followerCount) : undefined,
    followingCount: raw.followingCount != null ? Number(raw.followingCount) : undefined,
    isFollowing: raw.isFollowing != null ? Boolean(raw.isFollowing) : undefined,
  };
}

function normalizePoll(raw: Record<string, unknown>) {
  return {
    postId: Number(raw.postId),
    durationSecs: Number(raw.durationSecs ?? 86400),
    endsAt: Number(raw.endsAt),
    totalVotes: Number(raw.totalVotes ?? 0),
    ended: Boolean(raw.ended),
    votedOptionId: raw.votedOptionId != null ? Number(raw.votedOptionId) : undefined,
    options: Array.isArray(raw.options)
      ? raw.options.map((o) => {
          const opt = o as Record<string, unknown>;
          return {
            id: Number(opt.id),
            position: Number(opt.position),
            label: String(opt.label),
            voteCount: Number(opt.voteCount ?? 0),
          };
        })
      : [],
  };
}

function normalizePost(raw: Record<string, unknown>): Post {
  return {
    id: Number(raw.id),
    authorId: Number(raw.authorId),
    author: raw.author ? normalizeUser(raw.author as Record<string, unknown>) : undefined,
    text: String(raw.text ?? ''),
    createdAt: Number(raw.createdAt),
    likeCount: Number(raw.likeCount ?? 0),
    repostCount: Number(raw.repostCount ?? 0),
    replyCount: Number(raw.replyCount ?? 0),
    replyToId: raw.replyToId != null ? Number(raw.replyToId) : undefined,
    quoteOfId: raw.quoteOfId != null ? Number(raw.quoteOfId) : undefined,
    quotedPost: raw.quotedPost
      ? normalizePost(raw.quotedPost as Record<string, unknown>)
      : undefined,
    poll: raw.poll ? normalizePoll(raw.poll as Record<string, unknown>) : undefined,
    likedByMe: raw.likedByMe != null ? Boolean(raw.likedByMe) : undefined,
    bookmarkedByMe: raw.bookmarkedByMe != null ? Boolean(raw.bookmarkedByMe) : undefined,
    repostedByMe: raw.repostedByMe != null ? Boolean(raw.repostedByMe) : undefined,
    mediaUrls: Array.isArray(raw.mediaUrls) ? raw.mediaUrls.map(String) : undefined,
    scheduledAt: raw.scheduledAt != null ? Number(raw.scheduledAt) : undefined,
    status: raw.status != null ? (raw.status as Post['status']) : undefined,
  };
}

export async function fetchHomeTimeline(cursor?: string): Promise<TimelineResponse> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  const res = await apiFetch(`/timeline/home?${params}`);
  if (!res.ok) await parseError(res, 'Erro ao carregar timeline');
  return res.json();
}

export async function fetchForYouTimeline(cursor?: string): Promise<TimelineResponse> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  const res = await apiFetch(`/timeline/for-you?${params}`);
  if (!res.ok) await parseError(res, 'Erro ao carregar timeline');
  return res.json();
}

export interface UploadedMedia {
  id: string;
  url: string;
  mimeType: string;
  fileSizeBytes: number;
}

export async function uploadImage(file: File): Promise<UploadedMedia> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiFetch('/media/upload', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) await parseError(res, 'Erro ao enviar imagem');
  return res.json();
}

export async function createPost(
  text: string,
  replyToId?: number,
  mediaIds?: string[],
  options?: {
    quoteOfId?: number;
    pollOptions?: string[];
    scheduledAt?: string;
    communityId?: number;
  }
): Promise<Post> {
  const res = await apiFetch('/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      replyToId,
      mediaIds,
      quoteOfId: options?.quoteOfId,
      pollOptions: options?.pollOptions,
      scheduledAt: options?.scheduledAt,
      communityId: options?.communityId,
    }),
  });
  if (!res.ok) await parseError(res, 'Erro ao publicar');
  const data = await res.json();
  return normalizePost(data);
}

export async function deletePost(postId: number): Promise<void> {
  const res = await apiFetch(`/posts/${postId}`, { method: 'DELETE' });
  if (!res.ok) await parseError(res, 'Erro ao excluir post');
}

export async function blockUser(username: string): Promise<void> {
  const res = await apiFetch(`/users/${encodeURIComponent(username)}/block`, {
    method: 'POST',
  });
  if (!res.ok) await parseError(res, 'Erro ao bloquear usuário');
}

export async function muteUser(username: string): Promise<void> {
  const res = await apiFetch(`/users/${encodeURIComponent(username)}/mute`, {
    method: 'POST',
  });
  if (!res.ok) await parseError(res, 'Erro ao silenciar usuário');
}

export async function unblockUser(username: string): Promise<void> {
  const res = await apiFetch(`/users/${encodeURIComponent(username)}/block`, {
    method: 'DELETE',
  });
  if (!res.ok) await parseError(res, 'Erro ao desbloquear usuário');
}

export async function unmuteUser(username: string): Promise<void> {
  const res = await apiFetch(`/users/${encodeURIComponent(username)}/mute`, {
    method: 'DELETE',
  });
  if (!res.ok) await parseError(res, 'Erro ao remover silêncio');
}

export async function fetchBlockedUsers(): Promise<{ users: User[] }> {
  const res = await apiFetch('/users/me/blocks');
  if (!res.ok) await parseError(res, 'Erro ao carregar bloqueados');
  const data = await res.json();
  return { users: (data.users ?? []).map(normalizeUser) };
}

export async function fetchMutedUsers(): Promise<{ users: User[] }> {
  const res = await apiFetch('/users/me/mutes');
  if (!res.ok) await parseError(res, 'Erro ao carregar silenciados');
  const data = await res.json();
  return { users: (data.users ?? []).map(normalizeUser) };
}

export async function fetchScheduledPosts(): Promise<{ posts: Post[] }> {
  const res = await apiFetch('/posts/scheduled');
  if (!res.ok) await parseError(res, 'Erro ao carregar posts agendados');
  const data = await res.json();
  return { posts: (data.posts ?? []).map(normalizePost) };
}

export async function updateScheduledPost(
  postId: number,
  input: { text?: string; scheduledAt?: string }
): Promise<Post> {
  const res = await apiFetch(`/posts/${postId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res, 'Erro ao atualizar post');
  const data = await res.json();
  return normalizePost(data);
}

export async function deactivateAccount(): Promise<void> {
  const res = await apiFetch('/users/me', { method: 'DELETE' });
  if (!res.ok) await parseError(res, 'Erro ao excluir conta');
}

export type ReportReason = 'spam' | 'abuse' | 'other';

export async function reportPost(postId: number, reason: ReportReason): Promise<void> {
  const res = await apiFetch(`/posts/${postId}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) await parseError(res, 'Erro ao denunciar post');
}

export async function reportUser(username: string, reason: ReportReason): Promise<void> {
  const res = await apiFetch(`/users/${encodeURIComponent(username)}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) await parseError(res, 'Erro ao denunciar usuário');
}

export async function votePoll(postId: number, optionId: number) {
  const res = await apiFetch(`/posts/${postId}/poll/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ optionId }),
  });
  if (!res.ok) await parseError(res, 'Erro ao votar');
  const data = await res.json();
  return normalizePoll(data.poll as Record<string, unknown>);
}

export async function fetchSuggestedUsers(limit = 5): Promise<{ users: User[] }> {
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await apiFetch(`/users/suggestions?${params}`);
  if (!res.ok) await parseError(res, 'Erro ao carregar sugestões');
  const data = await res.json();
  return { users: (data.users ?? []).map(normalizeUser) };
}

export async function searchUsers(query: string): Promise<{ users: User[] }> {
  const params = new URLSearchParams({ q: query });
  const res = await apiFetch(`/users/search?${params}`);
  if (!res.ok) await parseError(res, 'Erro na busca');
  const data = await res.json();
  return { users: (data.users ?? []).map(normalizeUser) };
}

export async function searchPosts(query: string): Promise<{ posts: Post[] }> {
  const params = new URLSearchParams({ q: query });
  const res = await apiFetch(`/posts/search?${params}`);
  if (!res.ok) await parseError(res, 'Erro na busca de posts');
  const data = await res.json();
  return { posts: (data.posts ?? []).map(normalizePost) };
}

export async function fetchTrendingPosts(): Promise<{ posts: Post[] }> {
  const res = await apiFetch('/posts/search?trending=1');
  if (!res.ok) await parseError(res, 'Erro ao carregar trending');
  const data = await res.json();
  return { posts: (data.posts ?? []).map(normalizePost) };
}

export async function fetchUserProfile(
  username: string
): Promise<{ user: User; isOwnProfile: boolean }> {
  const res = await apiFetch(`/users/${encodeURIComponent(username)}`);
  if (!res.ok) await parseError(res, 'Perfil não encontrado');
  const data = await res.json();
  return {
    user: normalizeUser(data.user),
    isOwnProfile: Boolean(data.isOwnProfile),
  };
}

export async function fetchUserPosts(username: string): Promise<TimelineResponse> {
  const res = await apiFetch(`/users/${encodeURIComponent(username)}/posts`);
  if (!res.ok) await parseError(res, 'Erro ao carregar posts');
  return res.json();
}

export async function followUser(username: string): Promise<User> {
  const res = await apiFetch(`/users/${encodeURIComponent(username)}/follow`, {
    method: 'POST',
  });
  if (!res.ok) await parseError(res, 'Erro ao seguir');
  const data = await res.json();
  return normalizeUser(data.user);
}

export async function unfollowUser(username: string): Promise<User> {
  const res = await apiFetch(`/users/${encodeURIComponent(username)}/follow`, {
    method: 'DELETE',
  });
  if (!res.ok) await parseError(res, 'Erro ao deixar de seguir');
  const data = await res.json();
  return normalizeUser(data.user);
}

export async function likePost(postId: number): Promise<{ postId: number; likeCount: number; likedByMe: boolean }> {
  const res = await apiFetch(`/posts/${postId}/like`, { method: 'POST' });
  if (!res.ok) await parseError(res, 'Erro ao curtir');
  return res.json();
}

export async function unlikePost(postId: number): Promise<{ postId: number; likeCount: number; likedByMe: boolean }> {
  const res = await apiFetch(`/posts/${postId}/like`, { method: 'DELETE' });
  if (!res.ok) await parseError(res, 'Erro ao remover curtida');
  return res.json();
}

export async function bookmarkPost(postId: number): Promise<{ postId: number; bookmarkedByMe: boolean }> {
  const res = await apiFetch(`/posts/${postId}/bookmark`, { method: 'POST' });
  if (!res.ok) await parseError(res, 'Erro ao salvar');
  return res.json();
}

export async function unbookmarkPost(postId: number): Promise<{ postId: number; bookmarkedByMe: boolean }> {
  const res = await apiFetch(`/posts/${postId}/bookmark`, { method: 'DELETE' });
  if (!res.ok) await parseError(res, 'Erro ao remover dos salvos');
  return res.json();
}

export async function repostPost(
  postId: number
): Promise<{ postId: number; repostCount: number; repostedByMe: boolean }> {
  const res = await apiFetch(`/posts/${postId}/repost`, { method: 'POST' });
  if (!res.ok) await parseError(res, 'Erro ao repostar');
  return res.json();
}

export async function unrepostPost(
  postId: number
): Promise<{ postId: number; repostCount: number; repostedByMe: boolean }> {
  const res = await apiFetch(`/posts/${postId}/repost`, { method: 'DELETE' });
  if (!res.ok) await parseError(res, 'Erro ao remover repost');
  return res.json();
}

export async function fetchBookmarks(cursor?: string): Promise<TimelineResponse> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  const res = await apiFetch(`/bookmarks?${params}`);
  if (!res.ok) await parseError(res, 'Erro ao carregar salvos');
  return res.json();
}

export async function fetchPost(postId: number): Promise<Post> {
  const res = await apiFetch(`/posts/${postId}`);
  if (!res.ok) await parseError(res, 'Post não encontrado');
  return res.json();
}

export async function fetchPostReplies(postId: number, cursor?: string): Promise<TimelineResponse> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  const res = await apiFetch(`/posts/${postId}/replies?${params}`);
  if (!res.ok) await parseError(res, 'Erro ao carregar respostas');
  return res.json();
}

export async function updateProfile(input: {
  displayName?: string;
  bio?: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  location?: string | null;
  websiteUrl?: string | null;
}): Promise<User> {
  const res = await apiFetch('/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res, 'Erro ao atualizar perfil');
  const data = await res.json();
  return normalizeUser(data.user);
}

export async function fetchNotifications(): Promise<{
  notifications: Notification[];
  unreadCount: number;
}> {
  const res = await apiFetch('/notifications');
  if (!res.ok) await parseError(res, 'Erro ao carregar notificações');
  const data = await res.json();
  return {
    unreadCount: Number(data.unreadCount ?? 0),
    notifications: (data.notifications ?? []).map((n: Record<string, unknown>) => ({
      id: Number(n.id),
      type: n.type as Notification['type'],
      postId: n.postId != null ? Number(n.postId) : undefined,
      read: Boolean(n.read),
      createdAt: Number(n.createdAt),
      actor: normalizeUser(n.actor as Record<string, unknown>),
    })),
  };
}

export async function markNotificationsRead(): Promise<void> {
  const res = await apiFetch('/notifications', { method: 'PATCH' });
  if (!res.ok) await parseError(res, 'Erro ao marcar notificações');
}

export async function fetchConversations(): Promise<{ conversations: Conversation[] }> {
  const res = await apiFetch('/conversations');
  if (!res.ok) await parseError(res, 'Erro ao carregar conversas');
  const data = await res.json();
  return {
    conversations: (data.conversations ?? []).map((c: Record<string, unknown>) => ({
      id: Number(c.id),
      updatedAt: Number(c.updatedAt),
      participant: normalizeUser(c.participant as Record<string, unknown>),
      lastMessage: c.lastMessage
        ? {
            text: String((c.lastMessage as Record<string, unknown>).text),
            createdAt: Number((c.lastMessage as Record<string, unknown>).createdAt),
            senderId: Number((c.lastMessage as Record<string, unknown>).senderId),
          }
        : undefined,
    })),
  };
}

export async function startConversation(username: string): Promise<Conversation> {
  const res = await apiFetch('/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) await parseError(res, 'Erro ao iniciar conversa');
  const data = await res.json();
  const c = data.conversation as Record<string, unknown>;
  return {
    id: Number(c.id),
    updatedAt: Number(c.updatedAt),
    participant: normalizeUser(c.participant as Record<string, unknown>),
    lastMessage: c.lastMessage
      ? {
          text: String((c.lastMessage as Record<string, unknown>).text),
          createdAt: Number((c.lastMessage as Record<string, unknown>).createdAt),
          senderId: Number((c.lastMessage as Record<string, unknown>).senderId),
        }
      : undefined,
  };
}

export async function fetchMessages(
  conversationId: number,
  before?: string
): Promise<{ messages: DirectMessage[]; nextCursor?: string }> {
  const params = new URLSearchParams();
  if (before) params.set('before', before);
  const res = await apiFetch(`/conversations/${conversationId}/messages?${params}`);
  if (!res.ok) await parseError(res, 'Erro ao carregar mensagens');
  const data = await res.json();
  return {
    nextCursor: data.nextCursor,
    messages: (data.messages ?? []).map((m: Record<string, unknown>) => ({
      id: Number(m.id),
      conversationId: Number(m.conversationId),
      senderId: Number(m.senderId),
      text: String(m.text),
      createdAt: Number(m.createdAt),
      isMine: Boolean(m.isMine),
    })),
  };
}

export interface AdminReport {
  id: number;
  reporterId: number;
  reporterUsername: string;
  reporterDisplayName: string;
  targetType: 'post' | 'user';
  targetId: number;
  reason: string;
  status: string;
  createdAt: number;
  postText?: string;
  postAuthorUsername?: string;
  targetUsername?: string;
  targetDisplayName?: string;
  targetSuspended?: boolean;
}

export interface VerificationRequestInfo {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  createdAt: number;
  reviewedAt?: number;
}

export async function fetchAdminReports(): Promise<{ reports: AdminReport[] }> {
  const res = await apiFetch('/admin/reports');
  if (!res.ok) await parseError(res, 'Erro ao carregar denúncias');
  return res.json();
}

export async function updateAdminReport(
  reportId: number,
  action: 'resolve' | 'dismiss'
): Promise<void> {
  const res = await apiFetch(`/admin/reports/${reportId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) await parseError(res, 'Erro ao atualizar denúncia');
}

export async function suspendAdminUser(
  userId: number,
  reason: string
): Promise<void> {
  const res = await apiFetch(`/admin/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'suspend', reason }),
  });
  if (!res.ok) await parseError(res, 'Erro ao suspender usuário');
}

export async function unsuspendAdminUser(userId: number): Promise<void> {
  const res = await apiFetch(`/admin/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'unsuspend' }),
  });
  if (!res.ok) await parseError(res, 'Erro ao reativar usuário');
}

export interface OffMeList {
  id: number;
  ownerId: number;
  name: string;
  description?: string;
  isPrivate: boolean;
  memberCount: number;
  createdAt: number;
}

export interface OffMeCommunity {
  id: number;
  slug: string;
  name: string;
  description?: string;
  creatorId?: number;
  memberCount: number;
  createdAt: number;
}

export async function fetchLists(): Promise<{ lists: OffMeList[] }> {
  const res = await apiFetch('/lists');
  if (!res.ok) await parseError(res, 'Erro ao carregar listas');
  return res.json();
}

export async function createList(
  name: string,
  description?: string,
  isPrivate = false
): Promise<OffMeList> {
  const res = await apiFetch('/lists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, isPrivate }),
  });
  if (!res.ok) await parseError(res, 'Erro ao criar lista');
  return res.json();
}

export async function fetchList(
  listId: number
): Promise<{ list: OffMeList; members: User[] }> {
  const res = await apiFetch(`/lists/${listId}`);
  if (!res.ok) await parseError(res, 'Erro ao carregar lista');
  const data = await res.json();
  return {
    list: data.list,
    members: (data.members ?? []).map(normalizeUser),
  };
}

export async function addListMember(listId: number, username: string): Promise<void> {
  const res = await apiFetch(`/lists/${listId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) await parseError(res, 'Erro ao adicionar membro');
}

export async function fetchCommunities(): Promise<{ communities: OffMeCommunity[] }> {
  const res = await apiFetch('/communities');
  if (!res.ok) await parseError(res, 'Erro ao carregar comunidades');
  return res.json();
}

export async function createCommunity(
  name: string,
  description?: string
): Promise<OffMeCommunity> {
  const res = await apiFetch('/communities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) await parseError(res, 'Erro ao criar comunidade');
  return res.json();
}

export async function fetchCommunity(slug: string): Promise<{ community: OffMeCommunity }> {
  const res = await apiFetch(`/communities/${encodeURIComponent(slug)}`);
  if (!res.ok) await parseError(res, 'Erro ao carregar comunidade');
  return res.json();
}

export async function joinCommunity(slug: string): Promise<void> {
  const res = await apiFetch(`/communities/${encodeURIComponent(slug)}`, {
    method: 'POST',
  });
  if (!res.ok) await parseError(res, 'Erro ao entrar na comunidade');
}

export async function fetchCommunityTimeline(
  slug: string,
  cursor?: string
): Promise<TimelineResponse & { community: { id: number; slug: string; name: string } }> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  const res = await apiFetch(`/communities/${encodeURIComponent(slug)}/timeline?${params}`);
  if (!res.ok) await parseError(res, 'Erro ao carregar timeline');
  return res.json();
}

export async function registerPushSubscription(subscription: PushSubscriptionJSON): Promise<void> {
  const res = await apiFetch('/push/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      platform: 'web',
      token: subscription.endpoint,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    }),
  });
  if (!res.ok) await parseError(res, 'Erro ao registrar notificações push');
}

export async function unregisterPushSubscription(endpoint: string): Promise<void> {
  const res = await apiFetch('/push/unregister', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: endpoint }),
  });
  if (!res.ok) await parseError(res, 'Erro ao remover notificações push');
}

export async function fetchVerificationStatus(): Promise<{
  request: VerificationRequestInfo | null;
  verified?: boolean;
}> {
  const res = await apiFetch('/verification/request');
  if (!res.ok) await parseError(res, 'Erro ao carregar verificação');
  return res.json();
}

export async function submitVerificationRequest(reason: string): Promise<void> {
  const res = await apiFetch('/verification/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) await parseError(res, 'Erro ao enviar solicitação');
}

export async function fetchAdminVerificationRequests(): Promise<{
  requests: Array<{
    id: number;
    userId: number;
    username: string;
    displayName: string;
    reason: string;
    status: string;
    createdAt: number;
  }>;
}> {
  const res = await apiFetch('/admin/verification');
  if (!res.ok) await parseError(res, 'Erro ao carregar solicitações');
  return res.json();
}

export async function reviewVerificationRequest(
  requestId: number,
  action: 'approve' | 'reject'
): Promise<void> {
  const res = await apiFetch(`/admin/verification/${requestId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) await parseError(res, 'Erro ao revisar solicitação');
}

export async function sendMessage(
  conversationId: number,
  text: string
): Promise<DirectMessage> {
  const res = await apiFetch(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) await parseError(res, 'Erro ao enviar mensagem');
  const m = await res.json();
  return {
    id: Number(m.id),
    conversationId: Number(m.conversationId),
    senderId: Number(m.senderId),
    text: String(m.text),
    createdAt: Number(m.createdAt),
    isMine: Boolean(m.isMine),
  };
}