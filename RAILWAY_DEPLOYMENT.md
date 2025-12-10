# 🚂 Railway Deployment Guide

Step-by-step guide to deploy the Web Proxy system to Railway.

## 📋 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Railway CLI** (Optional): `npm i -g @railway/cli`

## 🚀 Step-by-Step Deployment

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway will create a new project

### Step 2: Create DW1 Service

1. In your Railway project, click **"+ New"** → **"Service"**
2. Select **"GitHub Repo"** → Choose your repository
3. Name the service: `dw1`
4. Go to **Settings** → **Deploy**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/warehouse/dwServer.js --port $PORT --server-id dw1`
5. Go to **Settings** → **Variables**:
   - Add: `NODE_ENV` = `production`
6. Go to **Settings** → **Networking**:
   - Generate a **Public Domain** (e.g., `dw1-production.up.railway.app`)
   - **Note the URL** - you'll need it for the proxy configuration

### Step 3: Create DW2 Service

1. Click **"+ New"** → **"Service"**
2. Select **"GitHub Repo"** → Choose your repository
3. Name the service: `dw2`
4. Go to **Settings** → **Deploy**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/warehouse/dwServer.js --port $PORT --server-id dw2`
5. Go to **Settings** → **Variables**:
   - Add: `NODE_ENV` = `production`
6. Go to **Settings** → **Networking**:
   - Generate a **Public Domain** (e.g., `dw2-production.up.railway.app`)
   - **Note the URL**

### Step 4: Create DW3 Service

1. Click **"+ New"** → **"Service"**
2. Select **"GitHub Repo"** → Choose your repository
3. Name the service: `dw3`
4. Go to **Settings** → **Deploy**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/warehouse/dwServer.js --port $PORT --server-id dw3`
5. Go to **Settings** → **Variables**:
   - Add: `NODE_ENV` = `production`
6. Go to **Settings** → **Networking**:
   - Generate a **Public Domain** (e.g., `dw3-production.up.railway.app`)
   - **Note the URL**

### Step 5: Create Proxy Service

1. Click **"+ New"** → **"Service"**
2. Select **"GitHub Repo"** → Choose your repository
3. Name the service: `proxy`
4. Go to **Settings** → **Deploy**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/proxy/proxyServer.js`
5. Go to **Settings** → **Variables**:
   - Add: `NODE_ENV` = `production`
   - Add: `PROXY_PORT` = `$PORT` (Railway automatically sets $PORT)
   - Add: `CACHE_TTL_SECONDS` = `30`
   - Add: `DW_SERVERS` = `https://dw1-production.up.railway.app,https://dw2-production.up.railway.app,https://dw3-production.up.railway.app`
     - **Important**: Replace with your actual DW service URLs from Steps 2-4
6. Go to **Settings** → **Networking**:
   - Generate a **Public Domain** (e.g., `proxy-production.up.railway.app`)
   - This is your main application URL!

### Step 6: Deploy All Services

1. Railway will automatically start building and deploying each service
2. Wait for all services to show **"Deployed"** status (green checkmark)
3. Check logs if any service fails:
   - Click on the service → **"Deployments"** → Click on latest deployment → **"View Logs"**

## 🔧 Configuration Summary

### DW Services (dw1, dw2, dw3)
```
Build Command: npm install && npm run build
Start Command: node dist/warehouse/dwServer.js --port $PORT --server-id dw1
Environment Variables:
  - NODE_ENV=production
```

### Proxy Service
```
Build Command: npm install && npm run build
Start Command: node dist/proxy/proxyServer.js
Environment Variables:
  - NODE_ENV=production
  - PROXY_PORT=$PORT
  - CACHE_TTL_SECONDS=30
  - DW_SERVERS=https://dw1-production.up.railway.app,https://dw2-production.up.railway.app,https://dw3-production.up.railway.app
```

## ✅ Verification

1. **Check DW Services**:
   - Visit: `https://dw1-production.up.railway.app/health`
   - Should return: `{"status":"ok","server":"dw1",...}`

2. **Check Proxy Service**:
   - Visit: `https://proxy-production.up.railway.app`
   - Should show the web interface
   - Visit: `https://proxy-production.up.railway.app/metrics`
   - Should show proxy metrics

3. **Test CRUD Operations**:
   - Use the web interface at your proxy URL
   - Create, read, update, delete employees
   - Check that load balancing works (see metrics)

## 🐛 Troubleshooting

### Service Won't Start

1. **Check Build Logs**:
   - Click service → Deployments → Latest → View Logs
   - Look for build errors

2. **Common Issues**:
   - **"Cannot find module"**: Make sure `npm install` runs in build command
   - **"Port already in use"**: Railway sets `$PORT` automatically, don't hardcode ports
   - **"ENOENT"**: Make sure build command creates `dist/` folder

### Services Can't Communicate

1. **Check DW_SERVERS Variable**:
   - Ensure URLs are correct (with `https://`)
   - No trailing slashes
   - URLs are comma-separated (no spaces)

2. **Check Service Status**:
   - All services should be "Deployed" (green)
   - If one is down, others won't work

3. **Check Logs**:
   - Look for connection errors in proxy logs
   - Look for startup errors in DW logs

### Build Fails

1. **TypeScript Errors**:
   - Check that `tsconfig.json` is correct
   - Ensure all dependencies are in `package.json`

2. **Missing Files**:
   - Make sure `public/` folder is included (for web interface)
   - Check `.gitignore` doesn't exclude needed files

## 📊 Monitoring

### View Logs
- Click on any service → **"Deployments"** → **"View Logs"**
- Or use Railway CLI: `railway logs`

### View Metrics
- Visit: `https://your-proxy-url/metrics`
- Shows: cache hits, load distribution, response times

### Railway Dashboard
- View resource usage
- Check deployment history
- Monitor service health

## 💰 Cost Considerations

- **Free Tier**: Railway offers free tier with limited usage
- **Hobby Plan**: $5/month for more resources
- **4 Services**: Each service counts separately
- **Recommendation**: Start with free tier, upgrade if needed

## 🔄 Updating Deployment

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Update code"
   git push
   ```

2. **Railway Auto-Deploys**:
   - Railway watches your GitHub repo
   - Automatically redeploys on push to main/master branch

3. **Manual Redeploy**:
   - Click service → **"Deployments"** → **"Redeploy"**

## 🎯 Quick Reference

| Service | Build Command | Start Command | Key Variables |
|---------|--------------|---------------|---------------|
| dw1 | `npm install && npm run build` | `node dist/warehouse/dwServer.js --port $PORT --server-id dw1` | `NODE_ENV=production` |
| dw2 | `npm install && npm run build` | `node dist/warehouse/dwServer.js --port $PORT --server-id dw2` | `NODE_ENV=production` |
| dw3 | `npm install && npm run build` | `node dist/warehouse/dwServer.js --port $PORT --server-id dw3` | `NODE_ENV=production` |
| proxy | `npm install && npm run build` | `node dist/proxy/proxyServer.js` | `PROXY_PORT=$PORT`, `DW_SERVERS=...`, `CACHE_TTL_SECONDS=30` |

## 📝 Notes

- Railway automatically provides `$PORT` environment variable
- Use `$PORT` in start commands, don't hardcode port numbers
- All services must be deployed before proxy will work
- Update `DW_SERVERS` after getting actual URLs from Railway
- Railway provides HTTPS automatically (no SSL configuration needed)

## 🆘 Need Help?

- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Check service logs for detailed error messages

