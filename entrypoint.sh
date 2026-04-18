#!/bin/sh
set -e

echo "=========================================="
echo "Lalora Backend - Starting container..."
echo "=========================================="

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL on postgres:5432..."
while ! nc -z postgres 5432; do
  echo "PostgreSQL not ready yet... waiting 1s"
  sleep 1
done

echo "✓ PostgreSQL is ready!"

# Ensure logs directory exists if file logging is enabled
if [ "$LOG_FILE_ENABLED" = "true" ]; then
  echo "Creating logs directory..."
  mkdir -p logs
fi

# Display environment info (sanitized)
echo "Environment: $NODE_ENV"
echo "Port: $PORT"
echo "Database: $DATABASE_NAME"
echo "=========================================="

# Generate Prisma client (if not already generated)
echo "Generating Prisma client..."
npx prisma generate

# Start NestJS application with hot reload
echo "Starting NestJS application..."
exec npm run start:dev
