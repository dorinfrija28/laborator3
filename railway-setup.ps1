# Railway Auto-Setup Script (PowerShell)
# This script automatically creates all services on Railway including PostgreSQL database
# Usage: .\railway-setup.ps1

Write-Host "🚂 Railway Auto-Setup Script" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green
Write-Host ""

# Check if Railway CLI is installed
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g @railway/cli
}

# Check if logged in
try {
    railway whoami | Out-Null
} catch {
    Write-Host "🔐 Please login to Railway..." -ForegroundColor Yellow
    railway login
}

Write-Host "📦 Creating Railway project..." -ForegroundColor Cyan
$PROJECT_NAME = "web-proxy-distributed-systems"
railway init --name $PROJECT_NAME
if ($LASTEXITCODE -ne 0) {
    railway link
}

Write-Host ""
Write-Host "🗄️  Creating PostgreSQL database service..." -ForegroundColor Cyan
railway add --service postgres --type postgresql
if ($LASTEXITCODE -ne 0) {
    Write-Host "PostgreSQL service may already exist" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 Getting database connection details..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "🔧 Creating DW1 service..." -ForegroundColor Cyan
railway service create dw1
if ($LASTEXITCODE -ne 0) {
    Write-Host "DW1 service may already exist" -ForegroundColor Yellow
}
railway service use dw1
railway variables set NODE_ENV=production
railway variables set SERVER_ID=dw1
railway variables set DB_HOST='${{postgres.PGHOST}}'
railway variables set DB_PORT='${{postgres.PGPORT}}'
railway variables set DB_NAME='${{postgres.PGDATABASE}}'
railway variables set DB_USER='${{postgres.PGUSER}}'
railway variables set DB_PASSWORD='${{postgres.PGPASSWORD}}'

Write-Host ""
Write-Host "🔧 Creating DW2 service..." -ForegroundColor Cyan
railway service create dw2
if ($LASTEXITCODE -ne 0) {
    Write-Host "DW2 service may already exist" -ForegroundColor Yellow
}
railway service use dw2
railway variables set NODE_ENV=production
railway variables set SERVER_ID=dw2
railway variables set DB_HOST='${{postgres.PGHOST}}'
railway variables set DB_PORT='${{postgres.PGPORT}}'
railway variables set DB_NAME='${{postgres.PGDATABASE}}'
railway variables set DB_USER='${{postgres.PGUSER}}'
railway variables set DB_PASSWORD='${{postgres.PGPASSWORD}}'

Write-Host ""
Write-Host "🔧 Creating DW3 service..." -ForegroundColor Cyan
railway service create dw3
if ($LASTEXITCODE -ne 0) {
    Write-Host "DW3 service may already exist" -ForegroundColor Yellow
}
railway service use dw3
railway variables set NODE_ENV=production
railway variables set SERVER_ID=dw3
railway variables set DB_HOST='${{postgres.PGHOST}}'
railway variables set DB_PORT='${{postgres.PGPORT}}'
railway variables set DB_NAME='${{postgres.PGDATABASE}}'
railway variables set DB_USER='${{postgres.PGUSER}}'
railway variables set DB_PASSWORD='${{postgres.PGPASSWORD}}'

Write-Host ""
Write-Host "🔧 Creating Proxy service..." -ForegroundColor Cyan
railway service create proxy
if ($LASTEXITCODE -ne 0) {
    Write-Host "Proxy service may already exist" -ForegroundColor Yellow
}
railway service use proxy
railway variables set NODE_ENV=production
railway variables set PROXY_PORT='$PORT'
railway variables set CACHE_TTL_SECONDS=30

Write-Host ""
Write-Host "⚠️  Note: You'll need to update DW_SERVERS in proxy service after deployment" -ForegroundColor Yellow
Write-Host "   Get the URLs from Railway dashboard and set:" -ForegroundColor Yellow
Write-Host "   DW_SERVERS=https://dw1-production.up.railway.app,https://dw2-production.up.railway.app,https://dw3-production.up.railway.app" -ForegroundColor Yellow

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Push your code to GitHub" -ForegroundColor White
Write-Host "2. Railway will automatically deploy all services" -ForegroundColor White
Write-Host "3. Get service URLs from Railway dashboard" -ForegroundColor White
Write-Host "4. Update DW_SERVERS in proxy service with actual URLs" -ForegroundColor White
Write-Host ""
Write-Host "🚀 To deploy:" -ForegroundColor Cyan
Write-Host "   git push origin main" -ForegroundColor White
Write-Host ""

