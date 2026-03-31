
# ==========================================
# Build & Production en una sola etapa
# ==========================================
FROM node:20-alpine AS app
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1


# Instalar dependencias y copiar código
COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force
COPY . .

# Generar cliente Prisma y build
RUN npx prisma generate
RUN npm run build

# Crear usuario seguro para correr la app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Instalar netcat para el wait-for-db
USER root
RUN apk add --no-cache netcat-openbsd
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copiar el script de inicio
COPY start.sh ./start.sh
CMD ["./start.sh"]
