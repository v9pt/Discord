# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:20-alpine

# Install canvas dependencies for @napi-rs/canvas
RUN apk add --no-cache \
    python3 \
    make \
    g++

WORKDIR /app

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy source
COPY . .

# Create logs directory
RUN mkdir -p logs

# Non-root user for security
RUN addgroup -g 1001 -S botgroup && \
    adduser -S botuser -u 1001 -G botgroup && \
    chown -R botuser:botgroup /app

USER botuser

EXPOSE 3000

CMD ["node", "index.js"]
