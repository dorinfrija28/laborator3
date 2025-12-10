# Railway Quick Start Guide

Quick reference for deploying to Railway with PostgreSQL.

## 🚀 Fast Deployment (5 Steps)

### 1. Create PostgreSQL Service
- Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
- Note the service name (e.g., `Postgres`)

### 2. Create DW1 Service
- **"+ New"** → **"GitHub Repo"** → Your repo
- **Name**: `dw1`
- **Build**: `npm install && npm run build`
- **Start**: `node dist/warehouse/dwServer.js --server-id dw1`
- **Variables**: Use Railway's reference syntax to link PostgreSQL variables

### 3. Create DW2 & DW3 Services
- Repeat step 2 for `dw2` and `dw3`
- Change `--server-id` to `dw2` and `dw3`

### 4. Create Proxy Service
- **"+ New"** → **"GitHub Repo"** → Your repo
- **Name**: `proxy`
- **Build**: `npm install && npm run build`
- **Start**: `node dist/proxy/proxyServer.js`
- **Variables**: Set `DW_SERVERS` with your DW service URLs

### 5. Get URLs & Update
- Copy each service's public URL
- Update `DW_SERVERS` in proxy service with actual URLs

## 📝 Environment Variables

### DW Services (dw1, dw2, dw3)
```env
NODE_ENV=production
SERVER_ID=dw1                    # dw1, dw2, or dw3
DB_HOST=${{Postgres.PGHOST}}     # Reference to PostgreSQL
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
```

### Proxy Service
```env
NODE_ENV=production
PROXY_PORT=$PORT
CACHE_TTL_SECONDS=30
DW_SERVERS=https://dw1-production.up.railway.app,https://dw2-production.up.railway.app,https://dw3-production.up.railway.app
```

## ✅ Test
```bash
# Health check
curl https://dw1-production.up.railway.app/health

# Create employee
curl -X POST https://proxy-production.up.railway.app/employees \
  -H "Content-Type: application/json" \
  -d '{"firstName": "John", "lastName": "Doe", "position": "Developer", "salary": 75000}'

# Fetch employees
curl https://proxy-production.up.railway.app/employees?format=json
```

## 🐛 Common Issues

**Database connection failed?**
- Check PostgreSQL service is running
- Verify variable references match service name
- Check all DB_* variables are set

**Service not starting?**
- Check logs for errors
- Verify build/start commands
- Ensure `dist/` folder exists after build

**Proxy can't reach DW servers?**
- Verify `DW_SERVERS` URLs are correct
- Check all DW services have public domains
- Use `https://` not `http://`

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed guide.

