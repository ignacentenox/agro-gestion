/*
  Warnings:

  - You are about to drop the column `puntoVenta` on the `facturas_emitidas` table. All the data in the column will be lost.
  - You are about to drop the column `puntoVenta` on the `facturas_recibidas` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TipoCampo" AS ENUM ('PROPIO', 'ALQUILADO');

-- CreateEnum
CREATE TYPE "Cultivo" AS ENUM ('SOJA', 'MAIZ', 'TRIGO', 'SORGO', 'GIRASOL', 'CEBADA', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoCarta" AS ENUM ('PENDIENTE', 'EN_TRANSITO', 'DESCARGADA', 'CONFIRMADA', 'ANULADA');

-- DropIndex
DROP INDEX "facturas_emitidas_tipoComprobante_puntoVenta_numero_key";

-- DropIndex
DROP INDEX "facturas_recibidas_tipoComprobante_puntoVenta_numero_provee_key";

-- AlterTable
CREATE SEQUENCE facturas_emitidas_numero_seq;
ALTER TABLE "facturas_emitidas" DROP COLUMN "puntoVenta",
ALTER COLUMN "numero" SET DEFAULT nextval('facturas_emitidas_numero_seq');
ALTER SEQUENCE facturas_emitidas_numero_seq OWNED BY "facturas_emitidas"."numero";

-- AlterTable
CREATE SEQUENCE facturas_recibidas_numero_seq;
ALTER TABLE "facturas_recibidas" DROP COLUMN "puntoVenta",
ALTER COLUMN "numero" SET DEFAULT nextval('facturas_recibidas_numero_seq');
ALTER SEQUENCE facturas_recibidas_numero_seq OWNED BY "facturas_recibidas"."numero";

-- CreateTable
CREATE TABLE "campos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ubicacion" TEXT,
    "hectareas" DECIMAL(10,2) NOT NULL,
    "tipo" "TipoCampo" NOT NULL,
    "propietario" TEXT,
    "costoAlquiler" DECIMAL(12,2),
    "observaciones" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producciones" (
    "id" TEXT NOT NULL,
    "campoId" TEXT NOT NULL,
    "cultivo" "Cultivo" NOT NULL,
    "campania" TEXT NOT NULL,
    "hectareas" DECIMAL(10,2) NOT NULL,
    "kgCosechados" DECIMAL(12,2) NOT NULL,
    "rindeKgHa" DECIMAL(10,2) NOT NULL,
    "fechaCosecha" TIMESTAMP(3),
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "producciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cartas_porte" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "campoOrigenId" TEXT,
    "localidadOrigen" TEXT,
    "destino" TEXT NOT NULL,
    "localidadDestino" TEXT,
    "producto" "Cultivo" NOT NULL,
    "cosecha" TEXT,
    "pesoBrutoKg" DECIMAL(12,2) NOT NULL,
    "pesoTaraKg" DECIMAL(12,2) NOT NULL,
    "pesoNetoKg" DECIMAL(12,2) NOT NULL,
    "transportista" TEXT,
    "patenteCamion" TEXT,
    "patenteAcoplado" TEXT,
    "chofer" TEXT,
    "ctg" TEXT,
    "estado" "EstadoCarta" NOT NULL DEFAULT 'EN_TRANSITO',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cartas_porte_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "producciones" ADD CONSTRAINT "producciones_campoId_fkey" FOREIGN KEY ("campoId") REFERENCES "campos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartas_porte" ADD CONSTRAINT "cartas_porte_campoOrigenId_fkey" FOREIGN KEY ("campoOrigenId") REFERENCES "campos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
