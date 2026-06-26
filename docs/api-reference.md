# OffMe API Reference

## Overview

The OffMe API provides programmatic access to all features of the OffMe social media platform. This reference guide covers the main endpoints, authentication, and usage patterns.

## Base URL

```
https://api.offme.com/api/v1
```

## Authentication

OffMe uses JWT (JSON Web Tokens) for authentication. Most endpoints require an `Authorization` header:

```http
Authorization: Bearer <your_access_token>
```

### Token Types

- **Access Token**: Short-lived (15 minutes) for API access
- **Refresh Token**: Long-lived (30 days) for obtaining new access tokens

### Obtaining Tokens

```bash
# Login to get tokens
POST /auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

## Rate Limiting

All endpoints are rate limited. Response headers include:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

## Error Handling

Errors follow a consistent format:

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "trace_id": "unique_trace_identifier",
  "correlation_id": "request_correlation_id"
}
```

## API Endpoints

### Authentication

#### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "New User"
}
```

**Response:**
```json
{
  "user": {
    "id": 123,
    "username": "newuser",
    "email": "user@example.com",
    "name": "New User"
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 900
  }
}
```

#### Login User

```http
POST /auth/login
Content-Type: application/json

{
  "username": "existinguser",
  "password": "userpassword"
}
```

**Response:** Same as registration response

#### Refresh Token

```http
POST /auth/refresh
Authorization: Bearer <expired_access_token>
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Logout User

```http
POST /auth/logout
Authorization: Bearer <access_token>
```

### Users

#### Get Current User

```http
GET /users/me
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": 123,
  "username": "currentuser",
  "email": "user@example.com",
  "name": "Current User",
  "bio": "Software developer",
  "website": "https://example.com",
  "location": "San Francisco",
  "avatar_url": "https://...",
  "banner_url": "https://...",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-02T00:00:00Z",
  "stats": {
    "posts_count": 42,
    "followers_count": 150,
    "following_count": 80,
    "likes_count": 250
  }
}
```

#### Update Current User

```http
PATCH /users/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "bio": "Updated biography",
  "website": "https://updated.com"
}
```

#### Get User by ID

```http
GET /users/123
Authorization: Bearer <access_token>
```

#### Get User by Username

```http
GET /users/johndoe
Authorization: Bearer <access_token>
```

### Posts

#### Create Post

```http
POST /posts
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "Hello world! This is my first post on OffMe.",
  "visibility": "public",
  "media_urls": ["https://.../image1.jpg", "https://.../image2.jpg"]
}
```

**Response:**
```json
{
  "id": 456,
  "user_id": 123,
  "content": "Hello world! This is my first post on OffMe.",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z",
  "visibility": "public",
  "media_urls": ["https://.../image1.jpg", "https://.../image2.jpg"],
  "stats": {
    "likes_count": 0,
    "reposts_count": 0,
    "replies_count": 0,
    "views_count": 0
  },
  "user": {
    "id": 123,
    "username": "currentuser",
    "name": "Current User",
    "avatar_url": "https://..."
  },
  "is_liked": false,
  "is_reposted": false
}
```

#### Get Post by ID

```http
GET /posts/456
Authorization: Bearer <access_token>
```

#### Delete Post

```http
DELETE /posts/456
Authorization: Bearer <access_token>
```

#### Get Multiple Posts

```http
GET /posts?ids=456,457,458
Authorization: Bearer <access_token>
```

### Timeline

#### Get Home Timeline

```http
GET /timeline/home?limit=20&cursor=next_page_cursor
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "posts": [
    {
      "id": 789,
      "user_id": 456,
      "content": "Post content...",
      "created_at": "2023-01-01T00:00:00Z",
      "user": {
        "id": 456,
        "username": "otheruser",
        "name": "Other User"
      },
      "stats": {
        "likes_count": 5,
        "reposts_count": 1,
        "replies_count": 2
      }
    }
  ],
  "cursor": "next_page_cursor_value",
  "stats": {
    "total_posts": 100,
    "unread_count": 5
  }
}
```

#### Get User Timeline

```http
GET /timeline/user/123?limit=20&cursor=next_page_cursor
Authorization: Bearer <access_token>
```

### Social Graph

#### Follow User

```http
POST /graph/follow/456
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "user_id": 123,
  "following_user_id": 456,
  "created_at": "2023-01-01T00:00:00Z",
  "user": {
    "id": 456,
    "username": "otheruser",
    "name": "Other User"
  }
}
```

