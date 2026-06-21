package com.offme.post

import com.datastax.oss.driver.api.core.cql.Row
import com.offme.shared.cassandra.CassandraClient
import com.twitter.util.Future
import java.time.Instant

trait PostRepository:
  def insert(post: Post): Future[Unit]
  def findById(postId: Long): Future[Option[Post]]
  def findByIds(postIds: Seq[Long]): Future[Seq[Post]]
  def softDelete(postId: Long): Future[Unit]
  def insertUserTimeline(authorId: Long, postId: Long, createdAt: Instant): Future[Unit]

final class CassandraPostRepository(cassandra: CassandraClient) extends PostRepository:
  private val insertPostCql =
    """INSERT INTO posts (post_id, author_id, text, post_type, visibility,
       | reply_to_id, quote_of_id, conversation_id, created_at, deleted)
       | VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, false)""".stripMargin

  private val selectPostCql =
    "SELECT * FROM posts WHERE post_id = ?"

  private val deletePostCql =
    "UPDATE posts SET deleted = true, updated_at = ? WHERE post_id = ?"

  private val insertUserTimelineCql =
    """INSERT INTO user_timeline (user_id, created_at, post_id, source)
       | VALUES (?, ?, ?, 'original')""".stripMargin

  def insert(post: Post): Future[Unit] =
    cassandra.execute(
      insertPostCql,
      Long.box(post.id),
      Long.box(post.authorId),
      post.text,
      post.postType,
      post.visibility,
      post.replyToId.map(Long.box).orNull,
      post.quoteOfId.map(Long.box).orNull,
      Long.box(post.conversationId),
      post.createdAt
    )

  def findById(postId: Long): Future[Option[Post]] =
    cassandra.query(selectPostCql, Long.box(postId)).map(_.headOption.map(rowToPost))

  def findByIds(postIds: Seq[Long]): Future[Seq[Post]] =
    Future.collect(postIds.map(findById)).map(_.flatten)

  def softDelete(postId: Long): Future[Unit] =
    cassandra.execute(deletePostCql, Instant.now(), Long.box(postId))

  def insertUserTimeline(authorId: Long, postId: Long, createdAt: Instant): Future[Unit] =
    cassandra.execute(
      insertUserTimelineCql,
      Long.box(authorId),
      createdAt,
      Long.box(postId)
    )

  private def rowToPost(row: Row): Post =
    Post(
      id = row.getLong("post_id"),
      authorId = row.getLong("author_id"),
      text = row.getString("text"),
      postType = row.getString("post_type"),
      visibility = row.getString("visibility"),
      replyToId = Option(row.getLong("reply_to_id")).filter(_ != 0),
      quoteOfId = Option(row.getLong("quote_of_id")).filter(_ != 0),
      conversationId = row.getLong("conversation_id"),
      createdAt = row.getInstant("created_at"),
      likeCount = 0,
      repostCount = 0,
      replyCount = 0
    )

final case class Post(
    id: Long,
    authorId: Long,
    text: String,
    postType: String,
    visibility: String,
    replyToId: Option[Long],
    quoteOfId: Option[Long],
    conversationId: Long,
    createdAt: Instant,
    likeCount: Int,
    repostCount: Int,
    replyCount: Int
)

final case class CreatePostInput(
    authorId: Long,
    text: String,
    postType: String = "text",
    visibility: String = "public",
    replyToId: Option[Long] = None,
    quoteOfId: Option[Long] = None,
    mediaIds: Seq[String] = Nil,
    idempotencyKey: Option[String] = None
)