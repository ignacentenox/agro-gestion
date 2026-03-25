import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const data = await req.json();
	const { campoId, cultivo, campania, hectareas, kgCosechados, fechaCosecha, observaciones } = data;

	const ha = Number(hectareas);
	const kg = Number(kgCosechados) || 0;
	const rinde = ha > 0 && kg > 0 ? kg / ha : 0;

	const produccion = await prisma.produccion.update({
		where: { id },
		data: {
			campoId,
			cultivo,
			campania,
			hectareas: ha,
			kgCosechados: kg,
			rindeKgHa: rinde,
			fechaCosecha: fechaCosecha ? new Date(fechaCosecha) : null,
			observaciones: observaciones || null,
		},
	});
	return NextResponse.json(produccion);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	await prisma.produccion.delete({ where: { id } });
	return NextResponse.json({ ok: true });
}
