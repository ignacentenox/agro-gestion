import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const clienteId = searchParams.get("clienteId");

	if (!clienteId) {
		return NextResponse.json({ error: "clienteId es requerido" }, { status: 400 });
	}

	const movimientos = await prisma.cuentaCorrienteCliente.findMany({
		where: { clienteId },
		include: { cliente: { select: { razonSocial: true, cuit: true } } },
		orderBy: { fecha: "asc" },
	});

	return NextResponse.json(movimientos);
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { clienteId, fecha, concepto, tipo, debe, haber, referencia, observaciones } = body;

		if (!clienteId || !fecha || !concepto || !tipo) {
			return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
		}

		const lastMovimiento = await prisma.cuentaCorrienteCliente.findFirst({
			where: { clienteId },
			orderBy: { fecha: "desc" },
		});

		const saldoAnterior = lastMovimiento ? Number(lastMovimiento.saldo) : 0;
		const debeNum = Number(debe || 0);
		const haberNum = Number(haber || 0);
		// Debe = cliente nos debe más | Haber = cliente paga
		const nuevoSaldo = saldoAnterior + debeNum - haberNum;

		const movimiento = await prisma.cuentaCorrienteCliente.create({
			data: {
				clienteId,
				fecha: new Date(fecha),
				concepto,
				tipo,
				debe: debeNum,
				haber: haberNum,
				saldo: nuevoSaldo,
				referencia: referencia || null,
				observaciones: observaciones || null,
			},
		});

		return NextResponse.json(movimiento, { status: 201 });
	} catch {
		return NextResponse.json({ error: "Error al crear movimiento" }, { status: 500 });
	}
}
