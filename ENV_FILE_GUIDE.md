# 📝 .env File Guide for Railway Deployment

## ❌ What You DON'T Need in .env for Railway

### PORT Variables
- ❌ **Don't set `PORT`** - Railway provides this automatically
- ❌ **Don't set `PROXY_PORT`** in .env - Set it as Railway environment variable instead
- ❌ **Don't set `DW_PORT_1`, `DW_PORT_2`, `DW_PORT_3`** - Not needed for Railway

### Why?
Railway automatically provides `PORT` for each service. You don't need to set it in `.env` or as a Railway variable.

## ✅ What You DO Need

### For Local Development (.env file)
Your `.env` file is for **local development only**:

```env
# Local development only
PROXY_PORT=8080
DW_SERVERS=http://localhost:3001,http://localhost:3002,http://localhost:3003
CACHE_TTL_SECONDS=30
LOG_LEVEL=info
NODE_ENV=development
```

### For Railway (Environment Variables in Railway UI)
Set these in Railway's **Variables** tab, NOT in .env file:

**DW Services (dw1, dw2, dw3):**
- `NODE_ENV=production` ✅

**Proxy Service:**
- `NODE_ENV=production` ✅
- `PROXY_PORT=$PORT` ✅ (or just use `$PORT` - Railway sets it)
- `CACHE_TTL_SECONDS=30` ✅
- `DW_SERVERS=https://dw1-url,https://dw2-url,https://dw3-url` ✅

## 🎯 Key Points

1. **`.env` file is for local development**
   - Use it when running `npm run dev:dw1` locally
   - Railway doesn't use your `.env` file

2. **Railway uses its own Variables**
   - Set variables in Railway UI (Settings → Variables)
   - Railway provides `PORT` automatically (don't set it)

3. **PORT is automatic**
   - Railway sets `PORT` for each service
   - Your code reads `process.env.PORT` automatically
   - No need to set it anywhere

## 📋 Summary

| Variable | Local .env | Railway Variables | Notes |
|----------|-----------|------------------|-------|
| `PORT` | ❌ No | ❌ No | Railway provides automatically |
| `PROXY_PORT` | ✅ Yes (8080) | ✅ Yes (`$PORT`) | Only for proxy service |
| `DW_SERVERS` | ✅ Yes (localhost) | ✅ Yes (Railway URLs) | Different URLs for local vs Railway |
| `NODE_ENV` | ✅ Yes (development) | ✅ Yes (production) | Different values |
| `CACHE_TTL_SECONDS` | ✅ Yes (30) | ✅ Yes (30) | Same value |
| `LOG_LEVEL` | ✅ Yes (info) | ❌ Optional | For local debugging |

## ✅ What to Do

1. **Keep your `.env` file** for local development
2. **Don't commit `.env`** (it's in `.gitignore` - good!)
3. **Set variables in Railway UI** for each service
4. **Don't set PORT** - Railway handles it

## 🚀 Railway Configuration

### DW Services:
**Variables tab:**
- `NODE_ENV=production`

**That's it!** Railway provides `PORT` automatically.

### Proxy Service:
**Variables tab:**
- `NODE_ENV=production`
- `PROXY_PORT=$PORT` (or Railway will use `PORT` automatically)
- `CACHE_TTL_SECONDS=30`
- `DW_SERVERS=https://dw1-url,https://dw2-url,https://dw3-url`

## 💡 Remember

- **`.env`** = Local development only
- **Railway Variables** = Production deployment
- **PORT** = Always automatic (never set manually)

Your current `.env` file is fine for local development. For Railway, just set the variables in the Railway UI!

