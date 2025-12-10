# Railway Deployment Guide with PostgreSQL

Complete step-by-step guide for deploying the distributed web proxy system to Railway with database synchronization.

## 🎯 Overview

This guide will help you deploy:
- **1 PostgreSQL Database** (shared by all DW servers)
- **3 Data Warehouse Servers** (dw1, dw2, dw3)
- **1 Reverse Proxy Server** (proxy)

All services will be connected and data will be synchronized across all DW servers.

---

## 📋 Prerequisites

1. **Railway Account**: Sign up at https://railway.app
2. **Railway CLI** (optional): `npm i -g @railway/cli`
3. **GitHub Repository**: Your code should be in a GitHub repo
4. **Node.js 18+**: For local testing

---

## 🚀 Step-by-Step Deployment

### Step 1: Create a New Railway Project

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway will create a new project

### Step 2: Create PostgreSQL Database Service

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will create a PostgreSQL service
4. **Important**: Note the service name (e.g., `postgres`)

### Step 3: Get Database Connection Details

1. Click on the **PostgreSQL service**
2. Go to **"Variables"** tab
3. Railway automatically provides these variables:
   - `PGHOST` - Database host
   - `PGPORT` - Database port (usually 5432)
   - `PGDATABASE` - Database name
   - `PGUSER` - Database user
   - `PGPASSWORD` - Database password
   - `DATABASE_URL` - Full connection string

**Note**: Railway uses different variable names. We need to map them to our app's expected variables.

### Step 4: Create DW1 Service

