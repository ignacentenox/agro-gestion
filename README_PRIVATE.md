# 🔒 Agro Gestión — README Privado (Técnico)

Este archivo está pensado para el equipo técnico (infra/dev). Contiene detalles de arquitectura, configuración y troubleshooting.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Prisma 7** + **PostgreSQL 16**
- **Auth**: JWT (librería `jose`) en cookie HttpOnly `agro-session`
- **UI**: Tailwind CSS + Radix UI

## Arquitectura (alto nivel)

- UI: `src/app/*`
- API Routes: `src/app/api/*/route.ts`
- Prisma client singleton: `src/lib/prisma.ts`
- Auth helpers (JWT/cookies): `src/lib/auth.ts`
- Middleware de protección: `src/middleware.ts`

## Variables de entorno

Se cargan desde `.env` (local) y desde el entorno en producción.

- `DATABASE_URL`: conexión PostgreSQL (ej: `postgresql://user:pass@host:5432/agrogestion?schema=public`)
- `NEXTAUTH_SECRET`: secreto para firmar/verificar JWT (en este proyecto se reutiliza para cookies JWT)
- `NEXTAUTH_URL`: URL base del sitio
- `NEXTAUTH_TRUST_HOST`: habilita trust host en entornos detrás de proxy
- `APP_PORT`: puerto esperado (el dev server puede cambiar si el puerto está ocupado)

## Base de datos (Prisma)

### Comandos

- Generar cliente Prisma:
  - `npx prisma generate`
- Aplicar migraciones en entorno ya existente:
  - `npx prisma migrate deploy`
- Crear migraciones en dev:
  - `npx prisma migrate dev --name <nombre>`
- Ejecutar seed:
  - `npx prisma db seed`
- Ver DB en UI:
  - `npx prisma studio`

### Seed / credenciales

El seed está en `prisma/seed.ts` y crea (entre otros) el usuario admin:

- `admin@agrogestion.com` / `admin123`

## Flujo local recomendado

1. Instalar deps: `npm install`
2. Verificar `.env`
3. Levantar PostgreSQL (si es local)
4. Inicializar DB:
   - `npx prisma generate && npx prisma migrate deploy && npx prisma db seed`
5. Iniciar dev server:
   - `npm run dev`

Alternativa: usar `./start.sh` (hace generate + migrate deploy + seed + dev).

## Troubleshooting

### No puedo iniciar sesión / “Error interno del servidor”

Causa común: **PostgreSQL no está corriendo** o `DATABASE_URL` no apunta a un servidor accesible.

- Síntoma: el endpoint `POST /api/auth/login` falla al ejecutar `prisma.user.findUnique(...)`.
- Señales típicas (Prisma): `P1001` / `ECONNREFUSED`.

Checklist:

- `pg_isready -h localhost -p 5432`
- `npx prisma migrate status`
- Revisar `DATABASE_URL`.

En macOS (Homebrew), iniciar servicio:

- `brew services start postgresql@16`

### Dev server en otro puerto

Si el puerto está en uso, `next dev` puede iniciar en otro (ej: 3001/3002). Revisar la salida del comando.

## Deploy

- `npm run build` corre `prisma generate` y luego `next build`.
- En producción, asegurar:
  - `DATABASE_URL` correcta
  - `NEXTAUTH_SECRET` fuerte (generar con `openssl rand -base64 32`)

## Notas de seguridad

- No commitear secretos reales (passwords/URLs privadas) en git.
- Mantener `NEXTAUTH_SECRET` fuera del repo (variables del proveedor).
