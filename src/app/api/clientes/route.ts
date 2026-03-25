import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const search = searchParams.get("search") || "";
	const active = searchParams.get("active") !== "false";

	const clientes = await prisma.cliente.findMany({
		where: {
			active,
			...(search && {
				OR: [
					{ razonSocial: { contains: search, mode: "insensitive" } },
					{ cuit: { contains: search } },
				],
			}),
		},
		orderBy: { razonSocial: "asc" },
	});

	return NextResponse.json(clientes);
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { razonSocial, cuit, condicionIva, direccion, telefono, email, observaciones } = body;

		if (!razonSocial || !cuit || !condicionIva) {
			return NextResponse.json(
				{ error: "Razón social, CUIT y condición de IVA son requeridos" },
				{ status: 400 }
			);
		}

		const cleanCuit = cuit.replace(/\D/g, "");
		if (cleanCuit.length !== 11) {
			return NextResponse.json(
				{ error: "El CUIT debe tener 11 dígitos" },
				{ status: 400 }
			);
		}

		const existing = await prisma.cliente.findUnique({ where: { cuit: cleanCuit } });
		if (existing) {
			return NextResponse.json(
				{ error: "Ya existe un cliente con ese CUIT" },
				{ status: 409 }
			);
		}

		const cliente = await prisma.cliente.create({
			data: { razonSocial, cuit: cleanCuit, condicionIva, direccion, telefono, email, observaciones },
		});

		return NextResponse.json(cliente, { status: 201 });
	} catch {
		return NextResponse.json({ error: "Error al crear cliente" }, { status: 500 });
	}
}
