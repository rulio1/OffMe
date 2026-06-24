#!/bin/bash

# Test script for Vercel-only migration
# Verifies that the Vercel-only deployment configuration is correct

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}==> Testing OffMe Vercel-Only Migration Setup${NC}"
echo ""

# Test 1: Verify Vercel configuration
echo -e "${YELLOW}Test 1: Checking Vercel configuration${NC}"
if [ -f "vercel.json" ]; then
    echo "  ✓ vercel.json exists"

    # Check if all services are configured
    service_count=$(grep -c '"use": "@vercel/docker"' vercel.json)
    if [ "$service_count" -ge 7 ]; then
        echo "  ✓ All services configured for Vercel ($service_count Docker builds)"
    else
        echo -e "${RED}  ✗ Not all services configured (found $service_count, expected 7)${NC}"
        exit 1
    fi

    # Check if WebSocket routing is local
    if grep -q '"dest": "/ws/$1"' vercel.json; then
        echo "  ✓ WebSocket routing configured for Vercel"
    else
        echo -e "${RED}  ✗ WebSocket routing not properly configured${NC}"
        exit 1
    fi
else
    echo -e "${RED}  ✗ vercel.json not found${NC}"
    exit 1
fi
echo ""

# Test 2: Verify all service Dockerfiles
echo -e "${YELLOW}Test 2: Checking all service Dockerfiles${NC}"

services=("api-gateway" "identity-service" "post-service" "timeline-service" "graph-service" "notification-service" "websocket-service")
dockerfile_count=0

for service in "${services[@]}"; do
    if [ -f "backend-scala/$service/Dockerfile" ]; then
        echo "  ✓ $service Dockerfile exists"

        # Check if it's using the right base image
        if grep -q "eclipse-temurin:21" "backend-scala/$service/Dockerfile"; then
            echo "    ✓ Using correct Java base image"
        else
            echo -e "${RED}    ✗ Incorrect Java base image${NC}"
            exit 1
        fi

        # Check if health check is configured
        if grep -q "HEALTHCHECK" "backend-scala/$service/Dockerfile"; then
            echo "    ✓ Health check configured"
        else
            echo -e "${RED}    ✗ Health check not configured${NC}"
            exit 1
        fi

        ((dockerfile_count++))
    else
        echo -e "${RED}  ✗ $service Dockerfile not found${NC}"
        exit 1
    fi
done

echo "  ✓ All $dockerfile_count service Dockerfiles verified"
echo ""

# Test 3: Verify deployment scripts
echo -e "${YELLOW}Test 3: Checking deployment scripts${NC}"
if [ -f "scripts/deploy-backend.sh" ]; then
    echo "  ✓ Deployment script exists"

    # Check if it mentions Vercel-only
    if grep -q "Vercel-Only" scripts/deploy-backend.sh; then
        echo "  ✓ Deployment script updated for Vercel-only"
    else
        echo -e "${RED}  ✗ Deployment script not updated for Vercel-only${NC}"
        exit 1
    fi

    # Check if it builds all services
    if grep -q "offme-identity-service" scripts/deploy-backend.sh && \
       grep -q "offme-post-service" scripts/deploy-backend.sh && \
       grep -q "offme-websocket-service" scripts/deploy-backend.sh; then
        echo "  ✓ All services included in deployment script"
    else
        echo -e "${RED}  ✗ Not all services included in deployment script${NC}"
        exit 1
    fi
else
    echo -e "${RED}  ✗ Deployment script not found${NC}"
    exit 1
fi
echo ""

# Test 4: Verify environment variables
echo -e "${YELLOW}Test 4: Checking environment variables configuration${NC}"

# Check service URLs are configured for Vercel internal networking
if grep -q "IDENTITY_SERVICE_URL" vercel.json && \
   grep -q "POST_SERVICE_URL" vercel.json && \
   grep -q "WEBSOCKET_SERVICE_URL" vercel.json; then
    echo "  ✓ Service URL variables configured for Vercel networking"

    # Check if they use internal service names
    if grep -q "identity-service:8081" vercel.json && \
       grep -q "websocket-service:8086" vercel.json; then
        echo "  ✓ Internal service networking configured"
    else
        echo -e "${RED}  ✗ Internal service networking not properly configured${NC}"
        exit 1
    fi
else
    echo -e "${RED}  ✗ Service URL variables not configured${NC}"
    exit 1
fi

# Check database variables
if grep -q "DB_HOST" vercel.json && grep -q "REDIS_HOST" vercel.json; then
    echo "  ✓ Database variables configured"
else
    echo -e "${RED}  ✗ Database variables not configured${NC}"
    exit 1
fi

# Check WebSocket URL is updated for Vercel
if grep -q "wss://offme.vercel.app/ws" vercel.json; then
    echo "  ✓ WebSocket URL configured for Vercel"
else
    echo -e "${RED}  ✗ WebSocket URL not configured for Vercel${NC}"
    exit 1
fi
echo ""

# Test 5: Verify API Gateway configuration
echo -e "${YELLOW}Test 5: Checking API Gateway configuration${NC}"
if grep -q 'NEXT_PUBLIC_API_URL": "/api/v1"' vercel.json; then
    echo "  ✓ API Gateway URL configured for local routing"
else
    echo -e "${RED}  ✗ API Gateway URL not properly configured${NC}"
    exit 1
fi
echo ""

echo -e "${GREEN}==> All Vercel-Only Migration Tests Passed! ✅${NC}"
echo ""
echo -e "${YELLOW}Vercel-Only Migration Summary:${NC}"
echo "  ✓ Vercel configuration updated for all services"
echo "  ✓ All service Dockerfiles created for Vercel containers"
echo "  ✓ Deployment scripts updated for Vercel-only approach"
echo "  ✓ Internal service networking configured"
echo "  ✓ Environment variables configured for Vercel"
echo "  ✓ WebSocket routing updated for Vercel"
echo ""
echo -e "${GREEN}The backend is ready for Vercel-only deployment! 🎉${NC}"
echo ""
echo -e "${YELLOW}Next steps for Vercel-only deployment:${NC}"
echo "  1. Set up Vercel project with Postgres and Redis"
echo "  2. Configure Vercel environment variables"
echo "  3. Deploy all services to Vercel using: vercel --prod"
echo "  4. Test the complete Vercel-only setup"
echo "  5. Monitor services using Vercel dashboard"
