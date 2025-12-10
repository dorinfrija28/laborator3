# Cloud Deployment Guide

This guide covers deploying the Web Proxy project to various cloud platforms.

## 🐳 Docker Deployment (Recommended)

### Prerequisites
- Docker and Docker Compose installed
- Git (to clone the repository)

### Local Docker Deployment

1. **Build and start all services:**
   ```bash
   npm run docker:build
   npm run docker:up
   ```

2. **View logs:**
   ```bash
   npm run docker:logs
   ```

3. **Stop services:**
   ```bash
   npm run docker:down
   ```

4. **Access the application:**
   - Web Interface: http://localhost:8080
   - DW Server 1: http://localhost:3001
   - DW Server 2: http://localhost:3002
   - DW Server 3: http://localhost:3003
   - Proxy Metrics: http://localhost:8080/metrics

### Production Docker Deployment

For production, you may want to:
- Use environment-specific docker-compose files
- Set up proper logging and monitoring
- Configure health checks
- Use secrets management

## ☁️ Cloud Platform Deployments

### Option 1: Railway (Easiest)

Railway is great for quick deployments with minimal configuration.

1. **Sign up at [railway.app](https://railway.app)**

2. **Create a new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo" (or upload code)

3. **Configure services:**
   - Add 4 services: `dw1`, `dw2`, `dw3`, and `proxy`
   - For each DW service, set:
     - Build Command: `npm run build`
     - Start Command: `node dist/warehouse/dwServer.js --port $PORT --server-id dw1` (adjust for each)
   - For proxy service, set:
     - Build Command: `npm run build`
     - Start Command: `node dist/proxy/proxyServer.js`
     - Environment Variables:
       ```
       PROXY_PORT=$PORT
       DW_SERVERS=https://dw1-production.up.railway.app,https://dw2-production.up.railway.app,https://dw3-production.up.railway.app
       CACHE_TTL_SECONDS=30
       ```

4. **Deploy:**
   - Railway will automatically build and deploy
   - Get the public URL from the proxy service

### Option 2: Render

1. **Sign up at [render.com](https://render.com)**

2. **Create Web Services:**
   - Create 4 separate Web Services
   - Connect your GitHub repository

3. **Configure each service:**

   **DW1 Service:**
   - Build Command: `npm install && npm run build`
   - Start Command: `node dist/warehouse/dwServer.js --port $PORT --server-id dw1`
   - Environment: `NODE_ENV=production`

   **DW2 Service:**
   - Build Command: `npm install && npm run build`
   - Start Command: `node dist/warehouse/dwServer.js --port $PORT --server-id dw2`
   - Environment: `NODE_ENV=production`

   **DW3 Service:**
   - Build Command: `npm install && npm run build`
   - Start Command: `node dist/warehouse/dwServer.js --port $PORT --server-id dw3`
   - Environment: `NODE_ENV=production`

   **Proxy Service:**
   - Build Command: `npm install && npm run build`
   - Start Command: `node dist/proxy/proxyServer.js`
   - Environment Variables:
     ```
     PROXY_PORT=$PORT
     DW_SERVERS=https://dw1.onrender.com,https://dw2.onrender.com,https://dw3.onrender.com
     CACHE_TTL_SECONDS=30
     NODE_ENV=production
     ```

### Option 3: AWS (EC2/ECS)

#### Using AWS EC2:

1. **Launch EC2 instances:**
   - Launch 4 t2.micro instances (or larger)
   - Configure security groups to allow:
     - Port 8080 (proxy)
     - Ports 3001-3003 (DW servers)
     - SSH (port 22)

2. **Install Docker on each instance:**
   ```bash
   sudo yum update -y
   sudo yum install docker -y
   sudo service docker start
   sudo usermod -a -G docker ec2-user
   ```

3. **Clone and deploy:**
   ```bash
   git clone <your-repo-url>
   cd laborator3
   docker-compose up -d
   ```

#### Using AWS ECS (Container Service):

1. **Build and push Docker images:**
   ```bash
   # Build images
   docker build -f Dockerfile.dw -t your-ecr-repo/dw:latest .
   docker build -f Dockerfile -t your-ecr-repo/proxy:latest .
   
   # Push to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
   docker push your-ecr-repo/dw:latest
   docker push your-ecr-repo/proxy:latest
   ```

2. **Create ECS Task Definitions** for each service

3. **Create ECS Services** and configure networking

### Option 4: Google Cloud Platform (GCP)

1. **Create a GCP project**

2. **Enable Cloud Run API**

3. **Deploy using Cloud Run:**
   ```bash
   # Build and push to Container Registry
   gcloud builds submit --tag gcr.io/PROJECT_ID/dw
   gcloud builds submit --tag gcr.io/PROJECT_ID/proxy
   
   # Deploy DW services
   gcloud run deploy dw1 --image gcr.io/PROJECT_ID/dw --platform managed --port 3001
   gcloud run deploy dw2 --image gcr.io/PROJECT_ID/dw --platform managed --port 3002
   gcloud run deploy dw3 --image gcr.io/PROJECT_ID/dw --platform managed --port 3003
   
   # Deploy proxy
   gcloud run deploy proxy --image gcr.io/PROJECT_ID/proxy --platform managed --port 8080
   ```

### Option 5: DigitalOcean App Platform

1. **Create App Spec** (`app.yaml`):
   ```yaml
   name: web-proxy-system
   services:
   - name: dw1
     github:
       repo: your-username/your-repo
       branch: main
     run_command: npm run build && node dist/warehouse/dwServer.js --port $PORT --server-id dw1
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
   
   - name: dw2
     github:
       repo: your-username/your-repo
       branch: main
     run_command: npm run build && node dist/warehouse/dwServer.js --port $PORT --server-id dw2
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
   
   - name: dw3
     github:
       repo: your-username/your-repo
       branch: main
     run_command: npm run build && node dist/warehouse/dwServer.js --port $PORT --server-id dw3
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
   
   - name: proxy
     github:
       repo: your-username/your-repo
       branch: main
     run_command: npm run build && node dist/proxy/proxyServer.js
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: PROXY_PORT
       value: "8080"
     - key: DW_SERVERS
       value: "https://dw1.ondigitalocean.app,https://dw2.ondigitalocean.app,https://dw3.ondigitalocean.app"
   ```

2. **Deploy via DigitalOcean dashboard or CLI**

## 🔧 Environment Variables

### Proxy Server:
- `PROXY_PORT` - Port for proxy server (default: 8080)
- `DW_SERVERS` - Comma-separated list of DW server URLs
- `CACHE_TTL_SECONDS` - Cache time-to-live in seconds (default: 30)
- `NODE_ENV` - Set to `production` for production

### DW Servers:
- `PORT` - Server port (usually set by platform)
- `NODE_ENV` - Set to `production` for production

## 📝 Pre-Deployment Checklist

- [ ] Update `DW_SERVERS` environment variable with actual URLs
- [ ] Ensure all services can communicate (check firewall/security groups)
- [ ] Set `NODE_ENV=production`
- [ ] Test locally with Docker Compose
- [ ] Configure proper logging
- [ ] Set up health checks
- [ ] Configure monitoring/alerting
- [ ] Set up SSL/TLS certificates (HTTPS)
- [ ] Configure CORS if needed
- [ ] Set up backup strategy for data (if using persistent storage)

## 🔒 Security Considerations

1. **Use HTTPS** - Configure SSL/TLS certificates
2. **Environment Variables** - Never commit secrets to git
3. **Firewall Rules** - Restrict access to necessary ports only
4. **Rate Limiting** - Consider adding rate limiting to the proxy
5. **Authentication** - Add authentication if exposing publicly

## 📊 Monitoring

Consider setting up:
- Application logs (CloudWatch, Datadog, etc.)
- Error tracking (Sentry, Rollbar)
- Performance monitoring (New Relic, AppDynamics)
- Uptime monitoring (Pingdom, UptimeRobot)

## 🚀 Quick Start Commands

```bash
# Build Docker images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

## 🆘 Troubleshooting

### Services can't communicate:
- Check network configuration
- Verify environment variables (especially DW_SERVERS URLs)
- Check firewall/security group rules

### Port conflicts:
- Update port mappings in docker-compose.yml
- Update environment variables

### Build failures:
- Ensure Node.js 18+ is available
- Check TypeScript compilation errors
- Verify all dependencies are in package.json

