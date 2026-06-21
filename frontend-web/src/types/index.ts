export interface User {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bannerUrl?: string;
  verified: boolean;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
}

export interface Post {
  id: number;
  authorId: number;
  author?: User;
  text: string;
  createdAt: number;
  likeCount: number;
  repostCount: number;
  replyCount: number;
  mediaUrls?: string[];
  replyToId?: number;
  quoteOfId?: number;
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
  repostedByMe?: boolean;
  timelineSource?: 'following' | 'repost' | 'recommended';
}

export interface TimelineEntry {
  postId: number;
  authorId: number;
  source: 'following' | 'repost' | 'recommended';
  createdAt: number;
  post?: Post;
}

export interface TimelineResponse {
  entries: TimelineEntry[];
  nextCursor?: string;
}

export type FeedTab = 'for-you' | 'following';

export type NotificationType = 'like' | 'reply' | 'follow' | 'repost';

export interface Conversation {
  id: number;
  participant: User;
  updatedAt: number;
  lastMessage?: {
    text: string;
    createdAt: number;
    senderId: number;
  };
}

export interface DirectMessage {
  id: number;
  conversationId: number;
  senderId: number;
  text: string;
  createdAt: number;
  isMine?: boolean;
}

export interface Notification {
  id: number;
  type: NotificationType;
  postId?: number;
  read: boolean;
  createdAt: number;
  actor: User;
}