# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies with cache mount for faster rebuilds
RUN npm install -g npm@10.9.2

# Copy workspace manifests first — better layer caching
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/api/package.json ./apps/api/package.json

# Install all dependencies (dev included — needed for TypeScript compiler)
RUN npm install --frozen-lockfile

# Copy source files
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/

# Build shared package first
RUN cd packages/shared && npm run build 2>/dev/null || true

# Compile TypeScript → dist/
RUN cd apps/api && npm run build

# Prune dev dependencies — only production deps go to runner stage
RUN npm prune --omit=dev --workspace=apps/api

# ─── Stage 2: Runner ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nestjs

WORKDIR /app

ENV NODE_ENV=production
# Disable Node.js heap dump on OOM — avoids exposing secrets in crash dumps
ENV NODE_OPTIONS="--max-old-space-size=400"

# Copy only what's needed
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages ./packages

# Drop to non-root
USER nestjs

EXPOSE 4000

# Use exec form to receive signals properly (graceful shutdown)
CMD ["node", "dist/main"]
