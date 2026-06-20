package com.pulse.post

import com.pulse.shared.kafka.{EventPublisher, KafkaEventPublisher, PostCreatedEvent, Topics}
import com.pulse.shared.cassandra.CassandraSession
import com.pulse.shared.ServiceConfig
import com.twitter.util.Future
import java.time.Instant
import java.util.concurrent.atomic.AtomicLong

/** PostService — authoritative write path for all posts.
  *
  * Write path:
  *   1. Validate (280 char limit, visibility rules)
  *   2. Idempotency check via Redis (not shown — wired in prod)
  *   3. Snowflake ID generation
  *   4. Cassandra write (posts + user_timeline)
  *   5. Kafka PostCreated event (async fanout, search index, notifications)
  */
class PostServiceImpl(
    repo: PostRepository,
    events: EventPublisher,
    graphClient: GraphClient,
    idGenerator: IdGenerator
):
  private val MaxTextLength = 280

  def createPost(input: CreatePostInput): Future[Post] =
    validate(input).flatMap: _ =>
      val postId = idGenerator.nextId()
      val now = Instant.now()
      val conversationId = input.replyToId.getOrElse(postId)

      val post = Post(
        id = postId,
        authorId = input.authorId,
        text = input.text,
        postType = input.postType,
        visibility = input.visibility,
        replyToId = input.replyToId,
        quoteOfId = input.quoteOfId,
        conversationId = conversationId,
        createdAt = now,
        likeCount = 0,
        repostCount = 0,
        replyCount = 0
      )

      for
        _ <- repo.insert(post)
        _ <- repo.insertUserTimeline(input.authorId, postId, now)
        followerCount <- graphClient.getFollowerCount(input.authorId)
        _ <- events.publish(
          Topics.PostCreated,
          input.authorId.toString,
          PostCreatedEvent(
            postId = postId,
            authorId = input.authorId,
            text = input.text,
            postType = input.postType,
            visibility = input.visibility,
            replyToId = input.replyToId,
            quoteOfId = input.quoteOfId,
            followerCount = followerCount,
            createdAt = now.toEpochMilli,
            idempotencyKey = input.idempotencyKey
          )
        )
      yield post

  def getPost(postId: Long): Future[Option[Post]] =
    repo.findById(postId)

  def getPosts(postIds: Seq[Long]): Future[Seq[Post]] =
    repo.findByIds(postIds)

  def deletePost(authorId: Long, postId: Long): Future[Unit] =
    repo.findById(postId).flatMap:
      case Some(post) if post.authorId == authorId =>
        repo.softDelete(postId)
      case Some(_) =>
        Future.exception(UnauthorizedException("Not post author"))
      case None =>
        Future.exception(PostNotFoundException(postId))

  private def validate(input: CreatePostInput): Future[Unit] =
    if input.text.isEmpty || input.text.length > MaxTextLength then
      Future.exception(InvalidPostException(s"Text must be 1-$MaxTextLength characters"))
    else
      Future.Unit

trait GraphClient:
  def getFollowerCount(userId: Long): Future[Int]

trait IdGenerator:
  def nextId(): Long

/** Snowflake-style ID: timestamp(42) | machine(10) | sequence(12) */
final class SnowflakeIdGenerator(machineId: Int, sequence: AtomicLong = AtomicLong(0)) extends IdGenerator:
  private val Epoch = 1704067200000L // 2024-01-01

  def nextId(): Long =
    val ts = System.currentTimeMillis() - Epoch
    val seq = sequence.incrementAndGet() & 0xFFF
    (ts << 22) | (machineId.toLong << 12) | seq

final case class PostNotFoundException(postId: Long) extends Exception(s"Post $postId not found")
final case class InvalidPostException(reason: String) extends Exception(reason)
final case class UnauthorizedException(reason: String) extends Exception(reason)

object PostServiceMain extends com.twitter.server.TwitterServer:
  val config = ServiceConfig.load("post-service")

  def main(): Unit =
    val cassandra = CassandraSession(config.cassandraHosts, config.cassandraKeyspace)
    val repo = CassandraPostRepository(cassandra)
    val events = KafkaEventPublisher(config.kafkaBootstrap)
    val graphClient = StubGraphClient()
    val idGen = SnowflakeIdGenerator(machineId = 1)
    val service = PostServiceImpl(repo, events, graphClient, idGen)

    println(s"PostService starting on thrift:${config.thriftPort} http:${config.httpPort}")
    // Finatra Thrift server wiring happens here in production

final class StubGraphClient extends GraphClient:
  def getFollowerCount(userId: Long): Future[Int] = Future.value(100)