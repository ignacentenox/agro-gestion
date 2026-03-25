-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'VIEWER');

-- CreateEnum
CREATE TYPE "CondicionIva" AS ENUM ('RESPONSABLE_INSCRIPTO', 'MONOTRIBUTISTA', 'EXENTO', 'CONSUMIDOR_FINAL', 'NO_CATEGORIZADO');

-- CreateEnum
CREATE TYPE "TipoComprobante" AS ENUM ('FACTURA_A', 'FACTURA_B', 'FACTURA_C', 'NOTA_CREDITO_A', 'NOTA_CREDITO_B', 'NOTA_CREDITO_C', 'NOTA_DEBITO_A', 'NOTA_DEBITO_B', 'NOTA_DEBITO_C', 'RECIBO');

-- CreateEnum
CREATE TYPE "TipoCuenta" AS ENUM ('CUENTA_CORRIENTE', 'CAJA_AHORRO');

-- CreateEnum
CREATE TYPE "EstadoCheque" AS ENUM ('PENDIENTE', 'COBRADO', 'DEPOSITADO', 'RECHAZADO', 'ANULADO', 'ENDOSADO');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('DEBITO', 'CREDITO');

-- CreateEnum
CREATE TYPE "TipoMovimientoCC" AS ENUM ('FACTURA', 'PAGO', 'NOTA_CREDITO', 'NOTA_DEBITO', 'AJUSTE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "condicionIva" "CondicionIva" NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "observaciones" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "condicionIva" "CondicionIva" NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "observaciones" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas_emitidas" (
    "id" TEXT NOT NULL,
    "tipoComprobante" "TipoComprobante" NOT NULL,
    "puntoVenta" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "clienteId" TEXT NOT NULL,
    "descripcion" TEXT,
    "netoGravado" DECIMAL(12,2) NOT NULL,
    "netoNoGravado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netoExento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "alicuotaIva" DECIMAL(5,2) NOT NULL,
    "montoIva" DECIMAL(12,2) NOT NULL,
    "percepcionIva" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "percepcionIIBB" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otrosImpuestos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facturas_emitidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas_recibidas" (
    "id" TEXT NOT NULL,
    "tipoComprobante" "TipoComprobante" NOT NULL,
    "puntoVenta" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "descripcion" TEXT,
    "netoGravado" DECIMAL(12,2) NOT NULL,
    "netoNoGravado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netoExento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "alicuotaIva" DECIMAL(5,2) NOT NULL,
    "montoIva" DECIMAL(12,2) NOT NULL,
    "percepcionIva" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "percepcionIIBB" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otrosImpuestos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facturas_recibidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liquidaciones_emitidas" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "clienteId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "descripcion" TEXT,
    "netoGravado" DECIMAL(12,2) NOT NULL,
    "alicuotaIva" DECIMAL(5,2) NOT NULL,
    "montoIva" DECIMAL(12,2) NOT NULL,
    "retenciones" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otrosConceptos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liquidaciones_emitidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liquidaciones_recibidas" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "descripcion" TEXT,
    "netoGravado" DECIMAL(12,2) NOT NULL,
    "alicuotaIva" DECIMAL(5,2) NOT NULL,
    "montoIva" DECIMAL(12,2) NOT NULL,
    "retenciones" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otrosConceptos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liquidaciones_recibidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bancos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "sucursal" TEXT,
    "numeroCuenta" TEXT NOT NULL,
    "cbu" TEXT,
    "alias" TEXT,
    "tipoCuenta" "TipoCuenta" NOT NULL,
    "saldoInicial" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bancos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cheques_emitidos" (
    "id" TEXT NOT NULL,
    "bancoId" TEXT NOT NULL,
    "numeroCheque" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "fechaCobro" TIMESTAMP(3) NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "concepto" TEXT,
    "monto" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoCheque" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cheques_emitidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cheques_recibidos" (
    "id" TEXT NOT NULL,
    "bancoOrigenId" TEXT,
    "numeroCheque" TEXT NOT NULL,
    "bancoEmisor" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "fechaCobro" TIMESTAMP(3) NOT NULL,
    "clienteId" TEXT NOT NULL,
    "concepto" TEXT,
    "monto" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoCheque" NOT NULL DEFAULT 'PENDIENTE',
    "destino" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cheques_recibidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_banco" (
    "id" TEXT NOT NULL,
    "bancoId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "referencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_banco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas_corrientes" (
    "id" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "concepto" TEXT NOT NULL,
    "tipo" "TipoMovimientoCC" NOT NULL,
    "debe" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "haber" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "saldo" DECIMAL(12,2) NOT NULL,
    "referencia" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuentas_corrientes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_cuit_key" ON "proveedores"("cuit");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cuit_key" ON "clientes"("cuit");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_emitidas_tipoComprobante_puntoVenta_numero_key" ON "facturas_emitidas"("tipoComprobante", "puntoVenta", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_recibidas_tipoComprobante_puntoVenta_numero_provee_key" ON "facturas_recibidas"("tipoComprobante", "puntoVenta", "numero", "proveedorId");

-- CreateIndex
CREATE UNIQUE INDEX "bancos_cbu_key" ON "bancos"("cbu");

-- AddForeignKey
ALTER TABLE "facturas_emitidas" ADD CONSTRAINT "facturas_emitidas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_recibidas" ADD CONSTRAINT "facturas_recibidas_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidaciones_emitidas" ADD CONSTRAINT "liquidaciones_emitidas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidaciones_recibidas" ADD CONSTRAINT "liquidaciones_recibidas_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheques_emitidos" ADD CONSTRAINT "cheques_emitidos_bancoId_fkey" FOREIGN KEY ("bancoId") REFERENCES "bancos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheques_emitidos" ADD CONSTRAINT "cheques_emitidos_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheques_recibidos" ADD CONSTRAINT "cheques_recibidos_bancoOrigenId_fkey" FOREIGN KEY ("bancoOrigenId") REFERENCES "bancos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheques_recibidos" ADD CONSTRAINT "cheques_recibidos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_banco" ADD CONSTRAINT "movimientos_banco_bancoId_fkey" FOREIGN KEY ("bancoId") REFERENCES "bancos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_corrientes" ADD CONSTRAINT "cuentas_corrientes_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
