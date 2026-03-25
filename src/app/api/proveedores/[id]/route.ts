import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const proveedor = await prisma.proveedor.findUnique({ where: { id } });
	if (!proveedor) {
		return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });
	}
	return NextResponse.json(proveedor);
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	try {
		const body = await request.json();
		const proveedor = await prisma.proveedor.update({
			where: { id },
			data: body,
		});
		return NextResponse.json(proveedor);
	} catch {
		return NextResponse.json({ error: "Error al actualizar proveedor" }, { status: 500 });
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	try {
		await prisma.proveedor.update({
			where: { id },
			data: { active: false },
		});
		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: "Error al eliminar proveedor" }, { status: 500 });
	}
}
