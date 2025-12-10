# 🔧 Railway ECONNREFUSED Fix

## The Problem

All services are showing: `"connect ECONNREFUSED ::1:3001"` (or similar ports)

This error suggests:
1. Railway's health check system is trying to connect
2. The server might not be starting correctly
3. There might be a port binding issue

## Solution

I've added:
1. ✅ Server binding to `0.0.0.0` (allows external connections)
2. ✅ Better error handling and logging
3. ✅ Port validation
4. ✅ Server error handlers

## Critical Check: Railway Start Commands

**VERIFY YOUR RAILWAY START COMMANDS ARE CORRECT:**

### For DW Services (dw1, dw2, dw3):
```
Start Command: node dist/warehouse/dwServer.js --port $PORT --server-id dw1
```

**IMPORTANT:** 
- Use `$PORT` (Railway's environment variable)
- Don't hardcode port numbers
- The `--port $PORT` argument will override the default

### For Proxy Service:
```
Start Command: node dist/proxy/proxyServer.js
```

**IMPORTANT:**
- No port argument needed (uses `PROXY_PORT` or `$PORT` env var)
- Make sure `PROXY_PORT=$PORT` is set in environment variables

## Verify Environment Variables

### DW Services:
- `NODE_ENV=production`
- `PORT` is automatically set by Railway (don't set manually)

### Proxy Service:
- `NODE_ENV=production`
- `PROXY_PORT=$PORT` (or just use `$PORT`)
- `DW_SERVERS=https://dw1-url,https://dw2-url,https://dw3-url`
- `CACHE_TTL_SECONDS=30`

## Debugging Steps

1. **Check Railway Logs:**
   - Look for "Server started successfully" message
   - Check for any error messages before that

2. **Verify Build:**
   - Check that `dist/` folder is created
   - Verify TypeScript compiled without errors

3. **Test Locally First:**
   ```bash
   npm run build
   PORT=3001 node dist/warehouse/dwServer.js --port 3001 --server-id dw1
   # Should see: "Data Warehouse Server dw1 started successfully"
   ```

4. **Check Railway Deployment:**
   - Ensure all services show "Deployed" (green)
   - Check that build completed successfully
   - Look at runtime logs (not just build logs)

## If Still Failing

The error might be from Railway's internal health checks. Try:

1. **Disable Railway Health Checks** (temporarily):
   - Go to service → Settings → Health
   - Disable health checks temporarily
   - See if server starts

2. **Check if server is actually running:**
   - Look for "Server started" in logs
   - If you don't see it, the server isn't starting

3. **Verify the start command:**
   - Make sure it's exactly: `node dist/warehouse/dwServer.js --port $PORT --server-id dw1`
   - No extra spaces or characters

4. **Check Railway's PORT variable:**
   - Railway should set `$PORT` automatically
   - Don't override it manually

## Quick Fix Checklist

- [ ] All services use `$PORT` in start command (for DW services)
- [ ] Proxy service has `PROXY_PORT=$PORT` environment variable
- [ ] All services show "Deployed" status
- [ ] Build logs show no errors
- [ ] Runtime logs show "Server started successfully"
- [ ] `dist/` folder exists after build