#### Unfollow User

```http
DELETE /graph/follow/456
Authorization: Bearer <access_token>
```

#### Get Followers

```http
GET /graph/followers/123?limit=20&cursor=next_page_cursor
Authorization: Bearer <access_token>
```

#### Get Following

```http
GET /graph/following/123?limit=20&cursor=next_page_cursor
Authorization: Bearer <access_token>
```

### Notifications

#### Get Notifications

```http
GET /notifications?limit=20&cursor=next_page_cursor&types=like,follow
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "abc-123-def-456",
      "type": "like",
      "user_id": 123,
      "from_user_id": 456,
      "post_id": 789,
      "created_at": "2023-01-01T00:00:00Z",
      "read": false,
      "metadata": {
        "post_content": "Liked post content..."
      }
    }
  ],
  "cursor": "next_page_cursor_value",
  "unread_count": 3
}
```

#### Mark Notifications as Read

```http
POST /notifications/mark-read
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "notification_ids": ["abc-123-def-456", "ghi-789-jkl-012"],
  "mark_all": false
}
```

## Webhooks

OffMe supports webhooks for real-time notifications. Configure webhooks in your account settings.

### Webhook Events

- `post.created`: A new post is created
- `post.liked`: A post is liked
- `post.reposted`: A post is reposted
- `user.followed`: A user is followed
- `notification.created`: A new notification is created

### Webhook Payload Example

```json
{
  "event": "post.liked",
  "timestamp": "2023-01-01T00:00:00Z",
  "data": {
    "post_id": 789,
    "user_id": 123,
    "liked_by_user_id": 456,
    "post_content": "Liked post content..."
  },
  "signature": "hmac_signature_for_verification"
}
```

## SDKs and Client Libraries

### JavaScript/TypeScript

```bash
npm install offme-sdk
```

```javascript
import { OffMeClient } from 'offme-sdk';

const client = new OffMeClient({
  apiKey: 'your_api_key',
  accessToken: 'your_access_token'
});

// Get user timeline
const timeline = await client.timeline.getHomeTimeline();
```

### Python

```bash
pip install offme-sdk
```

```python
from offme import OffMeClient

client = OffMeClient(
    api_key="your_api_key",
    access_token="your_access_token"
)

# Get user timeline
timeline = client.timeline.get_home_timeline()
```

## Best Practices

### Pagination

Use cursor-based pagination for all list endpoints:

```http
GET /timeline/home?limit=20&cursor=next_page_cursor
```

### Error Handling

Always handle API errors gracefully:

```javascript
try {
  const response = await client.posts.create(postData);
} catch (error) {
  if (error.code === 'rate_limit_exceeded') {
    // Handle rate limiting
  } else if (error.code === 'unauthorized') {
    // Refresh token and retry
  }
}
```

### Rate Limiting

Implement exponential backoff for rate limited requests:

```javascript
async function makeRequestWithRetry(requestFn, maxRetries = 3) {
  try {
    return await requestFn();
  } catch (error) {
    if (error.code === 'rate_limit_exceeded' && maxRetries > 0) {
      const retryAfter = parseInt(error.headers['X-RateLimit-Reset']) - Date.now();
      await new Promise(resolve => setTimeout(resolve, retryAfter));
      return makeRequestWithRetry(requestFn, maxRetries - 1);
    }
    throw error;
  }
}
```

## Monitoring and Observability

### Metrics Endpoint

```http
GET /metrics
```

Returns Prometheus-format metrics for monitoring:

```
# HELP api_gateway_requests_total Total number of HTTP requests
# TYPE api_gateway_requests_total counter
api_gateway_requests_total{method="get",path="/timeline/home"} 1234
...
```

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2023-01-01T00:00:00Z",
  "services": {
    "postgres": {
      "status": "healthy",
      "response_time_ms": 2.3
    },
    "cassandra": {
      "status": "healthy",
      "response_time_ms": 1.8
    }
  },
  "version": "1.0.0",
  "environment": "production"
}
```

## API Documentation

### Interactive Documentation

- **Swagger UI**: `/api-docs`
- **ReDoc**: `/api-docs/redoc`
- **OpenAPI Spec**: `/api-docs/openapi.yaml`

### Changelog

See [CHANGELOG.md](CHANGELOG.md) for API version history and breaking changes.

## Support

For API support, contact: support@offme.com

For bug reports and feature requests, open an issue on GitHub:
https://github.com/rulio1/OffMe/issues