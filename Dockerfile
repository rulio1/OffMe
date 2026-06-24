# OffMe Backend Dockerfile for Railway
# Multi-stage build for Scala services

# Stage 1: Build
FROM eclipse-temurin:21-jdk-jammy as builder

WORKDIR /app
COPY . .

# Install sbt
RUN apt-get update && apt-get install -y curl && \
    curl -s "https://get.sdkman.io" | bash && \
    source "$HOME/.sdkman/bin/sdkman-init.sh" && \
    sdk install sbt 1.9.7

# Build all services
RUN sbt clean compile

# Package services
RUN sbt identity-service/universal:packageBin
RUN sbt post-service/universal:packageBin
RUN sbt timeline-service/universal:packageBin
RUN sbt api-gateway/universal:packageBin

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Copy built services
COPY --from=builder /app/backend-scala/identity-service/target/universal/stage /app/identity-service
COPY --from=builder /app/backend-scala/post-service/target/universal/stage /app/post-service
COPY --from=builder /app/backend-scala/timeline-service/target/universal/stage /app/timeline-service
COPY --from=builder /app/backend-scala/api-gateway/target/universal/stage /app/api-gateway

# Copy scripts
COPY scripts/start-backend-services.sh /app/start-services.sh
COPY railway.toml /app/railway.toml

# Install dependencies
RUN apt-get update && apt-get install -y netcat-openbsd

# Expose ports
EXPOSE 8080 8081 8082 8083 8084 8090

# Start script
CMD ["./start-services.sh"]