1. In Railway project, click **"+ New"**
2. Select **"GitHub Repo"** → Choose your repo
3. Service name: `dw1`
4. Configure the service:

   **Settings Tab:**
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/warehouse/dwServer.js --server-id dw1`
   - **Root Directory**: `/` (default)

   **Variables Tab:**
   Add these environment variables:
   ```env
   NODE_ENV=production
   SERVER_ID=dw1
   DB_HOST=${{Postgres.PGHOST}}
   DB_PORT=${{Postgres.PGPORT}}
   DB_NAME=${{Postgres.PGDATABASE}}
   DB_USER=${{Postgres.PGUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}
   ```

   **Note**: Replace `Postgres` with your actual PostgreSQL service name if different.

### Step 5: Create DW2 Service

1. Click **"+ New"** → **"GitHub Repo"** → Your repo
2. Service name: `dw2`
3. Configure:

   **Settings Tab:**
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/warehouse/dwServer.js --server-id dw2`
   - **Root Directory**: `/`

   **Variables Tab:**
   ```env
   NODE_ENV=production
   SERVER_ID=dw2
   DB_HOST=${{Postgres.PGHOST}}
   DB_PORT=${{Postgres.PGPORT}}
   DB_NAME=${{Postgres.PGDATABASE}}
   DB_USER=${{Postgres.PGUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}
   ```

### Step 6: Create DW3 Service

1. Click **"+ New"** → **"GitHub Repo"** → Your repo
2. Service name: `dw3`
3. Configure:

   **Settings Tab:**
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/warehouse/dwServer.js --server-id dw3`
   - **Root Directory**: `/`

   **Variables Tab:**
   ```env
   NODE_ENV=production
   SERVER_ID=dw3
   DB_HOST=${{Postgres.PGHOST}}
   DB_PORT=${{Postgres.PGPORT}}
   DB_NAME=${{Postgres.PGDATABASE}}
   DB_USER=${{Postgres.PGUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}
   ```

### Step 7: Create Proxy Service

1. Click **"+ New"** → **"GitHub Repo"** → Your repo
2. Service name: `proxy`
3. Configure:

   **Settings Tab:**
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/proxy/proxyServer.js`
   - **Root Directory**: `/`

   **Variables Tab:**
   ```env
   NODE_ENV=production
   PROXY_PORT=$PORT
   CACHE_TTL_SECONDS=30
   DW_SERVERS=https://dw1-production.up.railway.app,https://dw2-production.up.railway.app,https://dw3-production.up.railway.app
   ```

   **Important**: 
   - Replace the `DW_SERVERS` URLs with your actual Railway service URLs
   - You'll get these URLs after deploying each DW service
   - Format: `https://<service-name>-<branch>.up.railway.app`

### Step 8: Get Service URLs

After each service deploys:

1. Click on the service (dw1, dw2, dw3, proxy)
2. Go to **"Settings"** tab
3. Find **"Public Domain"** or **"Generate Domain"**
4. Copy the URL (e.g., `https://dw1-production.up.railway.app`)

### Step 9: Update Proxy Configuration

1. Go to **proxy** service → **Variables** tab
2. Update `DW_SERVERS` with your actual URLs:
   ```env
   DW_SERVERS=https://dw1-production.up.railway.app,https://dw2-production.up.railway.app,https://dw3-production.up.railway.app
   ```
3. Save changes (Railway will redeploy automatically)

---

## 🔧 Alternative: Using Railway's Reference Syntax

Railway provides a better way to reference variables from other services:

### For Database Connection (DW Services)

Instead of manually copying values, use Railway's reference syntax:

```env
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
```

**How to use:**
1. In the service's **Variables** tab
2. Click **"+ New Variable"**
3. For **Value**, click the **"Reference"** button
4. Select the PostgreSQL service
5. Select the variable (e.g., `PGHOST`)
6. Railway will automatically create the reference

### For DW Server URLs (Proxy Service)

You can also reference service URLs:

```env
DW_SERVERS=${{dw1.PUBLIC_DOMAIN}},${{dw2.PUBLIC_DOMAIN}},${{dw3.PUBLIC_DOMAIN}}
```

**Note**: This might not work directly. You may need to manually construct the URLs.

---

## 📝 Complete Environment Variables Reference

### PostgreSQL Service (Auto-configured by Railway)

Railway automatically provides:
- `PGHOST` - Database host
- `PGPORT` - Database port
- `PGDATABASE` - Database name
- `PGUSER` - Database user
- `PGPASSWORD` - Database password
- `DATABASE_URL` - Full connection string

### DW1, DW2, DW3 Services

**Required Variables:**
```env
NODE_ENV=production
SERVER_ID=dw1          # dw1, dw2, or dw3
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
```

**Optional Variables:**
```env
LOG_LEVEL=info
```

### Proxy Service

**Required Variables:**
```env
NODE_ENV=production
PROXY_PORT=$PORT
CACHE_TTL_SECONDS=30
DW_SERVERS=https://dw1-production.up.railway.app,https://dw2-production.up.railway.app,https://dw3-production.up.railway.app
```

**Optional Variables:**
```env
LOG_LEVEL=info
```

---

## 🧪 Testing the Deployment

### 1. Check Service Health

Test each DW server:
```bash
curl https://dw1-production.up.railway.app/health
curl https://dw2-production.up.railway.app/health
curl https://dw3-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "server": "dw1",
  "port": 8080,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Test Database Connection

Check if database is working:
```bash
# Create an employee
curl -X POST https://proxy-production.up.railway.app/employees \
  -H "Content-Type: application/json" \
  -d '{"firstName": "John", "lastName": "Doe", "position": "Developer", "salary": 75000}'

# Fetch employees (should return the created employee)
curl https://proxy-production.up.railway.app/employees?format=json
```

### 3. Test Data Synchronization

Make multiple requests to see load balancing:
```bash
# Request 1 - might go to DW1
curl https://proxy-production.up.railway.app/employees?format=json

# Request 2 - might go to DW2
curl https://proxy-production.up.railway.app/employees?format=json

# Request 3 - might go to DW3
curl https://proxy-production.up.railway.app/employees?format=json
```

**Expected**: All requests return the same data (proving database synchronization works!)

### 4. Test Web Interface

1. Open your proxy URL in browser: `https://proxy-production.up.railway.app`
2. Create an employee
3. Refresh the list
4. Switch between JSON and XML formats
5. All should work correctly!

---

## 🐛 Troubleshooting

### Database Connection Failed

**Error**: `Database connection failed. Server will not start.`

**Solutions:**
1. Check PostgreSQL service is running (green status)
2. Verify variable references are correct:
   - Service name matches (e.g., `Postgres` vs `postgres`)
   - All DB_* variables are set
3. Check Railway logs for connection errors
4. Verify database credentials in PostgreSQL service variables

### Service Not Starting

**Error**: Service shows "Failed" or "Crashed"

**Solutions:**
1. Check **Logs** tab for error messages
2. Verify **Build Command** is correct: `npm install && npm run build`
3. Verify **Start Command** is correct
4. Check that `dist/` folder exists after build
5. Ensure all dependencies are in `package.json`

### DW Servers Can't Connect to Database

**Error**: `connect ECONNREFUSED` or `timeout`

**Solutions:**
1. Verify database service name in references
2. Check that PostgreSQL service is in the same Railway project
3. Ensure all DW services have database variables set
4. Check Railway network connectivity

### Proxy Can't Reach DW Servers

**Error**: `NetworkError` or `ECONNREFUSED` in proxy logs

**Solutions:**
1. Verify `DW_SERVERS` URLs are correct
2. Check that all DW services have public domains
3. Ensure URLs use `https://` (not `http://`)
4. Verify service names match (dw1, dw2, dw3)

### Build Fails

**Error**: Build command fails

**Solutions:**
1. Check **Logs** tab for specific error
2. Verify `package.json` has all dependencies
3. Ensure TypeScript compiles: `npm run build` works locally
4. Check Node.js version (Railway uses Node 18+ by default)

### Data Not Synchronizing

**Symptoms**: Different data on different DW servers

**Solutions:**
1. Verify all DW services use the same database variables
2. Check database connection in logs
3. Test database directly (use Railway's PostgreSQL connection)
4. Verify `DB_HOST`, `DB_NAME`, etc. are identical across all DW services

---

## 📊 Monitoring

### View Logs

1. Click on any service
2. Go to **"Logs"** tab
3. See real-time logs

### Check Metrics

Access proxy metrics:
```bash
curl https://proxy-production.up.railway.app/metrics
```

### Database Monitoring

1. Click on PostgreSQL service
2. Go to **"Metrics"** tab
3. See connection count, query performance, etc.

---

## 🔄 Updating Services

### Update Code

1. Push changes to GitHub
2. Railway automatically redeploys all services
3. Check **"Deployments"** tab for status

### Update Environment Variables

1. Go to service → **Variables** tab
2. Edit or add variables
3. Railway automatically redeploys

### Manual Redeploy

1. Go to service → **Settings** tab
2. Click **"Redeploy"**

---

## 💰 Cost Considerations

**Free Tier:**
- $5 credit per month
- PostgreSQL: ~$5/month
- Each web service: ~$0.50/month
- Total: ~$7/month (may exceed free tier)

**Recommendations:**
- Start with 2 DW servers instead of 3
- Use Railway's free PostgreSQL (if available)
- Monitor usage in Railway dashboard

---

## ✅ Deployment Checklist

- [ ] Created Railway project
- [ ] Created PostgreSQL service
- [ ] Created DW1 service with database variables
- [ ] Created DW2 service with database variables
- [ ] Created DW3 service with database variables
- [ ] Created Proxy service with DW_SERVERS URLs
- [ ] All services deployed successfully
- [ ] Health checks pass for all DW servers
- [ ] Database connection working
- [ ] Data synchronization tested
- [ ] Web interface accessible
- [ ] Proxy metrics endpoint working

---

## 🎉 Success!

Once all services are deployed and working:

1. **All DW servers** connect to the same PostgreSQL database
2. **Data is synchronized** across all servers
3. **Load balancing** distributes requests evenly
4. **Caching** improves response times
5. **Web interface** works correctly

Your distributed system is now live on Railway! 🚀

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway PostgreSQL Guide](https://docs.railway.app/databases/postgresql)
- [Railway Environment Variables](https://docs.railway.app/variables)

---

**Need Help?** Check the logs, verify environment variables, and ensure all services are in the same Railway project.

