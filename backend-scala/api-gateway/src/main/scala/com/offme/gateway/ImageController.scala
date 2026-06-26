package com.offme.gateway

import com.twitter.finagle.http.{Request, Response, Status}
import com.twitter.finagle.Service
import com.twitter.util.Future
import com.offme.monitoring.Metrics
import com.twitter.io.Buf
import java.util.UUID
import java.awt.image.BufferedImage
import javax.imageio.ImageIO
import java.io.{ByteArrayInputStream, ByteArrayOutputStream}
import java.awt.{RenderingHints, Image => AWTImage}
import scala.util.{Try, Success, Failure}

/**
 * Image Controller for OffMe API Gateway
 *
 * Provides image processing and CDN integration services:
 * - Image upload and storage
 * - Image resizing and optimization
 * - CDN cache invalidation
 * - Image format conversion
 * - Thumbnail generation
 *
 * This controller handles all image-related operations and integrates with
 * cloud storage providers and CDNs for optimal image delivery.
 */
class ImageController extends Service[Request, Response] {

  // Initialize metrics
  private val metrics = Metrics("api_gateway_image")
  private val uploadCounter = metrics.counter("image_uploads_total", "Total image uploads")
  private val resizeCounter = metrics.counter("image_resizes_total", "Total image resizes")
  private val errorCounter = metrics.counter("image_errors_total", "Total image processing errors")
  private val uploadSizeHistogram = metrics.histogram("image_upload_size_bytes", "Image upload sizes")

  // Supported image formats
  private val supportedFormats = Set("jpg", "jpeg", "png", "gif", "webp")

  // Maximum upload size (10MB)
  private val maxUploadSize = 10 * 1024 * 1024

  def apply(request: Request): Future[Response] = {
    try {
      request.path match {
        case "/api/v1/images/upload" =>
          handleImageUpload(request)

        case "/api/v1/images/resize" =>
          handleImageResize(request)

        case "/api/v1/images/optimize" =>
          handleImageOptimization(request)

        case "/api/v1/images/cdn-invalidate" =>
          handleCdnInvalidation(request)

        case _ =>
          Future.value(notFoundResponse(request))
      }
    } catch {
      case e: Exception =>
        errorCounter.inc()
        Future.value(errorResponse(request, e))
    }
  }

  /**
   * Handle image upload
   */
  private def handleImageUpload(request: Request): Future[Response] = {
    // Check content type
    val contentType = request.headerMap.get("Content-Type").getOrElse("")
    if (!contentType.startsWith("multipart/form-data")) {
      return Future.value(
        Response(request.version, Status.BadRequest)
          .setContentString("{\"error\": \"unsupported_media_type\", \"message\": \"Expected multipart/form-data\"}")
          .setContentTypeJson()
      )
    }

    // Parse multipart form data
    parseMultipartFormData(request) match {
      case Success((fileData, fileName, contentType)) =>
        // Validate file size
        if (fileData.length > maxUploadSize) {
          Future.value(
            Response(request.version, Status.PayloadTooLarge)
              .setContentString(s"""{\"error\": \"payload_too_large\", \"message\": \"Maximum upload size is ${maxUploadSize / 1024 / 1024}MB\"}""")
              .setContentTypeJson()
          )
        } else {
          // Validate image format
          val fileExtension = getFileExtension(fileName).toLowerCase
          if (!supportedFormats.contains(fileExtension)) {
            Future.value(
              Response(request.version, Status.UnsupportedMediaType)
                .setContentString(s"""{\"error\": \"unsupported_format\", \"message\": \"Supported formats: ${supportedFormats.mkString(", ")}\"}""")
                .setContentTypeJson()
            )
          } else {
            // Process image upload
            processImageUpload(fileData, fileName, contentType)
          }
        }

      case Failure(e) =>
        errorCounter.inc()
        Future.value(
          Response(request.version, Status.BadRequest)
            .setContentString(s"""{\"error\": \"invalid_request\", \"message\": \"${e.getMessage}\"}""")
            .setContentTypeJson()
        )
    }
  }

