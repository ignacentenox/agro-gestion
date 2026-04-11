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

echo "[start.sh] Chequeando conexión a la base de datos..."

if command -v node >/dev/null 2>&1; then
  DB_INFO=$(node -e "const dotenv=require('dotenv');dotenv.config();const url=process.env.DATABASE_URL||'';if(!url){process.exit(2)};let u;try{u=new URL(url)}catch{process.exit(3)};const host=u.hostname||'';const port=u.port||'5432';const isLocal=(host==='localhost'||host==='127.0.0.1'||host==='::1');process.stdout.write([host,port,isLocal?'local':'remote'].join('\t'));" 2>/dev/null || true)
  DB_HOST=$(printf "%s" "$DB_INFO" | cut -f1)
  DB_PORT=$(printf "%s" "$DB_INFO" | cut -f2)
  DB_SCOPE=$(printf "%s" "$DB_INFO" | cut -f3)

  if [ "$DB_SCOPE" = "local" ] && command -v pg_isready >/dev/null 2>&1; then
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" >/dev/null 2>&1; then
      echo "[start.sh] ERROR: PostgreSQL no está disponible en $DB_HOST:$DB_PORT"
      echo "[start.sh] Iniciá PostgreSQL y reintentá. En macOS (Homebrew):"
      echo "[start.sh]   brew services start postgresql@16"
      echo "[start.sh] Luego: pg_isready -h $DB_HOST -p $DB_PORT"
      exit 1
    fi
  fi
fi

echo "[start.sh] Aplicando migraciones..."
npx prisma migrate deploy --schema=prisma/schema.prisma

echo "[start.sh] Ejecutando seed..."
npx prisma db seed --schema=prisma/schema.prisma

echo "[start.sh] Levantando Next.js en desarrollo..."
exec npm run dev
