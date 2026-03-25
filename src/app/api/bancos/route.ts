import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const active = searchParams.get("active") !== "false";

	const bancos = await prisma.banco.findMany({
		where: { active },
		orderBy: { nombre: "asc" },
	});

	return NextResponse.json(bancos);
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { nombre, sucursal, numeroCuenta, cbu, alias, tipoCuenta, saldoInicial } = body;

		if (!nombre || !numeroCuenta || !tipoCuenta) {
			return NextResponse.json({ error: "Nombre, número de cuenta y tipo son requeridos" }, { status: 400 });
		}

		const banco = await prisma.banco.create({
			data: {
				nombre, sucursal, numeroCuenta, cbu, alias, tipoCuenta,
				saldoInicial: Number(saldoInicial || 0),
			},
		});

		return NextResponse.json(banco, { status: 201 });
	} catch {
		return NextResponse.json({ error: "Error al crear banco" }, { status: 500 });
	}
}
