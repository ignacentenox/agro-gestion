import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const campoId = searchParams.get("campoId");

	const producciones = await prisma.produccion.findMany({
		where: campoId ? { campoId } : {},
		include: { campo: { select: { nombre: true } } },
		orderBy: { fechaCosecha: "desc" },
	});
	return NextResponse.json(producciones);
}

export async function POST(req: Request) {
	const data = await req.json();
	const { campoId, cultivo, campania, hectareas, kgCosechados, fechaCosecha, observaciones } = data;

	if (!campoId || !cultivo || !campania || !hectareas) {
		return NextResponse.json({ error: "Campo, cultivo, campaña y hectáreas son obligatorios" }, { status: 400 });
	}

	const ha = Number(hectareas);
	const kg = Number(kgCosechados) || 0;
	const rinde = ha > 0 && kg > 0 ? kg / ha : 0;

	const produccion = await prisma.produccion.create({
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
	return NextResponse.json(produccion, { status: 201 });
}
