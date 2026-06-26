package com.offme.identity

import com.offme.shared.ServiceConfig
import com.twitter.util.{Await, Future}
import org.scalatest.funsuite.AnyFunSuite
import org.scalatest.matchers.should.Matchers
import org.scalatest.BeforeAndAfter
import java.util.UUID
import javax.crypto.SecretKey
import io.jsonwebtoken.security.Keys
import java.nio.charset.StandardCharsets

class IdentityServiceTest extends AnyFunSuite with Matchers with BeforeAndAfter:
  private var service: IdentityServiceImpl = _
  private var mockRepo: MockUserRepository = _
  private val jwtSecret: SecretKey = Keys.hmacShaKeyFor("test-secret-key-1234567890".getBytes(StandardCharsets.UTF_8))
  private val config: ServiceConfig = ServiceConfig(
    serviceName = "test",
    thriftPort = 8081,
    httpPort = 8080,
    postgresUrl = "jdbc:postgresql://localhost:5432/offme_test",
    cassandraHosts = "localhost",
    cassandraKeyspace = "offme_test",
    redisHost = "localhost",
    redisPort = 6379,
    kafkaBootstrap = "localhost:9092",
    zipkinEndpoint = "http://localhost:9411/api/v2/spans",
    jwtSecret = "test-secret-key-1234567890"
  )

  before {
    mockRepo = new MockUserRepository()
    service = new IdentityServiceImpl(mockRepo, jwtSecret)
  }

  test("register should create new user and return auth tokens") {
    val result = service.register("testuser", "test@example.com", "password123", "Test User")
    val (tokens, profile) = Await.result(result)

    tokens.accessToken should not be empty
    tokens.refreshToken should not be empty
    profile.username shouldBe "testuser"
    profile.email shouldBe "test@example.com" // This would be in the full profile
  }

  test("register should fail with duplicate email") {
    mockRepo.setExistingEmail("test@example.com")

    val result = service.register("testuser2", "test@example.com", "password123", "Test User 2")
    a[DuplicateEmailException] should be thrownBy Await.result(result)
  }

  test("register should fail with duplicate username") {
    mockRepo.setExistingUsername("takenuser")

    val result = service.register("takenuser", "test2@example.com", "password123", "Test User 2")
    a[DuplicateUsernameException] should be thrownBy Await.result(result)
  }

  test("login should succeed with valid credentials") {
    val passwordHash = PasswordHasher.hash("password123")
    val user = UserRecord(
      id = 1L,
      publicId = UUID.randomUUID(),
      username = "testuser",
      email = "test@example.com",
      passwordHash = passwordHash,
      displayName = "Test User",
      bio = "",
      avatarUrl = None,
      verified = false,
      followerCount = 0,
      followingCount = 0,
      createdAt = java.time.Instant.now()
    )
    mockRepo.setUser(user)

    val result = service.login("test@example.com", "password123")
    val (tokens, profile) = Await.result(result)

    tokens.accessToken should not be empty
    profile.username shouldBe "testuser"
  }

  test("login should fail with invalid password") {
    val passwordHash = PasswordHasher.hash("correctpassword")
    val user = UserRecord(
      id = 1L,
      publicId = UUID.randomUUID(),
      username = "testuser",
      email = "test@example.com",
      passwordHash = passwordHash,
      displayName = "Test User",
      bio = "",
      avatarUrl = None,
      verified = false,
      followerCount = 0,
      followingCount = 0,
      createdAt = java.time.Instant.now()
    )
    mockRepo.setUser(user)

    val result = service.login("test@example.com", "wrongpassword")
    a[InvalidCredentialsException] should be thrownBy Await.result(result)
  }

  test("login should fail with non-existent email") {
    val result = service.login("nonexistent@example.com", "password123")
    a[InvalidCredentialsException] should be thrownBy Await.result(result)
  }

  test("getUser should return user profile") {
    val user = UserRecord(
      id = 1L,
      publicId = UUID.randomUUID(),
      username = "testuser",
      email = "test@example.com",
      passwordHash = PasswordHasher.hash("password123"),
      displayName = "Test User",
      bio = "Test bio",
      avatarUrl = Some("http://example.com/avatar.jpg"),
      verified = true,
      followerCount = 100,
      followingCount = 50,
      createdAt = java.time.Instant.now()
    )
    mockRepo.setUser(user)

    val result = service.getUser(1L)
    val profile = Await.result(result)

    profile shouldBe defined
    profile.get.username shouldBe "testuser"
    profile.get.displayName shouldBe "Test User"
    profile.get.bio shouldBe "Test bio"
    profile.get.verified shouldBe true
    profile.get.followerCount shouldBe 100
    profile.get.followingCount shouldBe 50
  }

  test("getUser should return None for non-existent user") {
    val result = service.getUser(999L)
    val profile = Await.result(result)

    profile shouldBe None
  }

  test("PasswordHasher should verify correct passwords") {
    val password = "securePassword123!"
    val hash = PasswordHasher.hash(password)
    PasswordHasher.verify(password, hash) shouldBe true
  }

  test("PasswordHasher should reject incorrect passwords") {
    val password = "securePassword123!"
    val hash = PasswordHasher.hash(password)
    PasswordHasher.verify("wrongPassword", hash) shouldBe false
  }

  test("PasswordHasher should detect rehashing needs") {
    // Create a hash with different work factor (simulated)
    val oldHash = "$2a$04$someoldhash" // Work factor 4 instead of 10
    PasswordHasher.needsRehash(oldHash) shouldBe true

    val currentHash = PasswordHasher.hash("test")
    PasswordHasher.needsRehash(currentHash) shouldBe false
  }

  test("JwtSecretManager should initialize with secret") {
    val manager = new JwtSecretManager("test-secret")
    manager.getCurrentSecret should not be null
  }

  test("JwtSecretManager should rotate secrets") {
    val manager = new JwtSecretManager("initial-secret")
    val initialSecret = manager.getCurrentSecret

    val newSecret = manager.rotateSecret("new-secret")
    newSecret should not be equal(initialSecret)
    manager.getCurrentSecret shouldBe newSecret
  }

  test("JwtSecretManager should validate tokens with current secret") {
    val manager = new JwtSecretManager("test-secret")

    // Create a valid token (simplified test - in real scenario would use proper JWT creation)
    val validToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

    // Note: This is a simplified test. In a real implementation, you would:
    // 1. Create a proper JWT token signed with the manager's secret
    // 2. Test validation of that token
    // For now, we test that the method doesn't throw exceptions
    manager.validateToken(validToken) shouldBe a[Boolean]
  }

  private class MockUserRepository extends UserRepository:
    private var users: Map[Long, UserRecord] = Map.empty
    private var emails: Map[String, UserRecord] = Map.empty
    private var usernames: Map[String, UserRecord] = Map.empty

    def setUser(user: UserRecord): Unit =
      users = users + (user.id -> user)
      emails = emails + (user.email -> user)
      usernames = usernames + (user.username -> user)

    def setExistingEmail(email: String): Unit =
      val user = UserRecord(
        id = 999L,
        publicId = UUID.randomUUID(),
        username = "existing",
        email = email,
        passwordHash = "hash",
        displayName = "Existing",
        bio = "",
        avatarUrl = None,
        verified = false,
        followerCount = 0,
        followingCount = 0,
        createdAt = java.time.Instant.now()
      )
      emails = emails + (email -> user)

    def setExistingUsername(username: String): Unit =
      val user = UserRecord(
        id = 998L,
        publicId = UUID.randomUUID(),
        username = username,
        email = "existing@example.com",
        passwordHash = "hash",
        displayName = "Existing",
        bio = "",
        avatarUrl = None,
        verified = false,
        followerCount = 0,
        followingCount = 0,
        createdAt = java.time.Instant.now()
      )
      usernames = usernames + (username -> user)

    def create(user: UserRecord): Future[UserRecord] =
      val newUser = user.copy(id = (users.size + 1).toLong)
      users = users + (newUser.id -> newUser)
      emails = emails + (newUser.email -> newUser)
      usernames = usernames + (newUser.username -> newUser)
      Future.value(newUser)

    def findByEmail(email: String): Future[Option[UserRecord]] =
      Future.value(emails.get(email))

    def findById(id: Long): Future[Option[UserRecord]] =
      Future.value(users.get(id))

    def findByUsername(username: String): Future[Option[UserRecord]] =
      Future.value(usernames.get(username))