  /**
   * Process image upload
   */
  private def processImageUpload(fileData: Array[Byte], fileName: String, contentType: String): Future[Response] = {
    try {
      // Generate unique image ID
      val imageId = UUID.randomUUID().toString

      // Store image in cloud storage (simulated)
      storeImageInCloudStorage(imageId, fileData, fileName, contentType)

      // Generate different sizes
      val sizes = generateImageSizes(fileData, imageId)

      // Record metrics
      uploadCounter.inc()
      uploadSizeHistogram.observe(fileData.length)

      // Return success response
      Future.value(
        Response(request.version, Status.Created)
          .setContentTypeJson()
          .setContentString(s"""
            {
              "id": "$imageId",
              "original_url": "https://cdn.offme.com/images/$imageId/original.${getFileExtension(fileName)}",
              "sizes": {
                "thumbnail": "https://cdn.offme.com/images/$imageId/thumb.${getFileExtension(fileName)}",
                "small": "https://cdn.offme.com/images/$imageId/small.${getFileExtension(fileName)}",
                "medium": "https://cdn.offme.com/images/$imageId/medium.${getFileExtension(fileName)}",
                "large": "https://cdn.offme.com/images/$imageId/large.${getFileExtension(fileName)}"
              },
              "content_type": "$contentType",
              "size_bytes": ${fileData.length},
              "created_at": "${java.time.Instant.now()}"
            }
          """)
      )
    } catch {
      case e: Exception =>
        errorCounter.inc()
        Future.value(
          Response(request.version, Status.InternalServerError)
            .setContentTypeJson()
            .setContentString(s"""{\"error\": \"upload_failed\", \"message\": \"${e.getMessage}\"}""")
        )
    }
  }

  /**
   * Handle image resize
   */
  private def handleImageResize(request: Request): Future[Response] = {
    // Parse query parameters
    val widthParam = request.params.get("width").flatMap(_.toIntOption)
    val heightParam = request.params.get("height").flatMap(_.toIntOption)
    val urlParam = request.params.get("url")

    (widthParam, heightParam, urlParam) match {
      case (Some(width), Some(height), Some(url)) if width > 0 && height > 0 =>
        // Download and resize image
        downloadAndResizeImage(url, width, height)

      case _ =>
        Future.value(
          Response(request.version, Status.BadRequest)
            .setContentTypeJson()
            .setContentString("{\"error\": \"invalid_parameters\", \"message\": \"width, height, and url parameters are required\"}")
        )
    }
  }

  /**
   * Download and resize image
   */
  private def downloadAndResizeImage(url: String, width: Int, height: Int): Future[Response] = {
    Future {
      try {
        // Download image
        val imageData = downloadImageFromUrl(url)

        // Resize image
        val resizedImage = resizeImage(imageData, width, height)

        // Convert to bytes
        val outputStream = new ByteArrayOutputStream()
        ImageIO.write(resizedImage, "png", outputStream)
        val resizedData = outputStream.toByteArray
        outputStream.close()

        // Record metrics
        resizeCounter.inc()

        // Return resized image
        Response(request.version, Status.Ok)
          .setContentType("image/png")
          .write(Buf.ByteArray.Owned(resizedData))
      } catch {
        case e: Exception =>
          errorCounter.inc()
          Response(request.version, Status.InternalServerError)
            .setContentTypeJson()
            .setContentString(s"""{\"error\": \"resize_failed\", \"message\": \"${e.getMessage}\"}""")
      }
    }
  }

  /**
   * Handle image optimization
   */
  private def handleImageOptimization(request: Request): Future[Response] = {
    // Parse query parameters
    val urlParam = request.params.get("url")
    val qualityParam = request.params.get("quality").flatMap(_.toIntOption).getOrElse(85)

    urlParam match {
      case Some(url) if qualityParam >= 10 && qualityParam <= 100 =>
        // Download and optimize image
        downloadAndOptimizeImage(url, qualityParam)

      case _ =>
        Future.value(
          Response(request.version, Status.BadRequest)
            .setContentTypeJson()
            .setContentString("{\"error\": \"invalid_parameters\", \"message\": \"url parameter is required, quality must be 10-100\"}")
        )
    }
  }

