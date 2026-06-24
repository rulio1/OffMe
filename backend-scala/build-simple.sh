#!/bin/bash

# Simple build script for OffMe API Gateway
# Uses a pre-built SBT Docker image

set -e

echo "🚀 Starting OffMe API Gateway build process..."

# Change to backend-scala directory
cd "$(dirname "$0")"

echo "🐳 Using pre-built SBT Docker image..."

# Use a pre-built SBT image to avoid long installation
docker run --rm -v "$PWD":/app -w /app hseeberger/scala-sbt:21.0.2_1.9.8_3.3.3 bash -c '\
    echo "🔧 Building API Gateway..." && \
    sbt -v && \
    sbt api-gateway/universal:packageBin && \
    echo "📦 Build completed successfully!" && \
    ls -la api-gateway/target/universal/'

echo "✅ Build process completed!"
echo "📁 The built package is available in: api-gateway/target/universal/"
<task_progress>
- [x] Analyze current backend configuration
- [x] Check SBT build setup
- [x] Verify Fly.io configuration
- [x] Create Docker-based build script
- [x] Start Docker daemon
- [ ] Build locally with SBT using Docker
- [ ] Deploy to Fly.io
</task_progress>