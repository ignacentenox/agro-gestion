# 🌾 Agro Gestión

Sistema de gestión contable y administrativa para empresas agropecuarias. Controla facturas, liquidaciones, IVA, cheques, bancos y cuentas corrientes.

## Descripción

Agro Gestión es una aplicación web full stack orientada al circuito administrativo y contable agropecuario. Permite operar comprobantes, libro IVA, cheques, cuentas corrientes y cartas de porte desde un único panel con autenticación y trazabilidad por usuario.

## Módulos

| Módulo | Descripción |
|--------|-------------|
| **Dashboard** | Resumen mensual de ventas, compras, posición IVA y cheques pendientes |
| **Facturas Emitidas** | Gestión de facturas de venta (IVA Débito Fiscal) |
| **Facturas Recibidas** | Gestión de facturas de compra (IVA Crédito Fiscal) |
| **Liquidaciones** | Liquidaciones emitidas y recibidas |
| **Libro IVA** | Resumen de IVA Compras/Ventas mensual con posición fiscal |
| **Cheques** | Control de cheques emitidos (a cubrir) y recibidos |
| **Bancos** | Administración de cuentas bancarias |
| **Cuentas Corrientes** | Seguimiento de saldos con proveedores |
| **Proveedores** | ABM de proveedores |
| **Clientes** | ABM de clientes |

## Stack Tecnológico

- **Frontend/Backend**: Next.js 16 (App Router, TypeScript)
- **Base de Datos**: PostgreSQL 16
- **ORM**: Prisma 7
- **UI**: Tailwind CSS + Radix UI
- **Auth**: JWT (jose) con cookies HttpOnly
- **Deploy**: Vercel (automático con GitHub Actions)

## Requisitos

- Node.js 20+
- PostgreSQL 16+
- npm

## Instalación Local (Desarrollo)

```bash
# 1. Clonar e instalar dependencias
git clone <repo-url>
cd agro-gestion
npm install

# 2. Configurar variables de entorno
cp .env.production .env
# Editar .env con tus valores

# 3. Crear base de datos y migrar
npx prisma migrate dev --name init

# 4. Seed (usuario admin + datos de ejemplo)
npx prisma db seed

# 5. Iniciar en desarrollo
npm run dev
```

Acceder a `http://localhost:3000`

**Login inicial:** `admin@agrogestion.com` / `admin123`

## Deploy Automático (GitHub + Vercel)

El repositorio ya incluye automatización en:

- `.github/workflows/ci.yml`: ejecuta build en cada push y pull request.
- `.github/workflows/vercel-deploy.yml`: publica preview en cada pull request y producción en cada push a `main`.

### Configuración única (5 minutos)

1. Crear proyecto en Vercel e importar este repositorio.
2. En GitHub, abrir `Settings > Secrets and variables > Actions` y crear:
	- `VERCEL_TOKEN`
	- `VERCEL_ORG_ID`
	- `VERCEL_PROJECT_ID`
	- Alternativa automática por terminal (recomendado):

```bash
export VERCEL_TOKEN="tu_token"
export VERCEL_ORG_ID="tu_org_id"
export VERCEL_PROJECT_ID="tu_project_id"
./scripts/setup-vercel-github-secrets.sh
```

3. En Vercel, definir las variables de entorno necesarias del proyecto (por ejemplo `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`).
4. Hacer push a una rama para generar un preview automático.
5. Hacer merge a `main` para desplegar producción automáticamente.

### Resultado

- Cada PR queda publicado con URL de preview.
- Cada push a `main` actualiza producción sin pasos manuales.

## Releases

Estrategia recomendada de versiones:

- `main`: rama estable de producción.
- `release/x.y.z`: rama opcional para preparar una versión.
- tags semánticos: `v1.0.0`, `v1.1.0`, `v1.1.1`.
- cada tag debe publicarse en GitHub Releases con changelog.

Plantilla de release:

1. Novedades
2. Fixes
3. Cambios de base de datos/migraciones
4. Notas de compatibilidad

## Package

Metadata esperada del paquete (ver `package.json`):

- `name`: `agro-gestion`
- `version`: versión semántica del release
- `description`: resumen funcional del sistema
- `author`: `IGNACE`
- `license`: `UNLICENSED` (propietario)

Comandos principales:

```bash
npm run dev
npm run build
npm run start
```

## Estructura del Proyecto

```
agro-gestion/
├── prisma/
│   ├── schema.prisma      # Esquema de base de datos
│   └── seed.ts            # Datos iniciales
├── src/
│   ├── app/
│   │   ├── (dashboard)/   # Páginas protegidas
│   │   ├── api/           # API Routes
│   │   └── login/         # Página de login
│   ├── components/
│   │   ├── sidebar.tsx    # Navegación lateral
│   │   └── ui/            # Componentes base
│   └── lib/
│       ├── auth.ts        # Autenticación JWT
│       ├── prisma.ts      # Cliente Prisma singleton
│       └── utils.ts       # Utilidades
└── .env.production        # Template de variables
```

## Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexión a PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Clave secreta para JWT | Generar con `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL base de la aplicación | `https://agro.empresa.com` |
| `APP_PORT` | Puerto de la aplicación | `3000` |

## Comandos Útiles

```bash
# Desarrollo
npm run dev                      # Servidor de desarrollo
npx prisma studio                # UI visual de la DB

# Base de datos
npx prisma migrate dev           # Crear migración
npx prisma migrate deploy        # Aplicar migraciones en prod
npx prisma db seed               # Ejecutar seed
npx prisma generate              # Regenerar cliente
```

## Licencia

Software propietario. Todos los derechos reservados por IGNACE.
