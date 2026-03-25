import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const cliente = await prisma.cliente.findUnique({ where: { id } });
	if (!cliente) {
		return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
	}
	return NextResponse.json(cliente);
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	try {
		const body = await request.json();
		const cliente = await prisma.cliente.update({
			where: { id },
			data: body,
		});
		return NextResponse.json(cliente);
	} catch {
		return NextResponse.json({ error: "Error al actualizar cliente" }, { status: 500 });
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	try {
		await prisma.cliente.update({
			where: { id },
			data: { active: false },
		});
		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: "Error al eliminar cliente" }, { status: 500 });
	}
}
