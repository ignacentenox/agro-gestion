/*
  Warnings:

  - You are about to drop the column `destino` on the `cheques_recibidos` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "FormatoCheque" AS ENUM ('FISICO', 'E_CHECK');

-- CreateEnum
CREATE TYPE "DestinoChequeRecibido" AS ENUM ('DEPOSITO', 'VENTA', 'PROVEEDOR', 'CARTERA');

-- CreateEnum
CREATE TYPE "TipoMovimientoCCC" AS ENUM ('FACTURA', 'COBRO_CHEQUE', 'COBRO_TRANSFERENCIA', 'COBRO_EFECTIVO', 'NOTA_CREDITO', 'NOTA_DEBITO', 'AJUSTE');

-- AlterTable
ALTER TABLE "cheques_emitidos" ADD COLUMN     "formato" "FormatoCheque" NOT NULL DEFAULT 'FISICO';

-- AlterTable
ALTER TABLE "cheques_recibidos" DROP COLUMN "destino",
ADD COLUMN     "bancoDestinoId" TEXT,
ADD COLUMN     "destinoDetalle" TEXT,
ADD COLUMN     "destinoTipo" "DestinoChequeRecibido",
ADD COLUMN     "formato" "FormatoCheque" NOT NULL DEFAULT 'FISICO',
ADD COLUMN     "proveedorDestinoId" TEXT;

-- CreateTable
CREATE TABLE "cuentas_corrientes_clientes" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "concepto" TEXT NOT NULL,
    "tipo" "TipoMovimientoCCC" NOT NULL,
    "debe" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "haber" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "saldo" DECIMAL(12,2) NOT NULL,
    "referencia" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuentas_corrientes_clientes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cheques_recibidos" ADD CONSTRAINT "cheques_recibidos_bancoDestinoId_fkey" FOREIGN KEY ("bancoDestinoId") REFERENCES "bancos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheques_recibidos" ADD CONSTRAINT "cheques_recibidos_proveedorDestinoId_fkey" FOREIGN KEY ("proveedorDestinoId") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_corrientes_clientes" ADD CONSTRAINT "cuentas_corrientes_clientes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
