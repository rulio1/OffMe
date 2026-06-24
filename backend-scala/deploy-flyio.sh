#!/bin/bash

# Fly.io Deployment Script for OffMe Backend
# This script handles the complete deployment process to Fly.io

set -e

echo "🚀 Starting OffMe Backend deployment to Fly.io..."

# Change to backend-scala directory
cd "$(dirname "$0")"

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl not found. Please install Fly.io CLI first:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if we're logged in to Fly.io
if ! flyctl auth whoami &> /dev/null; then
    echo "❌ Not logged in to Fly.io. Please run:"
    echo "   flyctl auth login"
    exit 1
fi

echo "✅ Fly.io CLI is ready!"

# Build the API Gateway
echo "🔨 Building API Gateway..."
if ! sbt api-gateway/universal:packageBin; then
    echo "❌ Build failed. Please ensure SBT is installed and all dependencies are available."
    exit 1
fi

echo "📦 Build completed successfully!"

# Check if the app exists on Fly.io
echo "🔍 Checking if app exists on Fly.io..."
if flyctl apps list | grep -q "offme-backend"; then
    echo "✅ App 'offme-backend' already exists on Fly.io"
else
    echo "🆕 Creating new app 'offme-backend' on Fly.io..."
    flyctl apps create offme-backend --region gru
fi

# Deploy to Fly.io
echo "🚀 Deploying to Fly.io..."
cd api-gateway
flyctl deploy --build-only

echo "🌐 Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your database connection strings in Fly.io secrets"
echo "2. Configure environment variables for production"
echo "3. Scale your application as needed"
echo ""
echo "🔗 Your application should be available at: https://offme-backend.fly.dev"
<task_progress>
- [x] Analyze current backend configuration
- [x] Check SBT build setup
- [x] Verify Fly.io configuration
- [x] Create Docker-based build script
- [x] Start Docker daemon
- [x] Install SBT manually
- [x] Create Fly.io deployment script
- [ ] Build locally with SBT
- [ ] Deploy to Fly.io
</task_progress>