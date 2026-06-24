#!/bin/bash

# OffMe Backend Services Startup Script
# Starts: Identity Service, Post Service, Timeline Service, Recs Serving

set -e

# Configuration
export DB_HOST=${DB_HOST:-localhost}
export DB_PORT=${DB_PORT:-5432}
export DB_NAME=${DB_NAME:-offme}
export DB_USER=${DB_USER:-offme}
export DB_PASSWORD=${DB_PASSWORD:-offme_dev}
export JWT_SECRET=${JWT_SECRET:-change_me_in_production_use_long_random_string_1234567890}
export CASSANDRA_HOSTS=${CASSANDRA_HOSTS:-localhost}
export REDIS_HOST=${REDIS_HOST:-localhost}
export KAFKA_BOOTSTRAP=${KAFKA_BOOTSTRAP:-localhost:9092}

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==> Starting OffMe Backend Services${NC}"
echo -e "${YELLOW}Configuration:${NC}"
echo "  DB: $DB_HOST:$DB_PORT/$DB_NAME"
echo "  Cassandra: $CASSANDRA_HOSTS"
echo "  Redis: $REDIS_HOST"
echo "  Kafka: $KAFKA_BOOTSTRAP"
echo ""

# Function to check if a port is available
wait_for_port() {
  local host=$1
  local port=$2
  local service=$3

  echo -n "  Waiting for $service ($host:$port) ... "

  while ! nc -z "$host" "$port" 2>/dev/null; do
    sleep 1
    echo -n "."
  done

  echo " ✓"
}

# Check database connections
echo -e "${GREEN}==> Checking database connections${NC}"
wait_for_port "$DB_HOST" "$DB_PORT" "PostgreSQL"
wait_for_port "$CASSANDRA_HOSTS" 9042 "Cassandra"
wait_for_port "$REDIS_HOST" 6379 "Redis"
wait_for_port "localhost" 9092 "Kafka"

echo ""

# Start services in background
echo -e "${GREEN}==> Starting services${NC}"

# Start Identity Service
echo -n "  Starting Identity Service ... "
cd backend-scala/identity-service
sbt "run" > /tmp/identity-service.log 2>&1 &
IDENTITY_PID=$!
echo " ✓ (PID: $IDENTITY_PID)"

# Start Post Service
echo -n "  Starting Post Service ... "
cd ../post-service
sbt "run" > /tmp/post-service.log 2>&1 &
POST_PID=$!
echo " ✓ (PID: $POST_PID)"

# Start Timeline Service
echo -n "  Starting Timeline Service ... "
cd ../timeline-service
sbt "run" > /tmp/timeline-service.log 2>&1 &
TIMELINE_PID=$!
echo " ✓ (PID: $TIMELINE_PID)"

# Start Recs Serving (Rust)
echo -n "  Starting Recs Serving ... "
cd ../../backend-rust/recs-serving
cargo run > /tmp/recs-serving.log 2>&1 &
RECS_PID=$!
echo " ✓ (PID: $RECS_PID)"

echo ""

# Wait for services to be ready
echo -e "${GREEN}==> Waiting for services to initialize${NC}"
sleep 5

# Check if services are running
echo -e "${GREEN}==> Service status${NC}"
if ps -p $IDENTITY_PID > /dev/null; then echo "  ✓ Identity Service (port 8081)"; else echo "  ✗ Identity Service failed"; fi
if ps -p $POST_PID > /dev/null; then echo "  ✓ Post Service (port 8082)"; else echo "  ✗ Post Service failed"; fi
if ps -p $TIMELINE_PID > /dev/null; then echo "  ✓ Timeline Service (port 8083)"; else echo "  ✗ Timeline Service failed"; fi
if ps -p $RECS_PID > /dev/null; then echo "  ✓ Recs Serving (port 8090)"; else echo "  ✗ Recs Serving failed"; fi

echo ""
echo -e "${GREEN}==> Backend services started!${NC}"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo "  Identity: tail -f /tmp/identity-service.log"
echo "  Post:     tail -f /tmp/post-service.log"
echo "  Timeline: tail -f /tmp/timeline-service.log"
echo "  Recs:     tail -f /tmp/recs-serving.log"
echo ""
echo -e "${YELLOW}API Gateway:${NC}"
echo "  Start with: cd backend-scala/api-gateway && sbt run"
echo ""
echo -e "${YELLOW}Test endpoints:${NC}"
echo "  Health:     curl http://localhost:8080/api/v1/health"
echo "  Register:   curl -X POST http://localhost:8080/api/v1/auth/register ..."
echo "  Login:      curl -X POST http://localhost:8080/api/v1/auth/login ..."
echo "  Create Post: curl -X POST http://localhost:8080/api/v1/posts ..."
echo ""