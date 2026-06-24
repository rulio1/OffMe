# OffMe Backend - Fly.io Deployment Guide

## 🚀 Quick Start

This guide will help you deploy the OffMe backend to Fly.io. The backend is 90% configured - you just need to build locally with SBT and deploy.

## 📋 Prerequisites

1. **Fly.io Account** - Sign up at [https://fly.io](https://fly.io)
2. **Fly.io CLI** - Install with: `curl -L https://fly.io/install.sh | sh`
3. **Java 21+** - Required for SBT
4. **SBT (Scala Build Tool)** - For building the project
5. **Docker** - For container deployment

## 🛠 Installation

### 1. Install Fly.io CLI

```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Login to Fly.io

```bash
flyctl auth login
```

### 3. Install Java (if not already installed)

**macOS (Homebrew):**
```bash
brew install openjdk@21
```

**Linux (apt):**
```bash
sudo apt update && sudo apt install openjdk-21-jdk
```

### 4. Install SBT

**macOS (Homebrew):**
```bash
brew install sbt
```

**Linux (manual install):**
```bash
echo "deb https://repo.scala-sbt.org/scalasbt/debian all main" | sudo tee /etc/apt/sources.list.d/sbt.list
echo "deb https://repo.scala-sbt.org/scalasbt/debian /" | sudo tee /etc/apt/sources.list.d/sbt_old.list
curl -sL "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x2EE0EA64E40A89B84B2DF73499E82A75642AC823" | sudo apt-key add
sudo apt update
sudo apt install sbt
```

## 🔨 Build Process

### 1. Build the API Gateway

```bash
cd backend-scala
sbt api-gateway/universal:packageBin
```

This will create a packaged application in:
```
api-gateway/target/universal/offme-api-gateway-0.1.0-SNAPSHOT.zip
```

### 2. Prepare Docker Image

The `api-gateway/Dockerfile` is already configured to copy the built application.

## 🚀 Deployment

### 1. Create Fly.io App

```bash
flyctl apps create offme-backend --region gru
```

### 2. Set Environment Variables

```bash
flyctl secrets set \
  DB_HOST='your-database-host' \
  DB_NAME='postgres' \
  DB_USER='your-username' \
  DB_PASSWORD='your-password' \
  JWT_SECRET='your-long-random-secret-key' \
  REDIS_HOST='your-redis-host' \
  REDIS_PORT='6379'
```

### 3. Deploy

```bash
cd api-gateway
flyctl deploy
```

## 📦 Configuration Files

### `fly.toml`
- Main Fly.io configuration
- Configured for GRU (São Paulo) region
- Uses Paketo Java buildpacks

### `api-gateway/fly.toml`
- API Gateway specific configuration
- Custom Dockerfile deployment
- Health checks configured

### `api-gateway/Dockerfile`
- Multi-stage build
- Uses Eclipse Temurin JRE 21
- Health check endpoint configured

## 🔧 Environment Variables

Required environment variables (set via `flyctl secrets set`):

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `db.example.com` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `offme` |
| `DB_USER` | Database username | `offme` |
| `DB_PASSWORD` | Database password | `secure-password` |
| `JWT_SECRET` | JWT signing secret | `long-random-string-1234567890` |
| `REDIS_HOST` | Redis host | `redis.example.com` |
| `REDIS_PORT` | Redis port | `6379` |

## 🎯 Service URLs

The API Gateway expects these internal service URLs (configured in `fly.toml`):

- `IDENTITY_SERVICE_URL=http://identity-service:8081`
- `POST_SERVICE_URL=http://post-service:8082`
- `TIMELINE_SERVICE_URL=http://timeline-service:8083`
- `GRAPH_SERVICE_URL=http://graph-service:8084`
- `NOTIFICATION_SERVICE_URL=http://notification-service:8085`
- `WEBSOCKET_SERVICE_URL=http://websocket-service:8086`

## 🔄 Deployment Scripts

### Build Script
```bash
./build-api-gateway.sh
```

### Deployment Script
```bash
./deploy-flyio.sh
```

## 🌐 Accessing Your Deployment

After successful deployment:
- **API Endpoint**: `https://offme-backend.fly.dev`
- **Health Check**: `https://offme-backend.fly.dev/health`
- **Fly.io Dashboard**: `https://fly.io/apps/offme-backend`

## 🐛 Troubleshooting

### Build Issues
- Ensure Java 21+ is installed: `java -version`
- Ensure SBT is installed: `sbt -version`
- Clean build: `sbt clean`

### Deployment Issues
- Check logs: `flyctl logs`
- Check app status: `flyctl status`
- Restart app: `flyctl restart`

### Database Connection Issues
- Verify secrets: `flyctl secrets list`
- Test connection: `flyctl ssh console -C "nc -zv your-db-host 5432"`

## 📈 Scaling

Scale your application:
```bash
flyctl scale count 2  # Scale to 2 instances
flyctl scale memory 2048  # Increase memory to 2GB
```

## 🔒 Security

- Rotate your JWT secret regularly
- Use Fly.io's built-in TLS/SSL
- Configure proper CORS settings
- Set up database backups

## 🆘 Support

For issues with Fly.io deployment:
- Fly.io Documentation: [https://fly.io/docs](https://fly.io/docs)
- Fly.io Community: [https://community.fly.io](https://community.fly.io)
- OffMe GitHub Issues: [https://github.com/rulio1/OffMe/issues](https://github.com/rulio1/OffMe/issues)

---

**✅ Your backend is now ready for Fly.io deployment!** Just run the build and deployment scripts to complete the setup.
<task_progress>
- [x] Analyze current backend configuration
- [x] Check SBT build setup
- [x] Verify Fly.io configuration
- [x] Create Docker-based build script
- [x] Start Docker daemon
- [x] Install SBT manually
- [x] Create Fly.io deployment script
- [x] Create comprehensive deployment documentation
- [ ] Build locally with SBT
- [ ] Deploy to Fly.io
</task_progress>