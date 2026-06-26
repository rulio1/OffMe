package com.offme.gateway

import com.twitter.finagle.http.{Request, Response, Status}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.util.{Future, Duration, Time}
import com.offme.monitoring.Metrics
import java.util.UUID
import com.twitter.finagle.http.filter.{CommonFilters, LogFormats}
import com.twitter.finagle.tracing.{Trace, TraceId, Annotation, Record}
import com.twitter.finagle.util.DefaultTimer
import com.twitter.io.Buf

/**
 * Monitoring Filter for API Gateway
 *
 * This filter provides comprehensive monitoring for all HTTP requests:
 * - Request counting and latency measurement
 * - Error tracking and classification
 * - Distributed tracing integration
 * - Prometheus metrics exposure
 * - Correlation IDs for request tracking
 *
 * The filter automatically instruments all incoming requests and provides
 * detailed metrics that can be visualized in Grafana dashboards.
 */
class MonitoringFilter extends SimpleFilter[Request, Response] {

  // Initialize metrics for the API Gateway
  private val metrics = Metrics("api_gateway")
  private val timer = DefaultTimer.twitter

  // Standard metric names
  private val requestCounter = metrics.counter(Metrics.StandardMetrics.REQUEST_COUNT, "Total number of HTTP requests")
  private val requestLatency = metrics.histogram(Metrics.StandardMetrics.REQUEST_LATENCY, "HTTP request latency in seconds")
  private val requestErrors = metrics.counter(Metrics.StandardMetrics.REQUEST_ERRORS, "Total number of HTTP request errors")
  private val activeRequests = metrics.gauge(Metrics.StandardMetrics.ACTIVE_CONNECTIONS, "Number of active HTTP requests")

  // Additional detailed metrics
  private val requestsByMethod = metrics.counter("requests_by_method_total", "Total requests by HTTP method")
  private val requestsByPath = metrics.counter("requests_by_path_total", "Total requests by path pattern")
  private val requestsByStatus = metrics.counter("requests_by_status_total", "Total requests by HTTP status code")
  private val requestSizeBytes = metrics.histogram("request_size_bytes", "HTTP request size in bytes")
  private val responseSizeBytes = metrics.histogram("response_size_bytes", "HTTP response size in bytes")

  // Path patterns for grouping (simplified paths)
  private val pathPatterns = Map(
    "/api/v1/auth/" -> "auth",
    "/api/v1/posts" -> "posts",
    "/api/v1/timeline/" -> "timeline",
    "/api/v1/graph/" -> "graph",
    "/api/v1/users/" -> "users",
    "/api/v1/health" -> "health",
    "/api/v1/metrics" -> "metrics"
  )

  def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    val startTime = Time.now
    activeRequests.inc()

    // Generate or propagate trace ID
    val traceId = generateTraceId(request)

    // Add correlation ID header if not present
    val requestWithHeaders = addCorrelationHeaders(request, traceId)

    // Measure request size
    measureRequestSize(requestWithHeaders)

