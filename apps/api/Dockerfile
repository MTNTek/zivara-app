# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm-compatible npm install
RUN npm install -g npm@10

# Copy package files for dependency installation
COPY package.json package-lock.json* ./

# Copy workspace packages needed at build time
COPY packages/ ./packages/

# Copy the API source
COPY apps/api/package.json ./apps/api/package.json

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy full API source
COPY apps/api/ ./apps/api/

# Compile TypeScript
RUN cd apps/api && npm run build

# ─── Stage 2: Runner ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Only copy what's needed to run
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

EXPOSE 4000

CMD ["node", "dist/main"]
