namespace java com.pulse.thrift
namespace scala com.pulse.thrift

// ============================================================
// Common types
// ============================================================

typedef i64 UserId
typedef i64 PostId
typedef string PublicId

enum PostType {
  TEXT = 1,
  MEDIA = 2,
  POLL = 3,
  QUOTE = 4,
}

enum Visibility {
  PUBLIC = 1,
  FOLLOWERS = 2,
  MENTIONED = 3,
}

enum TimelineSource {
  FOLLOWING = 1,
  REPOST = 2,
  RECOMMENDED = 3,
}

struct User {
  1: required UserId id,
  2: required string username,
  3: required string displayName,
  4: optional string bio,
  5: optional string avatarUrl,
  6: optional bool verified,
  7: optional i32 followerCount,
  8: optional i32 followingCount,
}

struct Post {
  1: required PostId id,
  2: required UserId authorId,
  3: required string text,
  4: required PostType postType,
  5: required Visibility visibility,
  6: optional PostId replyToId,
  7: optional PostId quoteOfId,
  8: optional i64 createdAt,
  9: optional i32 likeCount,
  10: optional i32 repostCount,
  11: optional i32 replyCount,
  12: optional list<string> mediaUrls,
}

struct TimelineEntry {
  1: required PostId postId,
  2: required UserId authorId,
  3: required i64 createdAt,
  4: required TimelineSource source,
  5: optional double score,
}

struct Cursor {
  1: optional string value,
  2: optional i32 limit,
}

// ============================================================
// Post Service
// ============================================================

struct CreatePostRequest {
  1: required UserId authorId,
  2: required string text,
  3: optional PostType postType,
  4: optional Visibility visibility,
  5: optional PostId replyToId,
  6: optional PostId quoteOfId,
  7: optional list<string> mediaIds,
  8: optional string idempotencyKey,
}

struct CreatePostResponse {
  1: required PostId postId,
  2: required Post createdPost,
}

exception PostNotFound {
  1: required PostId postId,
}

exception InvalidPost {
  1: required string reason,
}

service PostService {
  CreatePostResponse createPost(1: CreatePostRequest request)
    throws (1: InvalidPost invalid),

  Post getPost(1: PostId postId)
    throws (1: PostNotFound notFound),

  list<Post> getPosts(1: list<PostId> postIds),

  void deletePost(1: UserId authorId, 2: PostId postId)
    throws (1: PostNotFound notFound, 2: InvalidPost invalid),
}

// ============================================================
// Timeline Service
// ============================================================

struct GetHomeTimelineRequest {
  1: required UserId userId,
  2: optional Cursor cursor,
}

struct GetHomeTimelineResponse {
  1: required list<TimelineEntry> entries,
  2: optional string nextCursor,
}

struct FanoutRequest {
  1: required PostId postId,
  2: required UserId authorId,
  3: required i32 followerCount,
}

service TimelineService {
  GetHomeTimelineResponse getHomeTimeline(1: GetHomeTimelineRequest request),

  GetHomeTimelineResponse getForYouTimeline(1: GetHomeTimelineRequest request),

  void fanoutPost(1: FanoutRequest request),

  void invalidateTimelineCache(1: UserId userId),
}

// ============================================================
// Graph Service
// ============================================================

struct FollowRequest {
  1: required UserId followerId,
  2: required UserId followeeId,
}

struct GetFollowersRequest {
  1: required UserId userId,
  2: optional i64 cursor,
  3: optional i32 limit,
}

struct GetFollowersResponse {
  1: required list<UserId> followerIds,
  2: optional i64 nextCursor,
}

service GraphService {
  void follow(1: FollowRequest request),
  void unfollow(1: FollowRequest request),
  GetFollowersResponse getFollowers(1: GetFollowersRequest request),
  GetFollowersResponse getFollowing(1: GetFollowersRequest request),
  bool isFollowing(1: UserId followerId, 2: UserId followeeId),
  i32 getFollowerCount(1: UserId userId),
}

// ============================================================
// Identity Service
// ============================================================

struct AuthRequest {
  1: required string email,
  2: required string password,
}

struct AuthResponse {
  1: required string accessToken,
  2: required string refreshToken,
  3: required User user,
}

struct RegisterRequest {
  1: required string username,
  2: required string email,
  3: required string password,
  4: required string displayName,
}

service IdentityService {
  AuthResponse register(1: RegisterRequest request),
  AuthResponse login(1: AuthRequest request),
  User getUser(1: UserId userId),
  User getUserByUsername(1: string username),
}