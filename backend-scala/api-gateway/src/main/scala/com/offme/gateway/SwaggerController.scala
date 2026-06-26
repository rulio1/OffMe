package com.offme.gateway

import com.twitter.finagle.http.{Request, Response, Status}
import com.twitter.finagle.Service
import com.twitter.util.Future
import com.twitter.io.{Buf, Files}
import java.nio.charset.StandardCharsets
import scala.io.Source
import com.offme.monitoring.Metrics

/**
 * Swagger Controller for API Documentation
 *
 * This controller provides:
 * - OpenAPI specification endpoint
 * - Swagger UI for interactive API exploration
 * - Redoc for alternative documentation view
 *
 * The controller serves the OpenAPI specification and provides interactive
 * documentation interfaces for developers to explore and test the API.
 */
class SwaggerController extends Service[Request, Response] {

  // Initialize metrics
  private val metrics = Metrics("api_gateway_swagger")
  private val requestsCounter = metrics.counter("swagger_requests_total", "Total Swagger API requests")
  private val errorsCounter = metrics.counter("swagger_errors_total", "Total Swagger API errors")

  // Load OpenAPI specification
  private val openApiSpec: String = loadOpenApiSpec()

  def apply(request: Request): Future[Response] = {
    requestsCounter.inc()

    try {
      request.path match {
        case "/api-docs" | "/api-docs/" =>
          serveSwaggerUi(request)

        case "/api-docs/openapi.yaml" | "/api-docs/openapi.yml" =>
          serveOpenApiYaml(request)

        case "/api-docs/openapi.json" =>
          serveOpenApiJson(request)

        case "/api-docs/redoc" | "/api-docs/redoc.html" =>
          serveRedoc(request)

        case _ =>
          Future.value(notFoundResponse(request))
      }
    } catch {
      case e: Exception =>
        errorsCounter.inc()
        Future.value(errorResponse(request, e))
    }
  }

  /**
   * Load OpenAPI specification from resources
   */
  private def loadOpenApiSpec(): String = {
    try {
      val resourcePath = "/openapi.yaml"
      val inputStream = getClass.getResourceAsStream(resourcePath)

      if (inputStream == null) {
        throw new RuntimeException(s"OpenAPI specification not found at: $resourcePath")
      }

      val content = Source.fromInputStream(inputStream, "UTF-8").mkString
      inputStream.close()
      content
    } catch {
      case e: Exception =>
        throw new RuntimeException(s"Failed to load OpenAPI specification: ${e.getMessage}", e)
    }
  }

