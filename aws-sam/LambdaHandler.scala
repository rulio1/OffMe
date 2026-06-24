package com.offme.lambda

import com.amazonaws.services.lambda.runtime.{Context, RequestHandler}
import com.amazonaws.services.lambda.runtime.events.{APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent}
import com.offme.{Main => ServiceMain}
import org.slf4j.{Logger, LoggerFactory}
import scala.jdk.CollectionConverters._

/**
 * AWS Lambda Handler for OffMe services
 * This handler adapts the existing HTTP service to work with AWS Lambda
 */
class LambdaHandler extends RequestHandler[APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent] {

  private val logger: Logger = LoggerFactory.getLogger(classOf[LambdaHandler])
  private var serviceMain: Option[ServiceMain] = None

  override def handleRequest(request: APIGatewayProxyRequestEvent, context: Context): APIGatewayProxyResponseEvent = {
    try {
      // Initialize service on first request (reuse for subsequent requests)
      if (serviceMain.isEmpty) {
        logger.info("Initializing service...")
        serviceMain = Some(new ServiceMain())
        serviceMain.foreach(_.start())
        logger.info("Service initialized successfully")
      }

      // Convert Lambda request to HTTP request
      val httpRequest = convertToHttpRequest(request)

      // Process request through the service
      val httpResponse = serviceMain.flatMap(_.handleRequest(httpRequest)).getOrElse {
        createResponse(500, """{"error": "Service not initialized"}""")
      }

      // Convert HTTP response to Lambda response
      convertToLambdaResponse(httpResponse)

    } catch {
      case e: Exception =>
        logger.error("Error processing request", e)
        createLambdaResponse(500, s"""{"error": "${e.getMessage}"}""")
    }
  }

  private def convertToHttpRequest(lambdaRequest: APIGatewayProxyRequestEvent): HttpRequest = {
    val headers = lambdaRequest.getHeaders.asScala.toMap
    val params = lambdaRequest.getQueryStringParameters.asScala.toMap ++
                 lambdaRequest.getPathParameters.asScala.toMap

    HttpRequest(
      method = lambdaRequest.getHttpMethod,
      path = lambdaRequest.getPath,
      headers = headers,
      queryParams = params,
      body = Option(lambdaRequest.getBody).getOrElse(""),
      remoteAddress = lambdaRequest.getRequestContext.getIdentity.getSourceIp
    )
  }

  private def convertToLambdaResponse(httpResponse: HttpResponse): APIGatewayProxyResponseEvent = {
    val response = new APIGatewayProxyResponseEvent()
    response.setStatusCode(httpResponse.status)
    response.setHeaders(httpResponse.headers.asJava)
    response.setBody(httpResponse.body)
    response.setIsBase64Encoded(false)
    response
  }

  private def createLambdaResponse(statusCode: Int, body: String): APIGatewayProxyResponseEvent = {
    val response = new APIGatewayProxyResponseEvent()
    response.setStatusCode(statusCode)
    response.setHeaders(Map(
      "Content-Type" -> "application/json",
      "Access-Control-Allow-Origin" -> "*",
      "Access-Control-Allow-Methods" -> "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers" -> "Content-Type,Authorization"
    ).asJava)
    response.setBody(body)
    response.setIsBase64Encoded(false)
    response
  }
}

/**
 * WebSocket Lambda Handler
 */
class WebSocketLambdaHandler extends RequestHandler[com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketEvent, Object] {

  private val logger: Logger = LoggerFactory.getLogger(classOf[WebSocketLambdaHandler])

  override def handleRequest(request: com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketEvent, context: Context): Object = {
    request.getRequestContext.getRouteKey match {
      case "$connect" => handleConnect(request)
      case "$disconnect" => handleDisconnect(request)
      case _ => handleMessage(request)
    }
  }

  private def handleConnect(request: com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketEvent): Object = {
    logger.info(s"WebSocket connected: ${request.getRequestContext.getConnectionId}")
    // Add connection to connection pool
    WebSocketConnectionPool.addConnection(request.getRequestContext.getConnectionId)
    Map("statusCode" -> 200).asJava
  }

  private def handleDisconnect(request: com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketEvent): Object = {
    logger.info(s"WebSocket disconnected: ${request.getRequestContext.getConnectionId}")
    // Remove connection from pool
    WebSocketConnectionPool.removeConnection(request.getRequestContext.getConnectionId)
    Map("statusCode" -> 200).asJava
  }

  private def handleMessage(request: com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketEvent): Object = {
    try {
      val connectionId = request.getRequestContext.getConnectionId
      val message = request.getBody

      logger.info(s"WebSocket message from $connectionId: $message")

      // Process message through WebSocket service
      val response = WebSocketService.handleMessage(connectionId, message)

      // Send response back to client
      sendWebSocketMessage(connectionId, response)

      Map("statusCode" -> 200).asJava
    } catch {
      case e: Exception =>
        logger.error("Error handling WebSocket message", e)
        Map("statusCode" -> 500, "body" -> e.getMessage).asJava
    }
  }

  private def sendWebSocketMessage(connectionId: String, message: String): Unit = {
    // Implementation would use AWS ApiGatewayManagementApi
    // This is a placeholder for the actual implementation
    logger.info(s"Sending WebSocket message to $connectionId: $message")
  }
}

/**
 * Simple HTTP request/response classes to adapt between Lambda and service
 */
case class HttpRequest(
  method: String,
  path: String,
  headers: Map[String, String],
  queryParams: Map[String, String],
  body: String,
  remoteAddress: String
)

case class HttpResponse(
  status: Int,
  headers: Map[String, String],
  body: String
)

/**
 * WebSocket connection pool (simplified)
 */
object WebSocketConnectionPool {
  private val connections = collection.mutable.Set[String]()

  def addConnection(connectionId: String): Unit = {
    connections += connectionId
  }

  def removeConnection(connectionId: String): Unit = {
    connections -= connectionId
  }

  def getConnections: Set[String] = connections.toSet

  def broadcast(message: String): Unit = {
    // Would implement actual broadcast using AWS API
    connections.foreach { connId =>
      println(s"Broadcasting to $connId: $message")
    }
  }
}

/**
 * WebSocket service adapter
 */
object WebSocketService {
  def handleMessage(connectionId: String, message: String): String = {
    // Parse and process WebSocket message
    // This would integrate with your existing WebSocket service logic
    s"""{"type": "response", "connectionId": "$connectionId", "message": "$message"}"""
  }
}