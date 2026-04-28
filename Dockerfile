# Development Dockerfile
# Uses hot-reload with bind mount for source code

FROM node:20-alpine AS development

# Set working directory
WORKDIR /app

# Install system dependencies
# - netcat-openbsd: for waiting on PostgreSQL port
# - python3: for potential native module builds
# - make, g++: for building native dependencies
RUN apk add --no-cache \
    netcat-openbsd \
    python3 \
    make \
    g++ \
    bash

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for hot reload)
RUN npm install

# Copy Prisma schema (for client generation)
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy entrypoint script
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expose application port
EXPOSE 4001

# Set entrypoint
ENTRYPOINT ["entrypoint.sh"]

# Default command (overridden by entrypoint)
CMD ["npm", "run", "start:dev"]
