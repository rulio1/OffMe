# Timeline Service Dockerfile for Vercel
FROM eclipse-temurin:21-jdk-jammy as builder

WORKDIR /app

# Copy necessary files
COPY ../../backend-scala/timeline-service .
COPY ../../backend-scala/shared .
COPY ../../backend-scala/build.sbt .
COPY ../../backend-scala/project .

# Install SBT
RUN apt-get update && apt-get install -y curl && \
    echo "deb https://repo.scala-sbt.org/scalasbt/debian all main" | tee /etc/apt/sources.list.d/sbt.list && \
    echo "deb https://repo.scala-sbt.org/scalasbt/debian /" | tee /etc/apt/sources.list.d/sbt_old.list && \
    curl -sL "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x2EE0EA64E40A89B84B2DF73499E82A75642AC823" | apt-key add && \
    apt-get update && apt-get install -y sbt

# Build timeline service
RUN sbt clean compile
RUN sbt timeline-service/universal:packageBin

# Runtime stage
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Copy built service
COPY --from=builder /app/backend-scala/timeline-service/target/universal/stage /app

# Install dependencies
RUN apt-get update && apt-get install -y netcat-openbsd

# Expose port
EXPOSE 8083

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD nc -z localhost 8083 || exit 1

# Start command
CMD ["./bin/offme-timeline-service", "-http.port=8083"]