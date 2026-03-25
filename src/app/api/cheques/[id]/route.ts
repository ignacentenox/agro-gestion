import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const { searchParams } = new URL(request.url);
	const tipo = searchParams.get("tipo");

	try {
		if (tipo === "recibido") {
			const cheque = await prisma.chequeRecibido.findUnique({ where: { id } });
			if (!cheque) return NextResponse.json({ error: "Cheque no encontrado" }, { status: 404 });
			return NextResponse.json(cheque);
		}
		const cheque = await prisma.chequeEmitido.findUnique({ where: { id } });
		if (!cheque) return NextResponse.json({ error: "Cheque no encontrado" }, { status: 404 });
		return NextResponse.json(cheque);
	} catch {
		return NextResponse.json({ error: "Error al buscar cheque" }, { status: 500 });
	}
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	try {
		const body = await request.json();
		const { tipo, ...data } = body;

		if (tipo === "recibido") {
			const cheque = await prisma.chequeRecibido.update({ where: { id }, data });
			return NextResponse.json(cheque);
		}
		const cheque = await prisma.chequeEmitido.update({ where: { id }, data });
		return NextResponse.json(cheque);
	} catch {
		return NextResponse.json({ error: "Error al actualizar cheque" }, { status: 500 });
	}
}
