package com.offme.identity

import com.offme.shared.ServiceConfig
import com.twitter.util.Future
import com.twitter.finagle.postgres._
import com.twitter.finagle.postgres.client._
import com.twitter.finagle.postgres.values._
import java.time.Instant
import java.util.UUID
import com.twitter.util.Future

class PostgresUserRepository(config: ServiceConfig) extends UserRepository:
  private val client = Client(
    host = config.dbHost,
    port = config.dbPort,
    database = config.dbName,
    user = config.dbUser,
    password = config.dbPassword
  )

  def create(user: UserRecord): Future[UserRecord] =
    val query = """
      INSERT INTO users (
        public_id, username, email, password_hash, display_name, bio, avatar_url, verified,
        follower_count, following_count, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, public_id, username, email, password_hash, display_name, bio, avatar_url,
                verified, follower_count, following_count, created_at
    """

    client.prepareAndQuery(query,
      user.publicId,
      user.username,
      user.email,
      user.passwordHash,
      user.displayName,
      user.bio,
      user.avatarUrl.orNull,
      user.verified,
      user.followerCount,
      user.followingCount,
      user.createdAt,
      user.createdAt
    ).map { result =>
      val row = result.rows.head
      user.copy(
        id = row[Long]("id"),
        publicId = row[UUID]("public_id"),
        createdAt = row[Instant]("created_at")
      )
    }

  def findByEmail(email: String): Future[Option[UserRecord]] =
    val query = "SELECT * FROM users WHERE email = $1 LIMIT 1"
    client.prepareAndQuery(query, email).map { result =>
      if result.rows.isEmpty then None
      else Some(mapRow(result.rows.head))
    }

  def findById(id: Long): Future[Option[UserRecord]] =
    val query = "SELECT * FROM users WHERE id = $1 LIMIT 1"
    client.prepareAndQuery(query, id).map { result =>
      if result.rows.isEmpty then None
      else Some(mapRow(result.rows.head))
    }

  def findByUsername(username: String): Future[Option[UserRecord]] =
    val query = "SELECT * FROM users WHERE username = $1 LIMIT 1"
    client.prepareAndQuery(query, username).map { result =>
      if result.rows.isEmpty then None
      else Some(mapRow(result.rows.head))
    }

  private def mapRow(row: Row): UserRecord =
    UserRecord(
      id = row[Long]("id"),
      publicId = row[UUID]("public_id"),
      username = row[String]("username"),
      email = row[String]("email"),
      passwordHash = row[String]("password_hash"),
      displayName = row[String]("display_name"),
      bio = row[String]("bio"),
      avatarUrl = Option(row[String]("avatar_url")).filter(_.nonEmpty),
      verified = row[Boolean]("verified"),
      followerCount = row[Int]("follower_count"),
      followingCount = row[Int]("following_count"),
      createdAt = row[Instant]("created_at")
    )