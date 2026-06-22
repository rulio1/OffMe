export interface User {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bannerUrl?: string;
  location?: string;
  websiteUrl?: string;
  verified: boolean;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
}

export interface PollOption {
  id: number;
  position: number;
  label: string;
  voteCount: number;
}

export interface Poll {
  postId: number;
  durationSecs: number;
  endsAt: number;
  totalVotes: number;
  ended: boolean;
  votedOptionId?: number;
  options: PollOption[];
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
  quotedPost?: Post;
  poll?: Poll;
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
  repostedByMe?: boolean;
  timelineSource?: 'following' | 'repost' | 'recommended';
  scheduledAt?: number;
  status?: 'draft' | 'scheduled' | 'published' | 'failed';
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

export type NotificationType = 'like' | 'reply' | 'follow' | 'repost' | 'quote';

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