  /**
   * Download and optimize image
   */
  private def downloadAndOptimizeImage(url: String, quality: Int): Future[Response] = {
    Future {
      try {
        // Download image
        val imageData = downloadImageFromUrl(url)

        // Optimize image
        val optimizedData = optimizeImage(imageData, quality)

        // Return optimized image
        Response(request.version, Status.Ok)
          .setContentType("image/jpeg")
          .write(Buf.ByteArray.Owned(optimizedData))
      } catch {
        case e: Exception =>
          errorCounter.inc()
          Response(request.version, Status.InternalServerError)
            .setContentTypeJson()
            .setContentString(s"""{\"error\": \"optimization_failed\", \"message\": \"${e.getMessage}\"}""")
      }
    }
  }

  /**
   * Handle CDN cache invalidation
   */
  private def handleCdnInvalidation(request: Request): Future[Response] = {
    // Check authorization
    val authHeader = request.headerMap.get("Authorization")
    if (authHeader != Some("Bearer valid_cdn_token")) {
      return Future.value(
        Response(request.version, Status.Unauthorized)
          .setContentTypeJson()
          .setContentString("{\"error\": \"unauthorized\", \"message\": \"Invalid CDN token\"}")
      )
    }

    // Parse request body
    Try {
      val body = request.contentString
      // In production, parse JSON body to get URLs to invalidate
      // For now, just return success
      Response(request.version, Status.Ok)
        .setContentTypeJson()
        .setContentString("{\"success\": true, \"message\": \"CDN cache invalidation requested\"}")
    } match {
      case Success(response) => Future.value(response)
      case Failure(e) =>
        errorCounter.inc()
        Future.value(
          Response(request.version, Status.BadRequest)
            .setContentTypeJson()
            .setContentString(s"""{\"error\": \"invalid_request\", \"message\": \"${e.getMessage}\"}""")
        )
    }
  }

  // MARK: - Image Processing Methods

  /**
   * Parse multipart form data
   */
  private def parseMultipartFormData(request: Request): Try[(Array[Byte], String, String)] = {
    Try {
      // This is a simplified implementation
      // In production, use a proper multipart parser like Apache Commons FileUpload

      // For demonstration, we'll extract the first file-like part
      val content = request.contentString
      val fileData = content.getBytes("UTF-8")
      val fileName = "uploaded_image.jpg" // Simplified
      val contentType = "image/jpeg" // Simplified

      (fileData, fileName, contentType)
    }
  }

  /**
   * Store image in cloud storage (simulated)
   */
  private def storeImageInCloudStorage(imageId: String, data: Array[Byte], fileName: String, contentType: String): Unit = {
    // In production, this would upload to S3, GCS, or similar
    println(s"Storing image $imageId in cloud storage: $fileName ($contentType, ${data.length} bytes)")
  }

  /**
   * Generate different image sizes
   */
  private def generateImageSizes(data: Array[Byte], imageId: String): Map[String, String] = {
    // In production, this would generate actual resized versions
    // For now, just return placeholder URLs
    Map(
      "thumbnail" -> s"https://cdn.offme.com/images/$imageId/thumb.jpg",
      "small" -> s"https://cdn.offme.com/images/$imageId/small.jpg",
      "medium" -> s"https://cdn.offme.com/images/$imageId/medium.jpg",
      "large" -> s"https://cdn.offme.com/images/$imageId/large.jpg"
    )
  }

  /**
   * Download image from URL
   */
  private def downloadImageFromUrl(url: String): Array[Byte] = {
    import java.net.URL
    import java.nio.channels.Channels

    val urlObj = new URL(url)
    val connection = urlObj.openConnection()
    val inputStream = connection.getInputStream
    val bytes = Channels.newChannel(inputStream).read(ByteBuffer.allocate(1024 * 1024))
    inputStream.close()

    val data = new Array[Byte](bytes)
    bytes.flip()
    bytes.get(data)
    data
  }

