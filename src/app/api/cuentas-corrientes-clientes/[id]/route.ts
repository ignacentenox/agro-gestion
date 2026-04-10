import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const movimiento = await prisma.cuentaCorrienteCliente.findUnique({ where: { id } });
		if (!movimiento) {
			return NextResponse.json({ error: "Movimiento no encontrado" }, { status: 404 });
		}

		// Recalcular saldos posteriores
		const posteriores = await prisma.cuentaCorrienteCliente.findMany({
			where: { clienteId: movimiento.clienteId, fecha: { gt: movimiento.fecha } },
			orderBy: { fecha: "asc" },
		});

		const ajuste = Number(movimiento.debe) - Number(movimiento.haber);

		await prisma.$transaction([
			prisma.cuentaCorrienteCliente.delete({ where: { id } }),
			...posteriores.map((m) =>
				prisma.cuentaCorrienteCliente.update({
					where: { id: m.id },
					data: { saldo: Number(m.saldo) - ajuste },
				}),
			),
		]);

		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ error: "Error al eliminar movimiento" }, { status: 500 });
	}
}
