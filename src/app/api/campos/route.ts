import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
	const campos = await prisma.campo.findMany({
		where: { active: true },
		include: {
			producciones: { orderBy: { fechaCosecha: "desc" } },
		},
		orderBy: { nombre: "asc" },
	});
	return NextResponse.json(campos);
}

export async function POST(req: Request) {
	const data = await req.json();
	const { nombre, ubicacion, hectareas, tipo, propietario, costoAlquiler, observaciones, latitud, longitud } = data;

	if (!nombre || !hectareas || !tipo) {
		return NextResponse.json({ error: "Nombre, hectáreas y tipo son obligatorios" }, { status: 400 });
	}

	const campo = await prisma.campo.create({
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
	return NextResponse.json(campo, { status: 201 });
}
