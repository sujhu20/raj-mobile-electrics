# ============================================================
# BACKEND Dockerfile — Multi-stage production build
# ============================================================

# ── Stage 1: Builder ──────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (cached layer)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Install only production dependencies (without --ignore-scripts so prisma engine is downloaded)
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Copy Prisma schema and generated client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

# Set ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Runtime env
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Health check (polls the health endpoint)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

# Run migrations (non-blocking) then start server
# Using ; instead of && ensures the server starts even if migrations fail
CMD ["sh", "-c", "npx prisma migrate deploy || echo 'Migration warning — skipping'; node dist/index.js"]
