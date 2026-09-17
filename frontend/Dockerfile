# syntax=docker/dockerfile:1
# Multi-stage production build for FraudGuard AI Frontend

# Stage 1: Build Vite / React SPA
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Minimal non-root Nginx production server
FROM nginxinc/nginx-unprivileged:alpine-slim AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
