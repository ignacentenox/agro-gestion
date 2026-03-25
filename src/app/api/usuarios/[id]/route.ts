import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const user = await getCurrentUser();
		if (!user || user.role !== "ADMIN") {
			return NextResponse.json({ error: "No autorizado" }, { status: 403 });
		}

		const { id } = await params;
		const body = await request.json();
		const { active } = body;

		const updated = await prisma.user.update({
			where: { id },
			data: { active },
			select: { id: true, email: true, name: true, role: true, active: true },
		});

		return NextResponse.json(updated);
	} catch {
		return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
	}
}
