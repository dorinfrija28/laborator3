# 🔍 Railway Quick Configuration Check

Based on your Railway Variables screenshot, here's what to verify:

## ✅ What You Have (Good!)
- `NODE_ENV=production` is set ✅
- Railway system variables are available ✅

## ⚠️ What to Check Next

### 1. Verify Start Command (CRITICAL)

Go to **dw1 service** → **Settings** → **Deploy** tab

**Start Command should be:**
```
node dist/warehouse/dwServer.js --port $PORT --server-id dw1
```

**Common mistakes:**
- ❌ `--port 3001` (hardcoded - wrong!)
- ❌ Missing `--port $PORT` argument
- ❌ Wrong path to file

### 2. Check Build Command

**Build Command should be:**
```
npm install && npm run build
```

### 3. Verify PORT is Available

Railway provides `PORT` automatically, but it might not show in Variables UI.

**To verify PORT is working:**
1. Check the deployment logs
2. Look for: `"DW Server configuration"` log message
3. It should show the port number Railway assigned

### 4. Check Deployment Logs

Go to **dw1** → **Deployments** → Click latest deployment → **View Logs**

**Look for:**
- ✅ `"DW Server configuration"` - Shows port and config
- ✅ `"Data Warehouse Server dw1 started successfully"` - Server is running
- ❌ Any error messages before "started successfully"

### 5. For Proxy Service

Go to **proxy service** → **Variables** tab

**Add these variables:**
```
NODE_ENV=production
PROXY_PORT=$PORT
CACHE_TTL_SECONDS=30
DW_SERVERS=https://dw1-production.up.railway.app,https://dw2-production.up.railway.app,https://dw3-production.up.railway.app
```

**To get DW URLs:**
1. Go to each DW service (dw1, dw2, dw3)
2. **Settings** → **Networking**
3. Copy the **Public Domain** URL
4. Use HTTPS (not HTTP)

## 🐛 If ECONNREFUSED Error Persists

The error `connect ECONNREFUSED ::1:3001` suggests:

1. **Server might not be starting:**
   - Check logs for "Server started successfully"
   - If missing, server isn't starting

2. **Port binding issue:**
   - Verify start command uses `$PORT`
   - Check logs show correct port

3. **Railway health check:**
   - Railway might be doing internal health checks
   - The error might be from Railway's system, not your code

## 🔧 Quick Fix Steps

1. **Verify Start Commands:**
   - dw1: `node dist/warehouse/dwServer.js --port $PORT --server-id dw1`
   - dw2: `node dist/warehouse/dwServer.js --port $PORT --server-id dw2`
   - dw3: `node dist/warehouse/dwServer.js --port $PORT --server-id dw3`
   - proxy: `node dist/proxy/proxyServer.js`

2. **Check Logs:**
   - Look for startup messages
   - Verify port numbers are correct

3. **Test Health Endpoint:**
   - After deployment, visit: `https://dw1-production.up.railway.app/health`
   - Should return: `{"status":"ok","server":"dw1",...}`

4. **If still failing:**
   - Share the deployment logs (especially the startup messages)
   - Check if "Server started successfully" appears

## 📸 What to Share for Further Help

If issues persist, share:
1. Screenshot of **Deploy** tab (showing Build/Start commands)
2. Screenshot of **Deployments** → **Logs** (showing startup messages)
3. The actual error from the health endpoint

