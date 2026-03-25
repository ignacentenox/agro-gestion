import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const search = searchParams.get("search") || "";
	const active = searchParams.get("active") !== "false";

	const proveedores = await prisma.proveedor.findMany({
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

	return NextResponse.json(proveedores);
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

		const existing = await prisma.proveedor.findUnique({ where: { cuit: cleanCuit } });
		if (existing) {
			return NextResponse.json(
				{ error: "Ya existe un proveedor con ese CUIT" },
				{ status: 409 }
			);
		}

		const proveedor = await prisma.proveedor.create({
			data: { razonSocial, cuit: cleanCuit, condicionIva, direccion, telefono, email, observaciones },
		});

		return NextResponse.json(proveedor, { status: 201 });
	} catch {
		return NextResponse.json({ error: "Error al crear proveedor" }, { status: 500 });
	}
}
