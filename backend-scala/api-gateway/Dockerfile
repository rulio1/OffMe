# API Gateway Dockerfile for Vercel
# Optimized for Vercel container deployment
FROM eclipse-temurin:21-jdk-jammy as builder

WORKDIR /app

# Copy only the necessary files for the API Gateway
COPY ../../backend-scala/api-gateway .
COPY ../../backend-scala/shared .
COPY ../../backend-scala/build.sbt .
COPY ../../backend-scala/project .

# Install SBT
RUN apt-get update && apt-get install -y curl && \
    echo "deb https://repo.scala-sbt.org/scalasbt/debian all main" | tee /etc/apt/sources.list.d/sbt.list && \
    echo "deb https://repo.scala-sbt.org/scalasbt/debian /" | tee /etc/apt/sources.list.d/sbt_old.list && \
    curl -sL "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x2EE0EA64E40A89B84B2DF73499E82A75642AC823" | apt-key add && \
    apt-get update && apt-get install -y sbt

# Build only the API Gateway
RUN sbt clean compile
RUN sbt api-gateway/universal:packageBin

# Runtime stage
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Copy built API Gateway
COPY --from=builder /app/backend-scala/api-gateway/target/universal/stage /app

# Install dependencies
RUN apt-get update && apt-get install -y netcat-openbsd

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/v1/health || exit 1

# Start command
CMD ["./bin/offme-api-gateway", "-http.port=8080"]