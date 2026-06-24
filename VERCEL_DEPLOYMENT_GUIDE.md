# OffMe Vercel Deployment Guide (Vercel-Only)

## 🚀 Full Vercel Deployment Configuration

This guide explains how to deploy both the frontend and backend services to Vercel.

### What Changed

1. **Updated `vercel.json`**: Changed service URLs from Railway service names (`identity-service:8081`) to `localhost` ports for Vercel container communication
2. **Updated `deploy-vercel.sh`**: Added backend deployment support with `--backend` flag
3. **Environment variables**: Added all required backend service URLs to the deployment script

### New Deployment Options

#### Option 1: Frontend Only (Original)
```bash
make deploy-vercel
```

#### Option 2: Full Stack (Frontend + Backend)
```bash
# Using environment variable
DEPLOY_BACKEND=y make deploy-vercel

# Or using flag
make deploy-vercel --backend
```

### Required Vercel Environment Variables

For full Vercel deployment, you need to configure these variables in your Vercel project settings:

- `DATABASE_URL` - PostgreSQL connection string
- `DATABASE_SSL` - Set to `true`
- `JWT_SECRET` - Your JWT secret key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL (or alternative storage)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase public key
- `IMGBB_API_KEY` - Image hosting API key (or S3 credentials)
- `IDENTITY_SERVICE_URL` - `http://localhost:8081`
- `POST_SERVICE_URL` - `http://localhost:8082`
- `TIMELINE_SERVICE_URL` - `http://localhost:8083`
- `GRAPH_SERVICE_URL` - `http://localhost:8084`
- `NOTIFICATION_SERVICE_URL` - `http://localhost:8085`
- `WEBSOCKET_SERVICE_URL` - `http://localhost:8086`

### How It Works

1. **Container Communication**: When deployed to Vercel, all backend services run as containers and can communicate via `localhost` ports
2. **Routing**: The API Gateway routes requests to the appropriate backend services
3. **Frontend**: Next.js frontend serves static files and communicates with the API Gateway

### Deployment Process

1. **Build**: All Scala services are compiled and packaged into Docker images
2. **Deploy**: Vercel deploys all containers (frontend + backend services)
3. **Routing**: Vercel routes API requests to the API Gateway container
4. **Service Communication**: API Gateway communicates with other services via localhost

### Benefits of Vercel-Only Deployment

- ✅ **Simplified deployment**: Single platform for all services
- ✅ **Unified monitoring**: All services visible in Vercel dashboard
- ✅ **Consistent scaling**: All services scale together
- ✅ **Simplified CI/CD**: Single deployment pipeline
- ✅ **Cost optimization**: Pay only for what you use

### Migration from Hybrid to Vercel-Only

If you're migrating from the hybrid Railway+Vercel setup:

1. Update your Vercel environment variables as shown above
2. Remove Railway-specific variables
3. Use the new deployment commands
4. Test thoroughly before switching production traffic

### Troubleshooting

**Issue: Services can't communicate**
- Verify all environment variables are set correctly
- Check Vercel container logs for startup errors
- Ensure all services are using the correct localhost ports

**Issue: Database connection fails**
- Verify `DATABASE_URL` is correct
- Check that `DATABASE_SSL=true` is set
- Test database connection locally first

**Issue: Deployment fails**
- Check `vercel deploy --prod` output for errors
- Verify all Dockerfiles build successfully
- Ensure you have sufficient Vercel resources

### Notes

- The WebSocket service will be available at `wss://your-app.vercel.app/ws`
- API endpoints are available at `https://your-app.vercel.app/api/v1/*`
- Frontend is served from the root domain

For more advanced configurations, refer to the main `DEPLOY_GUIDE.md`.