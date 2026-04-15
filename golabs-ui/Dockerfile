# syntax=docker/dockerfile:1

# ─── Stage 1: Build ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY ui/package.json ui/yarn.lock ./
RUN yarn install --frozen-lockfile

COPY ui/ .
RUN yarn build

# ─── Stage 2: Runtime ──────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1
