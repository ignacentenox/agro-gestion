#!/bin/sh
set -e
echo "[start.sh] Esperando a que la base de datos esté disponible..."
until nc -z db 5432; do
  echo "[start.sh] DB no disponible, reintentando en 2s..."
  sleep 2
done
echo "[start.sh] Base de datos detectada. Ejecutando migraciones..."
npx prisma migrate deploy --schema=prisma/schema.prisma || { echo '[start.sh] ERROR en migrate deploy'; exit 1; }
echo "[start.sh] Migraciones aplicadas. Ejecutando seed..."
npx prisma db seed --schema=prisma/schema.prisma || { echo '[start.sh] ERROR en db seed'; exit 1; }
echo "[start.sh] Seed ejecutado. Iniciando app..."
exec node server.js
