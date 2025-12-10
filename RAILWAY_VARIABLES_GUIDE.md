# Railway Environment Variables Guide

## ✅ Required Variables for Each Service

### DW1, DW2, DW3 Services

**Required:**
- `NODE_ENV=production` ✅ (You have this)

**Automatically Provided by Railway:**
- `PORT` - Railway sets this automatically (don't add manually)
- `RAILWAY_PUBLIC_DOMAIN` - Public URL
- `RAILWAY_PRIVATE_DOMAIN` - Private DNS name
- Other Railway system variables

**Optional (for debugging):**
- `SERVER_ID=dw1` (or dw2, dw3) - Can be set, but command line argument works too
- `LOG_LEVEL=info` - For more detailed logs

### Proxy Service

**Required:**
- `NODE_ENV=production`
- `PROXY_PORT=$PORT` - Use Railway's PORT variable
- `DW_SERVERS=https://dw1-production.up.railway.app,https://dw2-production.up.railway.app,https://dw3-production.up.railway.app`
  - **Important:** Replace with your actual Railway URLs
- `CACHE_TTL_SECONDS=30`

**Automatically Provided by Railway:**
- `PORT` - Railway sets this automatically

## 🔍 How to Get DW Server URLs

1. Go to each DW service (dw1, dw2, dw3)
2. Click on **"Settings"** tab
3. Click on **"Networking"** section
4. Find **"Public Domain"** or generate one
5. Copy the URL (e.g., `https://dw1-production.up.railway.app`)
6. Use these URLs in the proxy's `DW_SERVERS` variable

## 📝 Step-by-Step: Setting Proxy Variables

1. Go to **Proxy service** → **Variables** tab
2. Click **"+ New Variable"**
3. Add each variable:

   **Variable 1:**
   - Key: `NODE_ENV`
   - Value: `production`

   **Variable 2:**
   - Key: `PROXY_PORT`
   - Value: `$PORT` (Railway will substitute the actual port)

   **Variable 3:**
   - Key: `CACHE_TTL_SECONDS`
   - Value: `30`

   **Variable 4:**
   - Key: `DW_SERVERS`
   - Value: `https://dw1-production.up.railway.app,https://dw2-production.up.railway.app,https://dw3-production.up.railway.app`
   - **Replace with your actual URLs!**

## ⚠️ Common Mistakes

1. **Don't set PORT manually** - Railway provides it automatically
2. **Use HTTPS URLs** - Railway provides HTTPS, not HTTP
3. **No trailing slashes** - URLs should not end with `/`
4. **Comma-separated, no spaces** - `url1,url2,url3` not `url1, url2, url3`

## 🧪 Verify Configuration

After setting variables, check the logs:

1. Go to service → **Deployments** → **View Logs**
2. Look for startup messages:
   - DW services: "DW Server configuration" and "Server started successfully"
   - Proxy: "Reverse Proxy Server started successfully"
3. Check that ports and URLs are correct in the logs

## 🔧 If PORT is Not Working

If Railway's `$PORT` is not being recognized:

1. **Check Start Command:**
   - Should be: `node dist/warehouse/dwServer.js --port $PORT --server-id dw1`
   - The `--port $PORT` argument will use Railway's PORT

2. **Alternative (if $PORT doesn't work):**
   - Remove `--port $PORT` from start command
   - The code will automatically use `process.env.PORT`

3. **For Proxy:**
   - Make sure `PROXY_PORT=$PORT` is set
   - Or just use `$PORT` directly (code checks both)

## 📊 Current Status Check

Based on your screenshot:
- ✅ `NODE_ENV` is set (good!)
- ✅ Railway system variables are available (good!)
- ⚠️ Need to verify start commands are correct
- ⚠️ Need to set proxy variables (especially `DW_SERVERS`)

## 🚀 Quick Fix

1. **For DW services:** Your current setup looks good. Just verify the start command.

2. **For Proxy service:** Add these variables:
   ```
   NODE_ENV=production
   PROXY_PORT=$PORT
   CACHE_TTL_SECONDS=30
   DW_SERVERS=https://your-dw1-url,https://your-dw2-url,https://your-dw3-url
   ```

3. **Get DW URLs:**
   - Go to each DW service → Settings → Networking
   - Copy the public domain URLs
   - Use them in proxy's `DW_SERVERS`

