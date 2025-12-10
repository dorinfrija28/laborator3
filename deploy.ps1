# PowerShell deployment script for Web Proxy System
# Usage: .\deploy.ps1 [platform]
# Platforms: docker

param(
    [string]$Platform = "docker"
)

Write-Host "🚀 Deploying Web Proxy System to $Platform..." -ForegroundColor Green

switch ($Platform) {
    "docker" {
        Write-Host "📦 Building Docker images..." -ForegroundColor Yellow
        docker-compose build
        
        Write-Host "🚀 Starting services..." -ForegroundColor Yellow
        docker-compose up -d
        
        Write-Host "✅ Deployment complete!" -ForegroundColor Green
        Write-Host "📊 View logs: docker-compose logs -f" -ForegroundColor Cyan
        Write-Host "🌐 Access proxy: http://localhost:8080" -ForegroundColor Cyan
    }
    
    default {
        Write-Host "❌ Unknown platform: $Platform" -ForegroundColor Red
        Write-Host "Available platforms: docker" -ForegroundColor Yellow
        exit 1
    }
}

