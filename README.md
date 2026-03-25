# 🌾 Agro Gestión

Sistema de gestión contable y administrativa para empresas agropecuarias. Controla facturas, liquidaciones, IVA, cheques, bancos y cuentas corrientes.

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
- **Deploy**: Docker + Docker Compose

## Requisitos

- Node.js 20+
- PostgreSQL 16+ (o Docker)
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

## Deploy en VPS con Docker

### 1. Preparar el servidor

```bash
# Instalar Docker en Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Instalar Docker Compose plugin
sudo apt install docker-compose-plugin
```

### 2. Configurar la aplicación

```bash
# Clonar el repositorio
git clone <repo-url>
cd agro-gestion

# Configurar variables de producción
cp .env.production .env

# IMPORTANTE: Editar .env con valores seguros
# - DB_PASSWORD: contraseña fuerte para PostgreSQL
# - NEXTAUTH_SECRET: generar con openssl rand -base64 32
# - NEXTAUTH_URL: URL real del servidor
```

### 3. Levantar los servicios

```bash
# Build y arranque
docker compose up -d --build

# Ejecutar migraciones
docker compose exec app npx prisma migrate deploy

# Seed inicial
docker compose exec app npx prisma db seed

# Ver logs
docker compose logs -f app
```

### 4. Configurar VPN (WireGuard recomendado)

Para acceso seguro desde fuera de la red local:

```bash
# Instalar WireGuard
sudo apt install wireguard

# Generar claves
wg genkey | tee /etc/wireguard/private.key | wg pubkey > /etc/wireguard/public.key
```

Configurar `/etc/wireguard/wg0.conf` con las IPs de la VPN y los peers. La app solo escuchará en la IP de la VPN configurando `APP_PORT` y firewall.

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
├── docker-compose.yml
├── Dockerfile
└── .env.production        # Template de variables
```

## Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexión a PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Clave secreta para JWT | Generar con `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL base de la aplicación | `https://agro.empresa.com` |
| `DB_PASSWORD` | Contraseña de PostgreSQL (Docker) | Contraseña segura |
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

# Docker
docker compose up -d --build     # Build y arranque
docker compose down              # Parar servicios
docker compose logs -f           # Ver logs
docker compose exec app sh       # Shell en el container
```

## Licencia

Privado - Todos los derechos reservados.