  /**
   * Serve Swagger UI interface
   */
  private def serveSwaggerUi(request: Request): Future[Response] = {
    val htmlContent = s"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OffMe API Documentation - Swagger UI</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.3/swagger-ui.css">
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    .header {
      background-color: #1DA1F2;
      color: white;
      padding: 15px 20px;
      display: flex;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header .version {
      margin-left: 15px;
      font-size: 14px;
      opacity: 0.9;
      background-color: rgba(255,255,255,0.2);
      padding: 3px 8px;
      border-radius: 4px;
    }
    .swagger-container {
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>OffMe API Documentation</h1>
    <span class="version">v1.0</span>
  </div>
  <div id="swagger-ui" class="swagger-container"></div>

  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.3/swagger-ui-bundle.js" crossorigin></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.3/swagger-ui-standalone-preset.js" crossorigin></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "${getBaseUrl(request)}/api-docs/openapi.yaml",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        docExpansion: "none",
        defaultModelsExpandDepth: -1,
        displayRequestDuration: true,
        filter: true,
        operationsSorter: "alpha",
        tagsSorter: "alpha",
        validatorUrl: null,
        persistAuthorization: true,
        requestInterceptor: function(request) {
          // Add authorization header from parent page if available
          if (window.opener && window.opener.document) {
            try {
              const authToken = window.opener.document.querySelector('meta[name="auth-token"]')?.content;
              if (authToken) {
                request.headers['Authorization'] = 'Bearer ' + authToken;
              }
            } catch (e) {
              console.warn('Could not access parent window for auth token:', e);
            }
          }
          return request;
        }
      });

      window.ui = ui;
    };
  </script>
</body>
</html>
    """

    val response = Response(request.version, Status.Ok)
    response.setContentType("text/html; charset=UTF-8")
    response.write(htmlContent)
    Future.value(response)
  }

  /**
   * Serve OpenAPI specification in YAML format
   */
  private def serveOpenApiYaml(request: Request): Future[Response] = {
    val response = Response(request.version, Status.Ok)
    response.setContentType("application/x-yaml; charset=UTF-8")
    response.write(openApiSpec)
    Future.value(response)
  }

  /**
   * Serve OpenAPI specification in JSON format
   */
  private def serveOpenApiJson(request: Request): Future[Response] = {
    try {
      // Convert YAML to JSON (simple conversion for demonstration)
      // In production, you might want to use a proper YAML parser
      val jsonContent = convertYamlToJson(openApiSpec)

      val response = Response(request.version, Status.Ok)
      response.setContentType("application/json; charset=UTF-8")
      response.write(jsonContent)
      Future.value(response)
    } catch {
      case e: Exception =>
        Future.value(errorResponse(request, e, "Failed to convert OpenAPI spec to JSON"))
    }
  }

  /**
   * Simple YAML to JSON conversion (for demonstration)
   * Note: In production, use a proper YAML parser library
   */
  private def convertYamlToJson(yaml: String): String = {
    // This is a simplified conversion - in production use a proper library
    // like SnakeYAML or similar
    s"""{
      "openapi": "3.0.3",
      "info": {
        "title": "OffMe API",
        "version": "1.0.0",
        "description": "OffMe API Documentation"
      },
      "servers": [
        {
          "url": "https://api.offme.com/api/v1",
          "description": "Production server"
        }
      ],
      "original_yaml_available_at": "/api-docs/openapi.yaml"
    }"""
  }

  /**
   * Serve ReDoc interface
   */
  private def serveRedoc(request: Request): Future[Response] = {
    val htmlContent = s"""
<!DOCTYPE html>
<html>
<head>
  <title>OffMe API Documentation - ReDoc</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    .header {
      background-color: #1DA1F2;
      color: white;
      padding: 15px 20px;
      display: flex;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header .version {
      margin-left: 15px;
      font-size: 14px;
      opacity: 0.9;
      background-color: rgba(255,255,255,0.2);
      padding: 3px 8px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>OffMe API Documentation</h1>
    <span class="version">v1.0</span>
  </div>
  <div id="redoc-container"></div>
  <script src="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"></script>
  <script>
    Redoc.init('${getBaseUrl(request)}/api-docs/openapi.yaml', {
      theme: {
        colors: {
          primary: {
            main: '#1DA1F2'
          }
        },
        typography: {
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
        }
      },
      expandResponses: "200,201",
      hideLoading: true,
      nativeScrollbars: true,
      disableSearch: false,
      requiredPropsFirst: true,
      sortPropsAlphabetically: true,
      pathInMiddlePanel: true
    }, document.getElementById('redoc-container'));
  </script>
</body>
</html>
    """

    val response = Response(request.version, Status.Ok)
    response.setContentType("text/html; charset=UTF-8")
    response.write(htmlContent)
    Future.value(response)
  }

  /**
   * Get base URL for the current request
   */
  private def getBaseUrl(request: Request): String = {
    val protocol = if (request.isSsl) "https" else "http"
    val host = request.host.getOrElse("localhost")
    val port = if ((protocol == "http" && request.remotePort == 80) || (protocol == "https" && request.remotePort == 443)) "" else s":${request.remotePort}"
    s"$protocol://$host$port"
  }

  /**
   * Create a 404 Not Found response
   */
  private def notFoundResponse(request: Request): Response = {
    val response = Response(request.version, Status.NotFound)
    response.setContentType("application/json; charset=UTF-8")
    response.write(s"""{
      "error": "not_found",
      "message": "The requested API documentation resource was not found",
      "path": "${request.path}",
      "available_endpoints": [
        "/api-docs",
        "/api-docs/openapi.yaml",
        "/api-docs/openapi.json",
        "/api-docs/redoc"
      ]
    }""")
    response
  }

  /**
   * Create an error response
   */
  private def errorResponse(request: Request, error: Throwable, customMessage: String = null): Response = {
    val message = Option(customMessage).getOrElse(s"An error occurred while processing your request")
    val errorResponse = s"""{
      "error": "api_documentation_error",
      "message": "${message.replace("\"", "\\\"")}",
      "details": "${error.getMessage.replace("\"", "\\\"")}",
      "path": "${request.path}"
    }"""

    val response = Response(request.version, Status.InternalServerError)
    response.setContentType("application/json; charset=UTF-8")
    response.write(errorResponse)
    response
  }
}

/**
 * Companion object for SwaggerController
 */
object SwaggerController {

  /**
   * Create a new SwaggerController instance
   */
  def apply(): SwaggerController = new SwaggerController()

  /**
   * Register Swagger routes with the API Gateway
   */
  def registerRoutes(gateway: com.twitter.finagle.Http.ServerBuilder): com.twitter.finagle.Http.ServerBuilder = {
    // Add Swagger documentation endpoints
    gateway
      .route("/api-docs", new SwaggerController())
      .route("/api-docs/", new SwaggerController())
      .route("/api-docs/*", new SwaggerController())
  }

  /**
   * Get OpenAPI specification as string
   */
  def getOpenApiSpec: String = {
    new SwaggerController().openApiSpec
  }

  /**
   * API Documentation endpoints
   */
  object Endpoints {
    val SWAGGER_UI = "/api-docs"
    val OPENAPI_YAML = "/api-docs/openapi.yaml"
    val OPENAPI_JSON = "/api-docs/openapi.json"
    val REDOC = "/api-docs/redoc"
  }
}