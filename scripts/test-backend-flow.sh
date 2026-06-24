#!/bin/bash

# OffMe Backend Flow Test Script
# Tests: Registration → Login → Post Creation → Timeline

set -e

# Configuration
API_URL="http://localhost:8080"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}==> OffMe Backend Flow Test${NC}"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
HEALTH_RESPONSE=$(curl -s "$API_URL/api/v1/health")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
  echo "  ✓ API Gateway is healthy"
else
  echo "  ✗ Health check failed"
  echo "  Response: $HEALTH_RESPONSE"
  exit 1
fi
echo ""

# Test 2: User Registration
echo -e "${YELLOW}Test 2: User Registration${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!",
    "displayName": "Test User"
  }')

if echo "$REGISTER_RESPONSE" | grep -q '"accessToken"'; then
  echo "  ✓ User registered successfully"
  ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)
  echo "  User ID: $USER_ID"
  echo "  Access Token: $ACCESS_TOKEN"
else
  echo "  ✗ Registration failed"
  echo "  Response: $REGISTER_RESPONSE"
  exit 1
fi
echo ""

# Test 3: User Login
echo -e "${YELLOW}Test 3: User Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }')

if echo "$LOGIN_RESPONSE" | grep -q '"accessToken"'; then
  echo "  ✓ User logged in successfully"
  ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
else
  echo "  ✗ Login failed"
  echo "  Response: $LOGIN_RESPONSE"
  exit 1
fi
echo ""

# Test 4: Create Post
echo -e "${YELLOW}Test 4: Create Post${NC}"
CREATE_POST_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "text": "Hello OffMe! This is my first post from the backend test."
  }')

if echo "$CREATE_POST_RESPONSE" | grep -q '"id"'; then
  echo "  ✓ Post created successfully"
  POST_ID=$(echo "$CREATE_POST_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)
  echo "  Post ID: $POST_ID"
else
  echo "  ✗ Post creation failed"
  echo "  Response: $CREATE_POST_RESPONSE"
  exit 1
fi
echo ""

# Test 5: Get Home Timeline
echo -e "${YELLOW}Test 5: Get Home Timeline${NC}"
TIMELINE_RESPONSE=$(curl -s "$API_URL/api/v1/timeline/home" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$TIMELINE_RESPONSE" | grep -q '"entries"'; then
  echo "  ✓ Timeline retrieved successfully"
  POST_COUNT=$(echo "$TIMELINE_RESPONSE" | grep -o '"entries":\[[^]]*\]' | grep -o 'post_id' | wc -l)
  echo "  Posts in timeline: $POST_COUNT"
else
  echo "  ✗ Timeline retrieval failed"
  echo "  Response: $TIMELINE_RESPONSE"
  exit 1
fi
echo ""

# Test 6: Get For You Timeline
echo -e "${YELLOW}Test 6: Get For You Timeline${NC}"
FOR_YOU_RESPONSE=$(curl -s "$API_URL/api/v1/timeline/for-you" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$FOR_YOU_RESPONSE" | grep -q '"entries"'; then
  echo "  ✓ For You timeline retrieved successfully"
  FOR_YOU_COUNT=$(echo "$FOR_YOU_RESPONSE" | grep -o '"entries":\[[^]]*\]' | grep -o 'post_id' | wc -l)
  echo "  Posts in For You: $FOR_YOU_COUNT"
else
  echo "  ✗ For You timeline retrieval failed"
  echo "  Response: $FOR_YOU_RESPONSE"
  exit 1
fi
echo ""

# Test 7: Follow Another User
echo -e "${YELLOW}Test 7: Follow Another User${NC}"
FOLLOW_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/users/2/follow" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$FOLLOW_RESPONSE" | grep -q '"following":true'; then
  echo "  ✓ Successfully followed user 2"
else
  echo "  ✗ Follow failed"
  echo "  Response: $FOLLOW_RESPONSE"
  exit 1
fi
echo ""

# Summary
echo -e "${GREEN}==> All Tests Passed! ✅${NC}"
echo ""
echo -e "${YELLOW}Summary:${NC}"
echo "  ✓ Health check"
echo "  ✓ User registration"
echo "  ✓ User login"
echo "  ✓ Post creation"
echo "  ✓ Home timeline"
echo "  ✓ For You timeline"
echo "  ✓ Follow user"
echo ""
echo -e "${GREEN}Backend is fully functional! 🎉${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Start API Gateway: cd backend-scala/api-gateway && sbt run"
echo "  2. Test with frontend: npm run dev (in frontend-web)"
echo "  3. Monitor services: tail -f /tmp/*.log"
echo ""