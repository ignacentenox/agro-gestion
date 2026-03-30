#!/bin/sh
# Esperar a que la base de datos esté lista
until nc -z db 5432; do
  echo "Esperando a que la base de datos esté disponible..."
  sleep 2
done

# Ejecutar migraciones y seed
npx prisma migrate deploy --schema=prisma/schema.prisma
npx prisma db seed --schema=prisma/schema.prisma

# Iniciar la app
exec node server.js
