#!/bin/bash

# OffMe Backend Start Script for Railway
# Starts all services in the correct order

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}==> Starting OffMe Backend Services${NC}"
echo ""

# Wait for database connections
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

# Check if databases are available
echo -e "${YELLOW}Checking database connections${NC}"
wait_for_port "$DB_HOST" "$DB_PORT" "PostgreSQL"
wait_for_port "$REDIS_HOST" "$REDIS_PORT" "Redis"
echo ""

# Start services
echo -e "${YELLOW}Starting services${NC}"

# Start Identity Service
echo -n "  Starting Identity Service ... "
cd /app/identity-service
./bin/identity-service-main -Dconfig.file=application.conf &
IDENTITY_PID=$!
echo " ✓ (PID: $IDENTITY_PID)"

# Start Post Service
echo -n "  Starting Post Service ... "
cd /app/post-service
./bin/post-service-main -Dconfig.file=application.conf &
POST_PID=$!
echo " ✓ (PID: $POST_PID)"

# Start Timeline Service
echo -n "  Starting Timeline Service ... "
cd /app/timeline-service
./bin/timeline-service-main -Dconfig.file=application.conf &
TIMELINE_PID=$!
echo " ✓ (PID: $TIMELINE_PID)"

# Start API Gateway
echo -n "  Starting API Gateway ... "
cd /app/api-gateway
./bin/api-gateway-main -Dconfig.file=application.conf &
GATEWAY_PID=$!
echo " ✓ (PID: $GATEWAY_PID)"

echo ""

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to initialize${NC}"
sleep 10

# Check if services are running
echo -e "${YELLOW}Service status${NC}"
if ps -p $IDENTITY_PID > /dev/null; then echo "  ✓ Identity Service (port 8081)"; else echo "  ✗ Identity Service failed"; fi
if ps -p $POST_PID > /dev/null; then echo "  ✓ Post Service (port 8082)"; else echo "  ✗ Post Service failed"; fi
if ps -p $TIMELINE_PID > /dev/null; then echo "  ✓ Timeline Service (port 8083)"; else echo "  ✗ Timeline Service failed"; fi
if ps -p $GATEWAY_PID > /dev/null; then echo "  ✓ API Gateway (port 8080)"; else echo "  ✗ API Gateway failed"; fi

echo ""
echo -e "${GREEN}==> All services started! ✅${NC}"
echo ""
echo -e "${YELLOW}Backend is ready at: http://localhost:8080${NC}"
echo ""

# Keep the container running
wait $IDENTITY_PID $POST_PID $TIMELINE_PID $GATEWAY_PID