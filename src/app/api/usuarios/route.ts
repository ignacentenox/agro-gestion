import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export async function GET() {
	const user = await getCurrentUser();
	if (!user || user.role !== "ADMIN") {
		return NextResponse.json({ error: "No autorizado" }, { status: 403 });
	}

	const usuarios = await prisma.user.findMany({
		where: { id: { not: user.id } },
		select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
		orderBy: { name: "asc" },
	});

	return NextResponse.json(usuarios);
}

export async function POST(request: Request) {
	try {
		const user = await getCurrentUser();
		if (!user || user.role !== "ADMIN") {
			return NextResponse.json({ error: "No autorizado" }, { status: 403 });
		}

		const body = await request.json();
		const { email, name, password, role } = body;

		if (!email || !name || !password) {
			return NextResponse.json(
				{ error: "Email, nombre y contraseña son requeridos" },
				{ status: 400 }
			);
		}

		const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
		if (existing) {
			return NextResponse.json(
				{ error: "Ya existe un usuario con ese email" },
				{ status: 409 }
			);
		}

		const hashed = await hashPassword(password);
		const newUser = await prisma.user.create({
			data: {
				email: email.toLowerCase().trim(),
				name,
				password: hashed,
				role: role === "ADMIN" ? "ADMIN" : "EMPLEADO",
			},
			select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
		});

		return NextResponse.json(newUser, { status: 201 });
	} catch {
		return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
	}
}