  /**
   * Resize image to target dimensions
   */
  private def resizeImage(data: Array[Byte], targetWidth: Int, targetHeight: Int): BufferedImage = {
    val inputStream = new ByteArrayInputStream(data)
    val originalImage = ImageIO.read(inputStream)
    inputStream.close()

    val width = originalImage.getWidth
    val height = originalImage.getHeight

    // Calculate aspect ratio
    val widthRatio = targetWidth.toDouble / width
    val heightRatio = targetHeight.toDouble / height
    val ratio = Math.min(widthRatio, heightRatio)

    // Calculate new dimensions
    val newWidth = (width * ratio).toInt
    val newHeight = (height * ratio).toInt

    // Create resized image
    val resizedImage = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB)
    val graphics = resizedImage.createGraphics()
    graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR)
    graphics.drawImage(originalImage, 0, 0, newWidth, newHeight, null)
    graphics.dispose()

    resizedImage
  }

  /**
   * Optimize image with specified quality
   */
  private def optimizeImage(data: Array[Byte], quality: Int): Array[Byte] = {
    val inputStream = new ByteArrayInputStream(data)
    val originalImage = ImageIO.read(inputStream)
    inputStream.close()

    val outputStream = new ByteArrayOutputStream()
    val writer = ImageIO.getImageWritersByFormatName("jpg").next()
    val ios = ImageIO.createImageOutputStream(outputStream)
    writer.output = ios

    val params = writer.getDefaultWriteParam
    params.setCompressionMode(javax.imageio.ImageWriteParam.MODE_EXPLICIT)
    params.setCompressionQuality(quality.toFloat / 100.0f)

    writer.write(null, new javax.imageio.IIOImage(originalImage, null, null), params)
    ios.close()
    writer.dispose()

    outputStream.toByteArray
  }

  /**
   * Get file extension from filename
   */
  private def getFileExtension(filename: String): String = {
    filename.substring(filename.lastIndexOf(".") + 1).toLowerCase
  }

  // MARK: - Response Helpers

  /**
   * Create 404 Not Found response
   */
  private def notFoundResponse(request: Request): Response = {
    Response(request.version, Status.NotFound)
      .setContentTypeJson()
      .setContentString(s"""{\"error\": \"not_found\", \"message\": \"The requested image resource was not found\", \"path\": \"${request.path}\"}""")
  }

  /**
   * Create error response
   */
  private def errorResponse(request: Request, error: Throwable): Response = {
    Response(request.version, Status.InternalServerError)
      .setContentTypeJson()
      .setContentString(s"""{\"error\": \"image_processing_error\", \"message\": \"${error.getMessage}\", \"path\": \"${request.path}\"}""")
  }
}

/**
 * Companion object for ImageController
 */
object ImageController {

  /**
   * Create a new ImageController instance
   */
  def apply(): ImageController = new ImageController()

  /**
   * Register image routes with the API Gateway
   */
  def registerRoutes(gateway: com.twitter.finagle.Http.ServerBuilder): com.twitter.finagle.Http.ServerBuilder = {
    gateway
      .route("/api/v1/images/upload", new ImageController())
      .route("/api/v1/images/resize", new ImageController())
      .route("/api/v1/images/optimize", new ImageController())
      .route("/api/v1/images/cdn-invalidate", new ImageController())
  }

  /**
   * Image service endpoints
   */
  object Endpoints {
    val UPLOAD = "/api/v1/images/upload"
    val RESIZE = "/api/v1/images/resize"
    val OPTIMIZE = "/api/v1/images/optimize"
    val CDN_INVALIDATE = "/api/v1/images/cdn-invalidate"
  }

  /**
   * Supported image operations
   */
  object Operations {
    val UPLOAD = "upload"
    val RESIZE = "resize"
    val OPTIMIZE = "optimize"
    val CDN_INVALIDATE = "cdn_invalidate"
  }
}