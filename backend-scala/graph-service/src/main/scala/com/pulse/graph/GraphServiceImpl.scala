package com.pulse.graph

import com.pulse.shared.ServiceConfig
import com.pulse.shared.kafka.{EventPublisher, Topics}
import com.twitter.util.Future

/** GraphService — social graph operations backed by Neo4j with PostgreSQL denormalized counters.
  *
  * Neo4j stores: (User)-[:FOLLOWS]->(User), (User)-[:BLOCKS]->(User), (User)-[:MUTES]->(User)
  * PostgreSQL mirrors follows table for fast follower_count queries.
  */
trait GraphStore:
  def follow(followerId: Long, followeeId: Long): Future[Unit]
  def unfollow(followerId: Long, followeeId: Long): Future[Unit]
  def getFollowers(userId: Long, cursor: Long, limit: Int): Future[FollowersPage]
  def getFollowing(userId: Long, cursor: Long, limit: Int): Future[Seq[Long]]
  def isFollowing(followerId: Long, followeeId: Long): Future[Boolean]
  def getFollowerCount(userId: Long): Future[Int]

final case class FollowersPage(ids: Seq[Long], nextCursor: Option[Long])

class GraphServiceImpl(store: GraphStore, events: EventPublisher):
  def follow(followerId: Long, followeeId: Long): Future[Unit] =
    if followerId == followeeId then
      Future.exception(new IllegalArgumentException("Cannot follow yourself"))
    else
      store.follow(followerId, followeeId).flatMap: _ =>
        events.publish(Topics.FollowCreated, followerId.toString, FollowEvent(followerId, followeeId))

  def unfollow(followerId: Long, followeeId: Long): Future[Unit] =
    store.unfollow(followerId, followeeId).flatMap: _ =>
      events.publish(Topics.FollowDeleted, followerId.toString, FollowEvent(followerId, followeeId))

  def getFollowers(userId: Long, cursor: Long, limit: Int): Future[FollowersPage] =
    store.getFollowers(userId, cursor, limit)

  def getFollowing(userId: Long, cursor: Long, limit: Int): Future[Seq[Long]] =
    store.getFollowing(userId, cursor, limit)

  def isFollowing(followerId: Long, followeeId: Long): Future[Boolean] =
    store.isFollowing(followerId, followeeId)

  def getFollowerCount(userId: Long): Future[Int] =
    store.getFollowerCount(userId)

final case class FollowEvent(followerId: Long, followeeId: Long, timestamp: Long = System.currentTimeMillis())

/** Neo4j Cypher queries used by production GraphStore implementation */
object Neo4jQueries:
  val Follow = "MATCH (a:User {id: $followerId}), (b:User {id: $followeeId}) MERGE (a)-[:FOLLOWS {createdAt: timestamp()}]->(b)"
  val Unfollow = "MATCH (a:User {id: $followerId})-[r:FOLLOWS]->(b:User {id: $followeeId}) DELETE r"
  val GetFollowers =
    """MATCH (f:User)-[:FOLLOWS]->(u:User {id: $userId})
       | WHERE f.id > $cursor
       | RETURN f.id ORDER BY f.id LIMIT $limit""".stripMargin
  val GetFollowing =
    """MATCH (u:User {id: $userId})-[:FOLLOWS]->(f:User)
       | WHERE f.id > $cursor
       | RETURN f.id ORDER BY f.id LIMIT $limit""".stripMargin