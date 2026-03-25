import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const mes = searchParams.get("mes");
	const anio = searchParams.get("anio");
	const clienteId = searchParams.get("clienteId");

	const where: Record<string, unknown> = {};

	if (mes && anio) {
		const firstDay = new Date(Number(anio), Number(mes) - 1, 1);
		const lastDay = new Date(Number(anio), Number(mes), 0);
		where.fecha = { gte: firstDay, lte: lastDay };
	}

	if (clienteId) where.clienteId = clienteId;

	const facturas = await prisma.facturaEmitida.findMany({
		where,
		include: { cliente: { select: { razonSocial: true, cuit: true } } },
		orderBy: { fecha: "desc" },
	});

	return NextResponse.json(facturas);
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const {
			tipoComprobante, fecha, clienteId,
			descripcion, netoGravado, netoNoGravado, netoExento,
			alicuotaIva, montoIva, percepcionIva, percepcionIIBB,
			otrosImpuestos, total, observaciones,
		} = body;

		if (!tipoComprobante || !fecha || !clienteId || !netoGravado || !alicuotaIva || !montoIva || !total) {
			return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
		}

		const factura = await prisma.facturaEmitida.create({
			data: {
				tipoComprobante,
				fecha: new Date(fecha), clienteId, descripcion,
				netoGravado: Number(netoGravado), netoNoGravado: Number(netoNoGravado || 0),
				netoExento: Number(netoExento || 0), alicuotaIva: Number(alicuotaIva),
				montoIva: Number(montoIva), percepcionIva: Number(percepcionIva || 0),
				percepcionIIBB: Number(percepcionIIBB || 0), otrosImpuestos: Number(otrosImpuestos || 0),
				total: Number(total), observaciones,
			},
			include: { cliente: { select: { razonSocial: true, cuit: true } } },
		});

		return NextResponse.json(factura, { status: 201 });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Error al crear factura";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
