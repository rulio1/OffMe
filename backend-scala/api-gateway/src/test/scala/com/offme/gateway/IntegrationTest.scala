package com.offme.gateway

import com.twitter.finagle.Http
import com.twitter.util.Await
import org.scalatest.funsuite.AnyFunSuite
import org.scalatest.matchers.should.Matchers
import com.twitter.finagle.http.{Request, Response, Method, Status}
import com.twitter.io.Buf
import java.net.Socket

class IntegrationTest extends AnyFunSuite with Matchers {

  // Test configuration
  val gatewayHost = "localhost"
  val gatewayPort = 8080
  val baseUrl = s"http://$gatewayHost:$gatewayPort"

  // Helper method to make HTTP requests
  def makeRequest(method: Method, path: String, body: String = "", headers: Map[String, String] = Map.empty): Response = {
    val client = Http.newService(s"$gatewayHost:$gatewayPort")
    val request = Request(method, path)
    request.host = baseUrl

    // Add headers
    headers.foreach { case (key, value) =>
      request.headerMap.add(key, value)
    }

    // Add body if present
    if (body.nonEmpty) {
      request.setContentTypeJson()
      request.write(body)
    }

    Await.result(client(request))
  }

  // Helper method to check if service is available
  def isServiceAvailable(host: String, port: Int, timeout: Int = 2000): Boolean = {
    try {
      val socket = new Socket(host, port)
      socket.setSoTimeout(timeout)
      socket.close()
      true
    } catch {
      case _: Exception => false
    }
  }

  test("API Gateway should be running and accessible") {
    assume(isServiceAvailable(gatewayHost, gatewayPort), "API Gateway is not running")

    val response = makeRequest(Method.Get, "/api/v1/health")
    response.status should be (Status.Ok)
  }

  test("User registration flow") {
    assume(isServiceAvailable(gatewayHost, gatewayPort), "API Gateway is not running")

    val registerPayload = """
    {
      "username": "testuser_" + System.currentTimeMillis(),
      "email": "test_" + System.currentTimeMillis() + "@example.com",
      "password": "testpassword123",
      "name": "Test User"
    }
    """

    val response = makeRequest(Method.Post, "/api/v1/auth/register", registerPayload)
    response.status should be (Status.Ok)

    // Verify response contains user data
    val responseBody = response.getContentString()
    responseBody should include ("\"id\"")
    responseBody should include ("\"username\"")
    responseBody should include ("\"token\"")
  }

  test("User login flow") {
    assume(isServiceAvailable(gatewayHost, gatewayPort), "API Gateway is not running")

    // First register a test user
    val registerPayload = """
    {
      "username": "login_test_user_" + System.currentTimeMillis(),
      "email": "login_test_" + System.currentTimeMillis() + "@example.com",
      "password": "testpassword123",
      "name": "Login Test User"
    }
    """

    val registerResponse = makeRequest(Method.Post, "/api/v1/auth/register", registerPayload)
    registerResponse.status should be (Status.Ok)

    // Now try to login
    val loginPayload = """
    {
      "username": "login_test_user_" + System.currentTimeMillis(),
      "password": "testpassword123"
    }
    """

    val loginResponse = makeRequest(Method.Post, "/api/v1/auth/login", loginPayload)
    loginResponse.status should be (Status.Ok)

    // Verify response contains auth token
    val responseBody = loginResponse.getContentString()
    responseBody should include ("\"token\"")
    responseBody should include ("\"user\"")
  }

