# Multi-stage build for Node.js TypeScript application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy public files (web interface)
COPY public ./public

# Expose port (will be overridden by environment)
EXPOSE 8080

# Default command (can be overridden)
CMD ["node", "dist/proxy/proxyServer.js"]

