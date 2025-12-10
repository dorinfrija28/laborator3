# 🔧 Railway Deployment Troubleshooting

## Common Issues and Solutions

### Issue 1: NetworkError when fetching employees

**Symptoms:**
- Web interface shows "NetworkError" or "Failed to fetch"
- Proxy logs show 500 errors from DW servers
- `/favicon.ico` requests return 500

**Causes:**
1. DW servers not running or not accessible
2. Incorrect DW_SERVERS URLs in proxy environment variables
3. CORS issues
4. Static file requests being forwarded to DW servers

**Solutions:**

1. **Verify DW servers are running:**
   ```bash
   # Check each DW service in Railway dashboard
   # Visit: https://dw1-production.up.railway.app/health
   # Should return: {"status":"ok","server":"dw1",...}
   ```

2. **Check DW_SERVERS environment variable:**
   - Go to Proxy service → Settings → Variables
   - Verify `DW_SERVERS` has correct URLs
   - Format: `https://dw1-url,https://dw2-url,https://dw3-url`
   - No spaces, no trailing slashes
   - All URLs must be HTTPS (Railway provides HTTPS)

3. **Verify all services are deployed:**
   - All 4 services should show "Deployed" status (green)
   - Check deployment logs for any errors

4. **Test DW servers directly:**
   ```bash
   curl https://dw1-production.up.railway.app/health
   curl https://dw2-production.up.railway.app/health
   curl https://dw3-production.up.railway.app/health
   ```

### Issue 2: 500 errors from DW servers

**Symptoms:**
- Proxy logs show: `"statusCode":500` from DW servers
- Requests to `/employees` fail

**Causes:**
1. DW server not started properly
2. Build errors
3. Missing environment variables
4. Port configuration issues

**Solutions:**

1. **Check DW server logs:**
   - Click on DW service → Deployments → View Logs
   - Look for startup errors
   - Look for "Server started" message

2. **Verify build succeeded:**
   - Check build logs for TypeScript errors
   - Ensure `dist/` folder is created

3. **Check start command:**
   - Should be: `node dist/warehouse/dwServer.js --port $PORT --server-id dw1`
   - Verify `$PORT` is used (Railway provides this)

4. **Verify environment variables:**
   - `NODE_ENV=production` should be set

### Issue 3: CORS errors in browser

**Symptoms:**
- Browser console shows CORS errors
- Requests blocked by browser

**Solutions:**
- The proxy now includes CORS headers automatically
- Redeploy the proxy service after the latest code update
- Clear browser cache and try again

### Issue 4: Static files not loading

**Symptoms:**
- Web interface doesn't load
- 404 errors for CSS/JS files

**Solutions:**

1. **Verify public folder is included:**
   - Check that `public/index.html` exists in your repo
   - Railway should include it in the build

2. **Check build logs:**
   - Ensure no errors during build
   - Verify all files are copied

3. **Test static file serving:**
   - Visit: `https://proxy-url/` (should show web interface)
   - If 404, check that `public/` folder is in repository

### Issue 5: Services can't communicate

**Symptoms:**
- Proxy can't reach DW servers
- Connection timeout errors

**Solutions:**

1. **Verify URLs are correct:**
   - Use HTTPS (not HTTP)
   - Use Railway-generated domains
   - No trailing slashes

2. **Check Railway networking:**
   - All services should be in the same project
   - Railway services can communicate via public domains

3. **Test connectivity:**
   - From proxy logs, check if requests reach DW servers
   - Check DW server logs to see if requests arrive

## Debugging Steps

### Step 1: Check Service Status

1. Go to Railway dashboard
2. Verify all 4 services show "Deployed" (green)
3. If any show "Failed" (red), check logs

### Step 2: Test Each Service Individually

```bash
# Test DW1
curl https://dw1-production.up.railway.app/health

# Test DW2
curl https://dw2-production.up.railway.app/health

# Test DW3
curl https://dw3-production.up.railway.app/health

# Test Proxy
curl https://proxy-production.up.railway.app/metrics
```

### Step 3: Check Logs

1. **Proxy Logs:**
   - Look for "Forwarding request" messages
   - Check for error messages
   - Verify which DW server is being contacted

2. **DW Server Logs:**
   - Look for "Server started" message
   - Check for request logs
   - Look for error messages

### Step 4: Verify Environment Variables

**Proxy Service:**
```
NODE_ENV=production
PROXY_PORT=$PORT
CACHE_TTL_SECONDS=30
DW_SERVERS=https://dw1-url,https://dw2-url,https://dw3-url
```

**DW Services:**
```
NODE_ENV=production
```

### Step 5: Test API Endpoints

```bash
# Test via proxy
curl https://proxy-url/employees?format=json

# Test directly on DW
curl https://dw1-url/employees?format=json
```

## Quick Fixes

### Fix 1: Redeploy All Services

1. Go to each service in Railway
2. Click "Deployments" → "Redeploy"
3. Wait for all to complete

### Fix 2: Update DW_SERVERS

1. Get actual URLs from Railway (Settings → Networking)
2. Update `DW_SERVERS` in proxy service
3. Redeploy proxy service

### Fix 3: Check Build Commands

Ensure all services have:
- **Build Command**: `npm install && npm run build`
- **Start Command**: Correct for each service type

### Fix 4: Clear Cache

If issues persist:
1. Clear browser cache
2. Try incognito/private mode
3. Check proxy metrics: `https://proxy-url/metrics`

## Getting Help

1. **Check Railway Logs:**
   - Most issues show up in deployment or runtime logs

2. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Check Network tab for failed requests

3. **Verify Code:**
   - Ensure latest code is pushed to GitHub
   - Railway auto-deploys on push

4. **Railway Support:**
   - Railway Discord: [discord.gg/railway](https://discord.gg/railway)
   - Railway Docs: [docs.railway.app](https://docs.railway.app)

## Prevention

1. **Test Locally First:**
   ```bash
   npm run build
   npm run start:dw1
   npm run start:proxy
   ```

2. **Verify Before Deploying:**
   - All services build successfully
   - No TypeScript errors
   - All dependencies in package.json

3. **Monitor After Deployment:**
   - Check all service logs
   - Test all endpoints
   - Verify metrics endpoint

