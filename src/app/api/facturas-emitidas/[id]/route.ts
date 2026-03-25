import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const factura = await prisma.facturaEmitida.findUnique({
		where: { id },
		include: { cliente: true },
	});
	if (!factura) {
		return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
	}
	return NextResponse.json(factura);
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	try {
		const body = await request.json();
		if (body.fecha) body.fecha = new Date(body.fecha);
		const factura = await prisma.facturaEmitida.update({
			where: { id },
			data: body,
			include: { cliente: { select: { razonSocial: true, cuit: true } } },
		});
		return NextResponse.json(factura);
	} catch {
		return NextResponse.json({ error: "Error al actualizar factura" }, { status: 500 });
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	try {
		await prisma.facturaEmitida.delete({ where: { id } });
		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: "Error al eliminar factura" }, { status: 500 });
	}
}
