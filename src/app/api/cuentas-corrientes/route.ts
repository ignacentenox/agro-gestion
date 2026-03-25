import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const proveedorId = searchParams.get("proveedorId");

	if (!proveedorId) {
		return NextResponse.json({ error: "proveedorId es requerido" }, { status: 400 });
	}

	const movimientos = await prisma.cuentaCorriente.findMany({
		where: { proveedorId },
		include: { proveedor: { select: { razonSocial: true, cuit: true } } },
		orderBy: { fecha: "asc" },
	});

	return NextResponse.json(movimientos);
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { proveedorId, fecha, concepto, tipo, debe, haber, referencia, observaciones } = body;

		if (!proveedorId || !fecha || !concepto || !tipo) {
			return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
		}

		// Calculate running balance
		const lastMovimiento = await prisma.cuentaCorriente.findFirst({
			where: { proveedorId },
			orderBy: { fecha: "desc" },
		});

		const saldoAnterior = lastMovimiento ? Number(lastMovimiento.saldo) : 0;
		const debeNum = Number(debe || 0);
		const haberNum = Number(haber || 0);
		const nuevoSaldo = saldoAnterior + debeNum - haberNum;

		const movimiento = await prisma.cuentaCorriente.create({
			data: {
				proveedorId,
				fecha: new Date(fecha),
				concepto,
				tipo,
				debe: debeNum,
				haber: haberNum,
				saldo: nuevoSaldo,
				referencia,
				observaciones,
			},
		});

		return NextResponse.json(movimiento, { status: 201 });
	} catch {
		return NextResponse.json({ error: "Error al crear movimiento" }, { status: 500 });
	}
}
