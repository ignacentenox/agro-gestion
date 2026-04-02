#!/bin/sh
set -e

echo "[start.sh] Iniciando Agro Gestion en modo local..."

if [ ! -f ".env" ]; then
  echo "[start.sh] ERROR: no se encontro el archivo .env"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "[start.sh] Instalando dependencias..."
  npm install
fi

if grep -q "@db:" .env; then
  echo "[start.sh] ERROR: tu DATABASE_URL sigue apuntando a Docker (host 'db')."
  echo "[start.sh] Cambia el host a localhost en .env y vuelve a ejecutar."
  exit 1
fi

echo "[start.sh] Generando cliente Prisma..."
npx prisma generate --schema=prisma/schema.prisma

echo "[start.sh] Aplicando migraciones..."
npx prisma migrate deploy --schema=prisma/schema.prisma

echo "[start.sh] Ejecutando seed..."
npx prisma db seed --schema=prisma/schema.prisma

echo "[start.sh] Levantando Next.js en desarrollo..."
exec npm run dev
