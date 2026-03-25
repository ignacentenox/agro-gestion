import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const tipo = searchParams.get("tipo"); // "emitidas" | "recibidas"
	const mes = searchParams.get("mes");
	const anio = searchParams.get("anio");

	const where: Record<string, unknown> = {};
	if (mes && anio) {
		const firstDay = new Date(Number(anio), Number(mes) - 1, 1);
		const lastDay = new Date(Number(anio), Number(mes), 0);
		where.fecha = { gte: firstDay, lte: lastDay };
	}

	if (tipo === "recibidas") {
		const liquidaciones = await prisma.liquidacionRecibida.findMany({
			where,
			include: { proveedor: { select: { razonSocial: true, cuit: true } } },
			orderBy: { fecha: "desc" },
		});
		return NextResponse.json(liquidaciones);
	}

	const liquidaciones = await prisma.liquidacionEmitida.findMany({
		where,
		include: { cliente: { select: { razonSocial: true, cuit: true } } },
		orderBy: { fecha: "desc" },
	});
	return NextResponse.json(liquidaciones);
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { tipo, ...data } = body;

		if (!data.numero || !data.fecha || !data.concepto || !data.netoGravado || !data.alicuotaIva || !data.montoIva || !data.total) {
			return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
		}

		const commonData = {
			numero: Number(data.numero),
			fecha: new Date(data.fecha),
			concepto: data.concepto,
			descripcion: data.descripcion,
			netoGravado: Number(data.netoGravado),
			alicuotaIva: Number(data.alicuotaIva),
			montoIva: Number(data.montoIva),
			retenciones: Number(data.retenciones || 0),
			otrosConceptos: Number(data.otrosConceptos || 0),
			total: Number(data.total),
			observaciones: data.observaciones,
		};

		if (tipo === "recibida") {
			if (!data.proveedorId) {
				return NextResponse.json({ error: "Proveedor es requerido" }, { status: 400 });
			}
			const liquidacion = await prisma.liquidacionRecibida.create({
				data: { ...commonData, proveedorId: data.proveedorId },
				include: { proveedor: { select: { razonSocial: true, cuit: true } } },
			});
			return NextResponse.json(liquidacion, { status: 201 });
		}

		if (!data.clienteId) {
			return NextResponse.json({ error: "Cliente es requerido" }, { status: 400 });
		}
		const liquidacion = await prisma.liquidacionEmitida.create({
			data: { ...commonData, clienteId: data.clienteId },
			include: { cliente: { select: { razonSocial: true, cuit: true } } },
		});
		return NextResponse.json(liquidacion, { status: 201 });
	} catch {
		return NextResponse.json({ error: "Error al crear liquidación" }, { status: 500 });
	}
}
