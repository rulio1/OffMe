# API Gateway Dockerfile for Fly.io
# Simplified for Fly.io deployment
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Copy pre-built API Gateway (we'll build locally first)
COPY target/universal/stage /app

# Install dependencies
RUN apt-get update && apt-get install -y netcat-openbsd curl

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=5 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start command
CMD ["./bin/offme-api-gateway", "-Dhttp.port=8080"]
