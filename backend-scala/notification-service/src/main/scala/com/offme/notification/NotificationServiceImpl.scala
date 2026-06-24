package com.offme.notification

import com.offme.shared.ServiceConfig
import com.offme.shared.kafka.{EventConsumer, EventPublisher, Topics}
import com.offme.shared.redis.RedisClient
import com.twitter.util.Future
import java.time.Instant

/** NotificationService — realtime notifications via WebSockets and push.
  *
  * Architecture:
  *   1. Kafka consumers listen to domain events (Follow, Like, Reply, Mention)
  *   2. Notifications written to PostgreSQL + Redis pub/sub
  *   3. WebSocket service pushes to connected clients
  *   4. Mobile push notifications sent via FCM/APNs
  */
class NotificationServiceImpl(
    repo: NotificationRepository,
    redis: RedisClient,
    events: EventPublisher,
    config: ServiceConfig
):
  def createNotification(notification: Notification): Future[Notification] =
    repo.insert(notification).flatMap: inserted =>
      // Publish to user's notification channel
      redis.publish(s"user:${inserted.recipientId}:notifications", inserted).map(_ => inserted)

  def getNotifications(userId: Long, cursor: Option[Long], limit: Int): Future[NotificationsPage] =
    repo.findByUser(userId, cursor, limit)

  def markAsRead(userId: Long, notificationId: Long): Future[Unit] =
    repo.markRead(userId, notificationId)

  def getUnreadCount(userId: Long): Future[Int] =
    repo.countUnread(userId)

  /** Kafka event handlers */
  def handleFollowEvent(event: FollowEvent): Future[Unit] =
    val notification = Notification(
      id = 0,
      recipientId = event.followeeId,
      senderId = event.followerId,
      notificationType = "follow",
      entityId = None,
      entityType = None,
      message = s"@${event.followerUsername} started following you",
      createdAt = Instant.ofEpochMilli(event.timestamp),
      read = false
    )
    createNotification(notification).unit

  def handleLikeEvent(event: LikeEvent): Future[Unit] =
    val notification = Notification(
      id = 0,
      recipientId = event.postAuthorId,
      senderId = event.userId,
      notificationType = "like",
      entityId = Some(event.postId),
      entityType = Some("post"),
      message = s"@${event.username} liked your post",
      createdAt = Instant.ofEpochMilli(event.timestamp),
      read = false
    )
    createNotification(notification).unit

  def handleReplyEvent(event: ReplyEvent): Future[Unit] =
    val notification = Notification(
      id = 0,
      recipientId = event.postAuthorId,
      senderId = event.userId,
      notificationType = "reply",
      entityId = Some(event.replyId),
      entityType = Some("post"),
      message = s"@${event.username} replied to your post",
      createdAt = Instant.ofEpochMilli(event.timestamp),
      read = false
    )
    createNotification(notification).unit

  def handleMentionEvent(event: MentionEvent): Future[Unit] =
    val notification = Notification(
      id = 0,
      recipientId = event.mentionedUserId,
      senderId = event.postAuthorId,
      notificationType = "mention",
      entityId = Some(event.postId),
      entityType = Some("post"),
      message = s"@${event.authorUsername} mentioned you in a post",
      createdAt = Instant.ofEpochMilli(event.timestamp),
      read = false
    )
    createNotification(notification).unit

final case class Notification(
    id: Long,
    recipientId: Long,
    senderId: Long,
    notificationType: String,
    entityId: Option[Long],
    entityType: Option[String],
    message: String,
    createdAt: Instant,
    read: Boolean
)

final case class NotificationsPage(
    notifications: Seq[Notification],
    nextCursor: Option[Long]
)

final case class FollowEvent(
    followerId: Long,
    followerUsername: String,
    followeeId: Long,
    timestamp: Long
)

final case class LikeEvent(
    userId: Long,
    username: String,
    postId: Long,
    postAuthorId: Long,
    timestamp: Long
)

final case class ReplyEvent(
    userId: Long,
    username: String,
    replyId: Long,
    postId: Long,
    postAuthorId: Long,
    timestamp: Long
)

final case class MentionEvent(
    postId: Long,
    postAuthorId: Long,
    authorUsername: String,
    mentionedUserId: Long,
    timestamp: Long
)

/** Kafka consumer for notification events */
class NotificationEventConsumer(
    service: NotificationServiceImpl,
    bootstrapServers: String
):
  def start(): Unit =
    // Consumer loop for FollowCreated, PostLiked, PostReplied, UserMentioned topics
    println(s"NotificationEventConsumer listening on ${Topics.FollowCreated}, ${Topics.PostLiked}, etc.")

object NotificationServiceMain extends com.twitter.server.TwitterServer:
  val config = ServiceConfig.load("notification-service")

  def main(): Unit =
    // val postgres = // PostgreSQL connection
    // val repo = PostgresNotificationRepository(postgres)
    // val redis = RedisClient(config.redisHost, config.redisPort)
    // val events = // KafkaEventPublisher(config.kafkaBootstrap)
    // val service = NotificationServiceImpl(repo, redis, events, config)
    // val consumer = NotificationEventConsumer(service, config.kafkaBootstrap)

    // consumer.start()
    println(s"NotificationService starting on thrift:${config.thriftPort}")
