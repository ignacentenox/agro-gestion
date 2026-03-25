import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const tipo = searchParams.get("tipo"); // "emitidos" | "recibidos"
	const estado = searchParams.get("estado");
	const mes = searchParams.get("mes");
	const anio = searchParams.get("anio");
	const bancoId = searchParams.get("bancoId");

	if (tipo === "recibidos") {
		const where: Record<string, unknown> = {};
		if (estado) where.estado = estado;
		if (bancoId) where.bancoOrigenId = bancoId;
		if (mes && anio) {
			const firstDay = new Date(Number(anio), Number(mes) - 1, 1);
			const lastDay = new Date(Number(anio), Number(mes), 0);
			where.fechaCobro = { gte: firstDay, lte: lastDay };
		}

		const cheques = await prisma.chequeRecibido.findMany({
			where,
			include: { cliente: { select: { razonSocial: true } }, bancoOrigen: { select: { nombre: true } } },
			orderBy: { fechaCobro: "asc" },
		});
		return NextResponse.json(cheques);
	}

	// Cheques emitidos
	const where: Record<string, unknown> = {};
	if (estado) where.estado = estado;
	if (bancoId) where.bancoId = bancoId;
	if (mes && anio) {
		const firstDay = new Date(Number(anio), Number(mes) - 1, 1);
		const lastDay = new Date(Number(anio), Number(mes), 0);
		where.fechaCobro = { gte: firstDay, lte: lastDay };
	}

	const cheques = await prisma.chequeEmitido.findMany({
		where,
		include: {
			proveedor: { select: { razonSocial: true } },
			banco: { select: { nombre: true } },
		},
		orderBy: { fechaCobro: "asc" },
	});
	return NextResponse.json(cheques);
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { tipo, ...data } = body;

		if (tipo === "recibido") {
			if (!data.numeroCheque || !data.bancoEmisor || !data.fecha || !data.fechaCobro || !data.clienteId || !data.monto) {
				return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
			}
			const cheque = await prisma.chequeRecibido.create({
				data: {
					bancoOrigenId: data.bancoOrigenId || null,
					numeroCheque: data.numeroCheque,
					bancoEmisor: data.bancoEmisor,
					fecha: new Date(data.fecha),
					fechaCobro: new Date(data.fechaCobro),
					clienteId: data.clienteId,
					concepto: data.concepto,
					monto: Number(data.monto),
					destino: data.destino,
					observaciones: data.observaciones,
				},
				include: { cliente: { select: { razonSocial: true } } },
			});
			return NextResponse.json(cheque, { status: 201 });
		}

		// Cheque emitido
		if (!data.bancoId || !data.numeroCheque || !data.fecha || !data.fechaCobro || !data.proveedorId || !data.monto) {
			return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
		}
		const cheque = await prisma.chequeEmitido.create({
			data: {
				bancoId: data.bancoId,
				numeroCheque: data.numeroCheque,
				fecha: new Date(data.fecha),
				fechaCobro: new Date(data.fechaCobro),
				proveedorId: data.proveedorId,
				concepto: data.concepto,
				monto: Number(data.monto),
				observaciones: data.observaciones,
			},
			include: { proveedor: { select: { razonSocial: true } }, banco: { select: { nombre: true } } },
		});
		return NextResponse.json(cheque, { status: 201 });
	} catch {
		return NextResponse.json({ error: "Error al crear cheque" }, { status: 500 });
	}
}