    // Execute the request and measure latency
    service(requestWithHeaders)
      .onSuccess { response =>
        recordSuccessMetrics(requestWithHeaders, response, startTime, traceId)
      }
      .onFailure { cause =>
        recordErrorMetrics(requestWithHeaders, cause, startTime, traceId)
      }
      .ensure {
        activeRequests.dec()
      }
  }

  /**
   * Generate or propagate trace ID for distributed tracing
   */
  private def generateTraceId(request: Request): TraceId = {
    // Try to extract trace ID from headers
    val existingTraceId = Trace.idFromRequest(request)

    if (existingTraceId.isDefined) {
      existingTraceId.get
    } else {
      // Generate new trace ID
      val newTraceId = Trace.nextId
      // Add trace ID to request headers for propagation
      request.headerMap.add("X-Trace-ID", newTraceId.traceId.toString)
      request.headerMap.add("X-Span-ID", newTraceId.spanId.toString)
      request.headerMap.add("X-Parent-Span-ID", newTraceId.parentId.map(_.toString).getOrElse("0"))
      newTraceId
    }
  }

  /**
   * Add correlation headers to request
   */
  private def addCorrelationHeaders(request: Request, traceId: TraceId): Request = {
    // Add correlation ID if not present
    if (!request.headerMap.contains("X-Correlation-ID")) {
      val correlationId = UUID.randomUUID().toString
      request.headerMap.add("X-Correlation-ID", correlationId)
    }

    // Add request ID if not present
    if (!request.headerMap.contains("X-Request-ID")) {
      val requestId = UUID.randomUUID().toString
      request.headerMap.add("X-Request-ID", requestId)
    }

    request
  }

  /**
   * Measure request size and record metrics
   */
  private def measureRequestSize(request: Request): Unit = {
    try {
      val size = request.contentLength.getOrElse(0L)
      requestSizeBytes.observe(size)

      // Also measure by method
      val methodSizeMetric = metrics.histogram(s"request_size_bytes_${request.method.toString.toLowerCase}")
      methodSizeMetric.observe(size)
    } catch {
      case _: Exception =>
        // Ignore errors in size measurement
    }
  }

  /**
   * Record metrics for successful requests
   */
  private def recordSuccessMetrics(request: Request, response: Response, startTime: Time, traceId: TraceId): Unit = {
    val duration = Time.now - startTime
    val path = request.path
    val method = request.method.toString
    val statusCode = response.statusCode

    // Record basic metrics
    requestCounter.inc()
    requestLatency.observe(duration.inSeconds)
    activeRequests.dec()

    // Record by method
    requestsByMethod.labels(method.toLowerCase).inc()

    // Record by path pattern
    val pathGroup = getPathGroup(path)
    requestsByPath.labels(pathGroup).inc()

    // Record by status code family
    val statusFamily = statusCode / 100
    requestsByStatus.labels(statusFamily.toString).inc()
    requestsByStatus.labels(statusCode.toString).inc()

    // Measure response size
    try {
      val size = response.contentLength.getOrElse(0L)
      responseSizeBytes.observe(size)

      // Also measure by status code
      val statusSizeMetric = metrics.histogram(s"response_size_bytes_$statusFamilyxx")
      statusSizeMetric.observe(size)
    } catch {
      case _: Exception =>
        // Ignore errors in size measurement
    }

    // Add timing headers to response
    response.headerMap.add("X-Request-Time", s"${duration.inMilliseconds}ms")
    response.headerMap.add("X-Trace-ID", traceId.traceId.toString)

    // Log the request for debugging
    logRequest(request, response, duration, traceId, success = true)
  }

  /**
   * Record metrics for failed requests
   */
  private def recordErrorMetrics(request: Request, cause: Throwable, startTime: Time, traceId: TraceId): Unit = {
    val duration = Time.now - startTime
    val path = request.path
    val method = request.method.toString

    // Record basic metrics
    requestCounter.inc()
    requestLatency.observe(duration.inSeconds)
    requestErrors.inc()
    activeRequests.dec()

    // Record by method
    requestsByMethod.labels(method.toLowerCase).inc()

    // Record by path pattern
    val pathGroup = getPathGroup(path)
    requestsByPath.labels(pathGroup).inc()

    // Record error by type
    val errorType = cause.getClass.getSimpleName
    metrics.counter(s"request_errors_by_type_total").labels(errorType).inc()

    // Log the error
    logRequest(request, null, duration, traceId, success = false, error = Some(cause))

    // Create error response if not already an error response
    val errorResponse = Response(request.version, Status.InternalServerError)
    errorResponse.setContentTypeJson()
    errorResponse.contentString = s"""{
      "error": "Internal Server Error",
      "message": "${cause.getMessage}",
      "trace_id": "${traceId.traceId}",
      "correlation_id": "${request.headerMap.get("X-Correlation-ID").getOrElse("unknown")}"
    }"""

    Future.value(errorResponse)
  }

  /**
   * Get path group for metrics grouping
   */
  private def getPathGroup(path: String): String = {
    pathPatterns.find { case (pattern, group) => path.startsWith(pattern) }
      .map(_._2)
      .getOrElse("other")
  }

  /**
   * Log request details for debugging and tracing
   */
  private def logRequest(request: Request, response: Response, duration: Duration,
                        traceId: TraceId, success: Boolean, error: Option[Throwable] = None): Unit = {
    val correlationId = request.headerMap.get("X-Correlation-ID").getOrElse("unknown")
    val requestId = request.headerMap.get("X-Request-ID").getOrElse("unknown")

    val logMessage = new StringBuilder
    logMessage ++= s"[${request.method}] ${request.path} "
    logMessage ++= s"trace_id=${traceId.traceId} "
    logMessage ++= s"correlation_id=$correlationId "
    logMessage ++= s"request_id=$requestId "
    logMessage ++= s"duration=${duration.inMilliseconds}ms "

    if (success) {
      logMessage ++= s"status=${response.statusCode} "
      logMessage ++= s"response_size=${response.contentLength.getOrElse(0)}bytes"
    } else {
      logMessage ++= s"error=${error.map(_.getClass.getSimpleName).getOrElse("unknown")} "
      logMessage ++= s"message=${error.map(_.getMessage).getOrElse("")}"
    }

    if (success) {
      println(s"INFO  $logMessage")
    } else {
      System.err.println(s"ERROR $logMessage")
    }
  }

  /**
   * Add Prometheus metrics endpoint to the service
   */
  def withMetricsEndpoint(service: Service[Request, Response]): Service[Request, Response] = {
    new Service[Request, Response] {
      def apply(request: Request): Future[Response] = {
        if (request.path == "/api/v1/metrics") {
          handleMetricsRequest(request)
        } else {
          service(request)
        }
      }
    }
  }

  /**
   * Handle Prometheus metrics request
   */
  private def handleMetricsRequest(request: Request): Future[Response] = {
    try {
      val response = Response(request.version, Status.Ok)
      response.setContentType("text/plain; version=0.0.4; charset=utf-8")
      response.contentString = metrics.getPrometheusMetrics
      Future.value(response)
    } catch {
      case e: Exception =>
        val errorResponse = Response(request.version, Status.InternalServerError)
        errorResponse.setContentTypeJson()
        errorResponse.contentString = s"""{
          "error": "Failed to generate metrics",
          "message": "${e.getMessage}"
        }"""
        Future.value(errorResponse)
    }
  }
}

/**
 * Companion object for MonitoringFilter with utility methods
 */
object MonitoringFilter {

  /**
   * Create a new MonitoringFilter instance
   */
  def apply(): MonitoringFilter = new MonitoringFilter()

  /**
   * Create a monitoring filter with additional configuration
   */
  def apply(metrics: Metrics): MonitoringFilter = {
    val filter = new MonitoringFilter()
    // Here you could add additional configuration if needed
    filter
  }

  /**
   * Standard metric names for consistency
   */
  object MetricNames {
    val REQUEST_COUNT = "requests_total"
    val REQUEST_LATENCY = "request_latency_seconds"
    val REQUEST_ERRORS = "request_errors_total"
    val ACTIVE_REQUESTS = "active_requests"
    val REQUEST_SIZE = "request_size_bytes"
    val RESPONSE_SIZE = "response_size_bytes"
  }

  /**
   * Standard label names
   */
  object LabelNames {
    val METHOD = "method"
    val PATH = "path"
    val STATUS = "status"
    val SERVICE = "service"
    val ERROR_TYPE = "error_type"
  }
}