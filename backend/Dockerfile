# Multi-stage build — keeps final image small and secure

# ── Stage 1: build ────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: production image ─────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Run as non-root user (security best practice)
RUN addgroup -S homeguard && adduser -S homeguard -G homeguard

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER homeguard

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
