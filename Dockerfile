# OffMe Backend Dockerfile for Render
# Multi-stage build with SBT pre-installed

# Stage 1: Build with SBT
FROM eclipse-temurin:21-jdk-jammy as builder

WORKDIR /app
COPY . .

# Install SBT using official package
RUN apt-get update && apt-get install -y curl && \
    echo "deb https://repo.scala-sbt.org/scalasbt/debian all main" | tee /etc/apt/sources.list.d/sbt.list && \
    echo "deb https://repo.scala-sbt.org/scalasbt/debian /" | tee /etc/apt/sources.list.d/sbt_old.list && \
    curl -sL "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x2EE0EA64E40A89B84B2DF73499E82A75642AC823" | apt-key add && \
    apt-get update && apt-get install -y sbt

# Build all services
WORKDIR /app/backend-scala
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
COPY start-services.sh /app/start-services.sh

# Install dependencies
RUN apt-get update && apt-get install -y netcat-openbsd

# Expose ports
EXPOSE 8080

# Start script
CMD ["./start-services.sh"]
