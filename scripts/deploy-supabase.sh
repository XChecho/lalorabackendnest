#!/bin/bash

# Deploy to Supabase Production
# Usage: ./scripts/deploy-supabase.sh

set -e

echo "🚀 Deploying Lalora Backend to Supabase Production..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production not found!"
    echo "📋 Please copy .env.production.example to .env.production and fill in the values:"
    echo "   cp .env.production.example .env.production"
    echo ""
    echo "Required values to set:"
    echo "  - DATABASE_URL (from Supabase Dashboard)"
    echo "  - JWT_SECRET (generate a strong random string)"
    echo "  - CLOUDINARY_* credentials"
    exit 1
fi

# Run Prisma migrations
echo "📦 Running Prisma migrations..."
npx prisma migrate deploy

# Build and start production containers
echo "🐳 Building and starting production containers..."
docker compose -f docker-compose.supabase.yml up --build -d

echo ""
echo "✅ Deployment complete!"
echo "📊 Backend running at: http://localhost:${HOST_PORT:-4001}"
echo "📋 View logs: docker compose -f docker-compose.supabase.yml logs -f"
echo "🛑 Stop: docker compose -f docker-compose.supabase.yml down"
