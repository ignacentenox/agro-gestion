import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const data = await req.json();
	const { nombre, ubicacion, hectareas, tipo, propietario, costoAlquiler, observaciones, latitud, longitud } = data;

	const campo = await prisma.campo.update({
		where: { id },
		data: {
			nombre,
			ubicacion: ubicacion || null,
			latitud: latitud != null ? Number(latitud) : null,
			longitud: longitud != null ? Number(longitud) : null,
			hectareas: Number(hectareas),
			tipo,
			propietario: propietario || null,
			costoAlquiler: costoAlquiler ? Number(costoAlquiler) : null,
			observaciones: observaciones || null,
		},
	});
	return NextResponse.json(campo);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	await prisma.campo.update({ where: { id }, data: { active: false } });
	return NextResponse.json({ ok: true });
}
