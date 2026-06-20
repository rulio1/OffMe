export interface User {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  verified: boolean;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
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