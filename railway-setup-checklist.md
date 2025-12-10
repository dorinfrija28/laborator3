# ✅ Railway Deployment Checklist

Use this checklist to ensure successful deployment.

## Pre-Deployment

- [ ] Code is pushed to GitHub repository
- [ ] All tests pass locally
- [ ] `.env` file is in `.gitignore` (not committed)
- [ ] `package.json` has all dependencies
- [ ] TypeScript compiles without errors (`npm run build`)

## Service Creation

### DW1 Service
- [ ] Service created and named `dw1`
- [ ] GitHub repo connected
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `node dist/warehouse/dwServer.js --port $PORT --server-id dw1`
- [ ] Environment Variable: `NODE_ENV=production`
- [ ] Public domain generated
- [ ] URL noted: `https://________________.up.railway.app`

### DW2 Service
- [ ] Service created and named `dw2`
- [ ] GitHub repo connected
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `node dist/warehouse/dwServer.js --port $PORT --server-id dw2`
- [ ] Environment Variable: `NODE_ENV=production`
- [ ] Public domain generated
- [ ] URL noted: `https://________________.up.railway.app`

### DW3 Service
- [ ] Service created and named `dw3`
- [ ] GitHub repo connected
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `node dist/warehouse/dwServer.js --port $PORT --server-id dw3`
- [ ] Environment Variable: `NODE_ENV=production`
- [ ] Public domain generated
- [ ] URL noted: `https://________________.up.railway.app`

### Proxy Service
- [ ] Service created and named `proxy`
- [ ] GitHub repo connected
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `node dist/proxy/proxyServer.js`
- [ ] Environment Variables set:
  - [ ] `NODE_ENV=production`
  - [ ] `PROXY_PORT=$PORT`
  - [ ] `CACHE_TTL_SECONDS=30`
  - [ ] `DW_SERVERS=https://dw1-url,https://dw2-url,https://dw3-url` (with actual URLs)
- [ ] Public domain generated
- [ ] URL noted: `https://________________.up.railway.app`

## Deployment

- [ ] All 4 services show "Deployed" status (green)
- [ ] No build errors in logs
- [ ] No runtime errors in logs

## Verification

- [ ] DW1 health check: `https://dw1-url/health` returns OK
- [ ] DW2 health check: `https://dw2-url/health` returns OK
- [ ] DW3 health check: `https://dw3-url/health` returns OK
- [ ] Proxy web interface: `https://proxy-url` loads
- [ ] Proxy metrics: `https://proxy-url/metrics` shows data
- [ ] Can create employee via web interface
- [ ] Can view employees via web interface
- [ ] Load balancing works (check metrics for request distribution)

## Post-Deployment

- [ ] Bookmark proxy URL
- [ ] Test all CRUD operations
- [ ] Monitor logs for any errors
- [ ] Check Railway dashboard for resource usage
- [ ] Document URLs for future reference

## Troubleshooting (if needed)

- [ ] Checked build logs for errors
- [ ] Checked runtime logs for errors
- [ ] Verified environment variables are correct
- [ ] Verified DW_SERVERS URLs are correct
- [ ] Verified all services are running
- [ ] Tried redeploying failed services

---

**Deployment Date**: _______________
**Proxy URL**: https://________________.up.railway.app
**Status**: ☐ Success  ☐ Needs Fix

