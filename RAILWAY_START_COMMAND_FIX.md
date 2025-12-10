# 🔧 Railway Start Command Not Saving - Fix

## The Problem

Railway might not allow `$PORT` in the Start Command field, or there's a validation issue.

## ✅ Solution 1: Remove --port Argument (Recommended)

Since the code already reads `process.env.PORT` automatically, you can simplify the start command:

**For DW1, DW2, DW3:**
```
node dist/warehouse/dwServer.js --server-id dw1
```
(Change `dw1` to `dw2` or `dw3` for other services)

**Why this works:**
- The code already checks `process.env.PORT` first
- Railway automatically sets `PORT` environment variable
- The `--port $PORT` argument is optional

## ✅ Solution 2: Use Environment Variable Instead

If Railway doesn't like `$PORT` in the command, set it as an environment variable:

1. Go to **Settings** → **Variables**
2. Add variable:
   - Key: `PORT`
   - Value: Leave empty (Railway will set it automatically)
   - OR don't add it - Railway provides it automatically

3. Use simplified start command:
   ```
   node dist/warehouse/dwServer.js --server-id dw1
   ```

## ✅ Solution 3: Try Different Formats

Sometimes Railway is picky about the format. Try these variations:

**Option A (no port argument):**
```
node dist/warehouse/dwServer.js --server-id dw1
```

**Option B (with explicit path):**
```
node ./dist/warehouse/dwServer.js --server-id dw1
```

**Option C (if Railway supports it):**
```
NODE_ENV=production node dist/warehouse/dwServer.js --server-id dw1
```

## 🔍 Troubleshooting Steps

### Step 1: Check for Validation Errors
- Look for red error messages near the Start Command field
- Railway might show what's wrong

### Step 2: Try Minimal Command First
- Start with just: `node dist/warehouse/dwServer.js`
- Save it
- Then add `--server-id dw1`
- Save again

### Step 3: Check Field Type
- Make sure you're in the **Start Command** field (not Build Command)
- Some Railway UIs have separate fields

### Step 4: Try Without $PORT
- Remove `--port $PORT` completely
- The code will use `process.env.PORT` automatically
- Railway sets `PORT` automatically

## ✅ Recommended Configuration

### DW1 Service:
**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
node dist/warehouse/dwServer.js --server-id dw1
```

**Variables:**
- `NODE_ENV=production`
- (PORT is set automatically by Railway)

### DW2 Service:
**Start Command:**
```
node dist/warehouse/dwServer.js --server-id dw2
```

### DW3 Service:
**Start Command:**
```
node dist/warehouse/dwServer.js --server-id dw3
```

### Proxy Service:
**Start Command:**
```
node dist/proxy/proxyServer.js
```

**Variables:**
- `NODE_ENV=production`
- `PROXY_PORT=$PORT` (set as variable, not in command)
- `CACHE_TTL_SECONDS=30`
- `DW_SERVERS=https://dw1-url,https://dw2-url,https://dw3-url`

## 🎯 Why This Works

The code in `dwServer.ts` already handles this:

```typescript
// Reads PORT from environment first
let port = parseInt(process.env.PORT || '3001', 10);

// Command line arguments override (but PORT env var takes precedence)
args.forEach((arg: string, index: number) => {
    if (arg === '--port' && args[index + 1]) {
        port = parseInt(args[index + 1], 10);
    }
    // ...
});
```

So Railway's `PORT` environment variable will be used automatically!

## ✅ Final Answer

**Use this Start Command (without --port):**
```
node dist/warehouse/dwServer.js --server-id dw1
```

This should save without issues, and Railway's `PORT` will be used automatically.

