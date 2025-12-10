# 🛠️ Railway Build Command Setup Guide

## Where to Set Build Commands

**Yes, you need to set the Build Command for EVERY service** (dw1, dw2, dw3, and proxy).

## 📍 Location in Railway

For each service:

1. Go to the service (e.g., **dw1**)
2. Click on **"Settings"** tab (top navigation)
3. Click on **"Deploy"** section (left sidebar)
4. Find **"Build Command"** field
5. Enter the build command

## ✅ Build Commands for Each Service

### DW1 Service
**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
node dist/warehouse/dwServer.js --port $PORT --server-id dw1
```

---

### DW2 Service
**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
node dist/warehouse/dwServer.js --port $PORT --server-id dw2
```

---

### DW3 Service
**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
node dist/warehouse/dwServer.js --port $PORT --server-id dw3
```

---

### Proxy Service
**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
node dist/proxy/proxyServer.js
```

## 📸 Visual Guide

```
Service (dw1) Dashboard
├── Deployments tab
├── Variables tab
├── Metrics tab
└── Settings tab ⬅️ CLICK HERE
    ├── General
    ├── Deploy ⬅️ CLICK HERE
    │   ├── Build Command: [npm install && npm run build] ⬅️ ENTER HERE
    │   ├── Start Command: [node dist/warehouse/dwServer.js --port $PORT --server-id dw1] ⬅️ ENTER HERE
    │   └── Health Check Path: (optional)
    ├── Variables
    ├── Networking
    └── ...
```

## 🔍 Step-by-Step for Each Service

### For DW1:

1. Go to **dw1** service
2. Click **Settings** tab
3. Click **Deploy** (in left sidebar)
4. In **Build Command** field, enter:
   ```
   npm install && npm run build
   ```
5. In **Start Command** field, enter:
   ```
   node dist/warehouse/dwServer.js --port $PORT --server-id dw1
   ```
6. Click **Save** or **Deploy** (Railway auto-saves)

### For DW2:

1. Go to **dw2** service
2. Click **Settings** tab
3. Click **Deploy**
4. **Build Command:**
   ```
   npm install && npm run build
   ```
5. **Start Command:**
   ```
   node dist/warehouse/dwServer.js --port $PORT --server-id dw2
   ```

### For DW3:

1. Go to **dw3** service
2. Click **Settings** tab
3. Click **Deploy**
4. **Build Command:**
   ```
   npm install && npm run build
   ```
5. **Start Command:**
   ```
   node dist/warehouse/dwServer.js --port $PORT --server-id dw3
   ```

### For Proxy:

1. Go to **proxy** service
2. Click **Settings** tab
3. Click **Deploy**
4. **Build Command:**
   ```
   npm install && npm run build
   ```
5. **Start Command:**
   ```
   node dist/proxy/proxyServer.js
   ```

## ⚠️ Important Notes

1. **Same Build Command for All:**
   - All services use the same build command: `npm install && npm run build`
   - This installs dependencies and compiles TypeScript

2. **Different Start Commands:**
   - DW services differ only in `--server-id` (dw1, dw2, dw3)
   - Proxy has a different start command (no port/server-id args)

3. **Railway Auto-Deploys:**
   - After saving, Railway will automatically trigger a new deployment
   - You'll see it building in the Deployments tab

4. **Build Happens First:**
   - Railway runs Build Command first
   - Then runs Start Command
   - If build fails, start command won't run

## ✅ Verification

After setting build commands:

1. Go to **Deployments** tab for each service
2. Click on the latest deployment
3. You should see:
   ```
   > npm install
   [installing packages...]
   > npm run build
   > tsc
   [TypeScript compilation...]
   ✓ Build successful
   > node dist/...
   [Server starting...]
   ```

## 🐛 If Build Fails

Check the deployment logs for:
- TypeScript errors
- Missing dependencies
- File path issues

Common fixes:
- Ensure `package.json` has all dependencies
- Check `tsconfig.json` is correct
- Verify all source files are in the repo

## 📝 Quick Reference Table

| Service | Build Command | Start Command |
|---------|--------------|---------------|
| dw1 | `npm install && npm run build` | `node dist/warehouse/dwServer.js --port $PORT --server-id dw1` |
| dw2 | `npm install && npm run build` | `node dist/warehouse/dwServer.js --port $PORT --server-id dw2` |
| dw3 | `npm install && npm run build` | `node dist/warehouse/dwServer.js --port $PORT --server-id dw3` |
| proxy | `npm install && npm run build` | `node dist/proxy/proxyServer.js` |

---

**Remember:** Set these for ALL 4 services! Railway needs to build the TypeScript code for each service separately.