  test("Post creation and timeline retrieval flow") {
    assume(isServiceAvailable(gatewayHost, gatewayPort), "API Gateway is not running")

    // First register and login a test user
    val registerPayload = """
    {
      "username": "post_test_user_" + System.currentTimeMillis(),
      "email": "post_test_" + System.currentTimeMillis() + "@example.com",
      "password": "testpassword123",
      "name": "Post Test User"
    }
    """

    val registerResponse = makeRequest(Method.Post, "/api/v1/auth/register", registerPayload)
    registerResponse.status should be (Status.Ok)
    val registerBody = registerResponse.getContentString()

    // Extract token from registration response
    val token = extractTokenFromResponse(registerBody)

    // Create a post
    val postPayload = """
    {
      "content": "This is a test post created at " + System.currentTimeMillis(),
      "visibility": "public"
    }
    """

    val postResponse = makeRequest(Method.Post, "/api/v1/posts", postPayload, Map("Authorization" -> s"Bearer $token"))
    postResponse.status should be (Status.Ok)

    // Verify post was created
    val postBody = postResponse.getContentString()
    postBody should include ("\"id\"")
    postBody should include ("\"content\"")

    // Get user timeline
    val timelineResponse = makeRequest(Method.Get, "/api/v1/timeline/home", "", Map("Authorization" -> s"Bearer $token"))
    timelineResponse.status should be (Status.Ok)

    // Verify timeline contains our post
    val timelineBody = timelineResponse.getContentString()
    timelineBody should include ("\"posts\"")
  }

  test("Service-to-service communication: Timeline fanout") {
    assume(isServiceAvailable(gatewayHost, gatewayPort), "API Gateway is not running")

    // This test verifies that when a user creates a post, it properly fans out to followers' timelines
    // We'll create two users, have one follow the other, then verify the post appears in the follower's timeline

    // Create user 1
    val user1Payload = """
    {
      "username": "fanout_user1_" + System.currentTimeMillis(),
      "email": "fanout1_" + System.currentTimeMillis() + "@example.com",
      "password": "testpassword123",
      "name": "Fanout User 1"
    }
    """

    val user1Response = makeRequest(Method.Post, "/api/v1/auth/register", user1Payload)
    user1Response.status should be (Status.Ok)
    val user1Body = user1Response.getContentString()
    val user1Token = extractTokenFromResponse(user1Body)
    val user1Id = extractUserIdFromResponse(user1Body)

    // Create user 2
    val user2Payload = """
    {
      "username": "fanout_user2_" + System.currentTimeMillis(),
      "email": "fanout2_" + System.currentTimeMillis() + "@example.com",
      "password": "testpassword123",
      "name": "Fanout User 2"
    }
    """

    val user2Response = makeRequest(Method.Post, "/api/v1/auth/register", user2Payload)
    user2Response.status should be (Status.Ok)
    val user2Body = user2Response.getContentString()
    val user2Token = extractTokenFromResponse(user2Body)

    // User 2 follows user 1
    val followResponse = makeRequest(Method.Post, s"/api/v1/graph/follow/$user1Id", "", Map("Authorization" -> s"Bearer $user2Token"))
    followResponse.status should be (Status.Ok)

    // User 1 creates a post
    val postPayload = """
    {
      "content": "Fanout test post created at " + System.currentTimeMillis(),
      "visibility": "public"
    }
    """

    val postResponse = makeRequest(Method.Post, "/api/v1/posts", postPayload, Map("Authorization" -> s"Bearer $user1Token"))
    postResponse.status should be (Status.Ok)
    val postBody = postResponse.getContentString()
    val postId = extractPostIdFromResponse(postBody)

    // Wait a moment for fanout to complete
    Thread.sleep(2000)

    // Check user 2's timeline for the post
    val timelineResponse = makeRequest(Method.Get, "/api/v1/timeline/home", "", Map("Authorization" -> s"Bearer $user2Token"))
    timelineResponse.status should be (Status.Ok)
    val timelineBody = timelineResponse.getContentString()

    // Verify the post appears in user 2's timeline
    timelineBody should include (postId)
    timelineBody should include ("Fanout test post")
  }

  // Helper methods to extract data from responses
  private def extractTokenFromResponse(response: String): String = {
    val tokenPattern = "\"token\":\"([^\"]+)\"".r
    tokenPattern.findFirstMatchIn(response).map(_.group(1)).orNull
  }

  private def extractUserIdFromResponse(response: String): String = {
    val idPattern = "\"id\":(\\d+)".r
    idPattern.findFirstMatchIn(response).map(_.group(1)).orNull
  }

  private def extractPostIdFromResponse(response: String): String = {
    val idPattern = "\"id\":(\\d+)".r
    idPattern.findFirstMatchIn(response).map(_.group(1)).orNull
  }
}