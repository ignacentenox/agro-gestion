import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const user = await getCurrentUser();
		if (!user || user.role !== "ADMIN") {
			return NextResponse.json(
				{ error: "No autorizado" },
				{ status: 403 }
			);
		}

		const { id } = await params;
		const body = await request.json();
		const { nombre, sucursal, numeroCuenta, cbu, alias, tipoCuenta, saldoInicial } = body;

		if (!nombre || !numeroCuenta || !tipoCuenta) {
			return NextResponse.json(
				{ error: "Nombre, número de cuenta y tipo son requeridos" },
				{ status: 400 }
			);
		}

		const banco = await prisma.banco.update({
			where: { id },
			data: {
				nombre,
				sucursal: sucursal || null,
				numeroCuenta,
				cbu: cbu || null,
				alias: alias || null,
				tipoCuenta,
				saldoInicial: Number(saldoInicial || 0),
			},
		});

		return NextResponse.json(banco);
	} catch {
		return NextResponse.json(
			{ error: "Error al actualizar banco" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const user = await getCurrentUser();
		if (!user || user.role !== "ADMIN") {
			return NextResponse.json(
				{ error: "No autorizado" },
				{ status: 403 }
			);
		}

		const { id } = await params;

		await prisma.banco.update({
			where: { id },
			data: { active: false },
		});

		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json(
			{ error: "Error al eliminar banco" },
			{ status: 500 }
		);
	}
}
