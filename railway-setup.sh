#!/bin/bash

# Railway Auto-Setup Script
# This script automatically creates all services on Railway including PostgreSQL database
# Usage: ./railway-setup.sh

set -e

echo "🚂 Railway Auto-Setup Script"
echo "=============================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway..."
    railway login
fi

echo "📦 Creating Railway project..."
PROJECT_NAME="web-proxy-distributed-systems"
railway init --name "$PROJECT_NAME" || railway link

echo ""
echo "🗄️  Creating PostgreSQL database service..."
railway add --service postgres --type postgresql || echo "PostgreSQL service may already exist"

echo ""
echo "📝 Getting database connection details..."
# Wait a moment for service to be ready
sleep 3

# Get database variables (Railway provides these automatically)
DB_HOST=$(railway variables --service postgres --json | jq -r '.PGHOST // empty')
DB_PORT=$(railway variables --service postgres --json | jq -r '.PGPORT // empty')
DB_NAME=$(railway variables --service postgres --json | jq -r '.PGDATABASE // empty')
DB_USER=$(railway variables --service postgres --json | jq -r '.PGUSER // empty')
DB_PASSWORD=$(railway variables --service postgres --json | jq -r '.PGPASSWORD // empty')

if [ -z "$DB_HOST" ]; then
    echo "⚠️  Could not retrieve database variables automatically"
    echo "   You'll need to set them manually in Railway dashboard"
else
    echo "✅ Database service created successfully"
    echo "   Host: $DB_HOST"
    echo "   Database: $DB_NAME"
fi

echo ""
echo "🔧 Creating DW1 service..."
railway service create dw1 || echo "DW1 service may already exist"
railway service use dw1
railway variables set NODE_ENV=production
railway variables set SERVER_ID=dw1
railway variables set DB_HOST='${{postgres.PGHOST}}'
railway variables set DB_PORT='${{postgres.PGPORT}}'
railway variables set DB_NAME='${{postgres.PGDATABASE}}'
railway variables set DB_USER='${{postgres.PGUSER}}'
railway variables set DB_PASSWORD='${{postgres.PGPASSWORD}}'

echo ""
echo "🔧 Creating DW2 service..."
railway service create dw2 || echo "DW2 service may already exist"
railway service use dw2
railway variables set NODE_ENV=production
railway variables set SERVER_ID=dw2
railway variables set DB_HOST='${{postgres.PGHOST}}'
railway variables set DB_PORT='${{postgres.PGPORT}}'
railway variables set DB_NAME='${{postgres.PGDATABASE}}'
railway variables set DB_USER='${{postgres.PGUSER}}'
railway variables set DB_PASSWORD='${{postgres.PGPASSWORD}}'

echo ""
echo "🔧 Creating DW3 service..."
railway service create dw3 || echo "DW3 service may already exist"
railway service use dw3
railway variables set NODE_ENV=production
railway variables set SERVER_ID=dw3
railway variables set DB_HOST='${{postgres.PGHOST}}'
railway variables set DB_PORT='${{postgres.PGPORT}}'
railway variables set DB_NAME='${{postgres.PGDATABASE}}'
railway variables set DB_USER='${{postgres.PGUSER}}'
railway variables set DB_PASSWORD='${{postgres.PGPASSWORD}}'

echo ""
echo "🔧 Creating Proxy service..."
railway service create proxy || echo "Proxy service may already exist"
railway service use proxy
railway variables set NODE_ENV=production
railway variables set PROXY_PORT='$PORT'
railway variables set CACHE_TTL_SECONDS=30

# Note: DW_SERVERS will need to be updated after services are deployed
echo "⚠️  Note: You'll need to update DW_SERVERS in proxy service after deployment"
echo "   Get the URLs from Railway dashboard and set:"
echo "   DW_SERVERS=https://dw1-production.up.railway.app,https://dw2-production.up.railway.app,https://dw3-production.up.railway.app"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Push your code to GitHub"
echo "2. Railway will automatically deploy all services"
echo "3. Get service URLs from Railway dashboard"
echo "4. Update DW_SERVERS in proxy service with actual URLs"
echo ""
echo "🚀 To deploy:"
echo "   git push origin main"
echo ""

