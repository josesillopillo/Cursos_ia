FROM node:18-alpine AS builder

WORKDIR /build
COPY backend/package.json ./
RUN npm install --production

FROM node:18-alpine AS production

WORKDIR /usr/src/app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Instalar Infisical CLI (opcional, para inyeccion de secretos)
RUN apk add --no-cache curl && \
  curl -sL https://github.com/Infisical/infisical/releases/latest/download/infisical_linux_amd64.tar.gz \
  -o /tmp/infisical.tar.gz 2>/dev/null && \
  tar -xzf /tmp/infisical.tar.gz -C /usr/local/bin/ infisical 2>/dev/null && \
  chmod +x /usr/local/bin/infisical 2>/dev/null || \
  echo "[WARN] Infisical CLI no disponible en esta plataforma."

COPY --from=builder /build/node_modules ./node_modules
COPY backend/server.js ./
COPY backend/infisical.js ./
COPY backend/docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh && chown -R appuser:appgroup /usr/src/app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
