#!/bin/bash

# Deployment script for Web Proxy System
# Usage: ./deploy.sh [platform]
# Platforms: docker, railway, render

set -e

PLATFORM=${1:-docker}

echo "🚀 Deploying Web Proxy System to $PLATFORM..."

case $PLATFORM in
  docker)
    echo "📦 Building Docker images..."
    docker-compose build
    
    echo "🚀 Starting services..."
    docker-compose up -d
    
    echo "✅ Deployment complete!"
    echo "📊 View logs: docker-compose logs -f"
    echo "🌐 Access proxy: http://localhost:8080"
    ;;
    
  railway)
    echo "🚂 Deploying to Railway..."
    echo "⚠️  Make sure you have Railway CLI installed: npm i -g @railway/cli"
    railway up
    ;;
    
  render)
    echo "🎨 Deploying to Render..."
    echo "⚠️  Make sure you have Render account and connected GitHub repo"
    echo "📝 Update render.yaml with your service URLs"
    echo "✅ Push to GitHub - Render will auto-deploy"
    ;;
    
  *)
    echo "❌ Unknown platform: $PLATFORM"
    echo "Available platforms: docker, railway, render"
    exit 1
    ;;
esac

