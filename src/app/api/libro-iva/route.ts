import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const mes = Number(searchParams.get("mes") || new Date().getMonth() + 1);
	const anio = Number(searchParams.get("anio") || new Date().getFullYear());

	const firstDay = new Date(anio, mes - 1, 1);
	const lastDay = new Date(anio, mes, 0);

	const dateFilter = { fecha: { gte: firstDay, lte: lastDay } };

	const [facturasEmitidas, facturasRecibidas, liquidacionesEmitidas, liquidacionesRecibidas] =
		await Promise.all([
			prisma.facturaEmitida.findMany({
				where: dateFilter,
				include: { cliente: { select: { razonSocial: true, cuit: true } } },
				orderBy: { fecha: "asc" },
			}),
			prisma.facturaRecibida.findMany({
				where: dateFilter,
				include: { proveedor: { select: { razonSocial: true, cuit: true } } },
				orderBy: { fecha: "asc" },
			}),
			prisma.liquidacionEmitida.findMany({
				where: dateFilter,
				include: { cliente: { select: { razonSocial: true, cuit: true } } },
				orderBy: { fecha: "asc" },
			}),
			prisma.liquidacionRecibida.findMany({
				where: dateFilter,
				include: { proveedor: { select: { razonSocial: true, cuit: true } } },
				orderBy: { fecha: "asc" },
			}),
		]);

	// IVA Ventas (Débito Fiscal)
	const ventasFacturas = facturasEmitidas.map((f: any) => ({
		id: f.id,
		tipo: "Factura" as const,
		tipoComprobante: f.tipoComprobante,
		fecha: f.fecha,
		entidad: f.cliente.razonSocial,
		cuit: f.cliente.cuit,
		netoGravado: Number(f.netoGravado),
		netoNoGravado: Number(f.netoNoGravado),
		netoExento: Number(f.netoExento),
		alicuotaIva: Number(f.alicuotaIva),
		montoIva: Number(f.montoIva),
		percepcionIva: Number(f.percepcionIva),
		percepcionIIBB: Number(f.percepcionIIBB),
		total: Number(f.total),
	}));

	const ventasLiquidaciones = liquidacionesEmitidas.map((l: any) => ({
		id: l.id,
		tipo: "Liquidación" as const,
		tipoComprobante: null,
		fecha: l.fecha,
		entidad: l.cliente.razonSocial,
		cuit: l.cliente.cuit,
		netoGravado: Number(l.netoGravado),
		netoNoGravado: 0,
		netoExento: 0,
		alicuotaIva: Number(l.alicuotaIva),
		montoIva: Number(l.montoIva),
		percepcionIva: 0,
		percepcionIIBB: 0,
		total: Number(l.total),
	}));

	// IVA Compras (Crédito Fiscal)
	const comprasFacturas = facturasRecibidas.map((f: any) => ({
		id: f.id,
		tipo: "Factura" as const,
		tipoComprobante: f.tipoComprobante,
		fecha: f.fecha,
		entidad: f.proveedor.razonSocial,
		cuit: f.proveedor.cuit,
		netoGravado: Number(f.netoGravado),
		netoNoGravado: Number(f.netoNoGravado),
		netoExento: Number(f.netoExento),
		alicuotaIva: Number(f.alicuotaIva),
		montoIva: Number(f.montoIva),
		percepcionIva: Number(f.percepcionIva),
		percepcionIIBB: Number(f.percepcionIIBB),
		total: Number(f.total),
	}));

	const comprasLiquidaciones = liquidacionesRecibidas.map((l: any) => ({
		id: l.id,
		tipo: "Liquidación" as const,
		tipoComprobante: null,
		fecha: l.fecha,
		entidad: l.proveedor.razonSocial,
		cuit: l.proveedor.cuit,
		netoGravado: Number(l.netoGravado),
		netoNoGravado: 0,
		netoExento: 0,
		alicuotaIva: Number(l.alicuotaIva),
		montoIva: Number(l.montoIva),
		percepcionIva: 0,
		percepcionIIBB: 0,
		total: Number(l.total),
	}));

	const ventas = [...ventasFacturas, ...ventasLiquidaciones].sort(
		(a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
	);

	const compras = [...comprasFacturas, ...comprasLiquidaciones].sort(
		(a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
	);

	const totalIvaVenta = ventas.reduce((sum, v) => sum + v.montoIva, 0);
	const totalIvaCompra = compras.reduce((sum, c) => sum + c.montoIva, 0);
	const totalPercepcionIvaCompra = compras.reduce((sum, c) => sum + c.percepcionIva, 0);
	const totalPercepcionIvaVenta = ventas.reduce((sum, v) => sum + v.percepcionIva, 0);

	return NextResponse.json({
		mes,
		anio,
		ventas,
		compras,
		resumen: {
			totalIvaVenta,
			totalIvaCompra,
			totalPercepcionIvaVenta,
			totalPercepcionIvaCompra,
			debitoFiscal: totalIvaVenta + totalPercepcionIvaVenta,
			creditoFiscal: totalIvaCompra + totalPercepcionIvaCompra,
			posicionIva: (totalIvaVenta + totalPercepcionIvaVenta) - (totalIvaCompra + totalPercepcionIvaCompra),
		},
	});
}
