#!/bin/bash

# Build script for OffMe API Gateway using Docker
# This script builds the Scala project and prepares it for Fly.io deployment

set -e

echo "🚀 Starting OffMe API Gateway build process..."

# Change to backend-scala directory
cd "$(dirname "$0")"

# Create a temporary Docker container to build the project
echo "🐳 Creating build container with SBT..."

docker run --rm -v "$PWD":/app -w /app eclipse-temurin:21-jdk-jammy bash -c '\
    apt-get update && \
    apt-get install -y curl && \
    curl -s "https://get.sdkman.io" | bash && \
    source "$HOME/.sdkman/bin/sdkman-init.sh" && \
    sdk install sbt && \
    sbt -v && \
    echo "🔧 Building API Gateway..." && \
    sbt api-gateway/universal:packageBin && \
    echo "📦 Build completed successfully!" && \
    ls -la api-gateway/target/universal/'

echo "✅ Build process completed!"
echo "📁 The built package is available in: api-gateway/target/universal/"
<task_progress>
- [x] Analyze current backend configuration
- [x] Check SBT build setup
- [x] Verify Fly.io configuration
- [ ] Create Docker-based build script
- [ ] Build locally with SBT using Docker
- [ ] Deploy to Fly.io
</task_progress>