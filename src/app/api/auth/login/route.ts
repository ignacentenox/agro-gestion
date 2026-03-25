
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { email, password } = body;
		console.log("[LOGIN] Intento de login:", email);

		if (!email || !password) {
			console.log("[LOGIN] Faltan email o password");
			return NextResponse.json(
				{ error: "Email y contraseña son requeridos" },
				{ status: 400 }
			);
		}

		const user = await prisma.user.findUnique({
			where: { email: email.toLowerCase().trim() },
		});
		console.log("[LOGIN] Usuario encontrado:", user ? user.email : null, "Activo:", user ? user.active : null);

		if (!user) {
			console.log("[LOGIN] Usuario no encontrado");
			return NextResponse.json(
				{ error: "Credenciales inválidas" },
				{ status: 401 }
			);
		}
		if (!user.active) {
			console.log("[LOGIN] Usuario inactivo");
			return NextResponse.json(
				{ error: "Usuario inactivo" },
				{ status: 401 }
			);
		}

		const isValid = await verifyPassword(password, user.password);
		console.log("[LOGIN] Password válido:", isValid);
		if (!isValid) {
			console.log("[LOGIN] Password incorrecto");
			return NextResponse.json(
				{ error: "Credenciales inválidas" },
				{ status: 401 }
			);
		}

		await createSession(user.id, user.role);
		console.log("[LOGIN] Sesión creada para:", user.email, "Rol:", user.role);

		return NextResponse.json({
			user: { id: user.id, email: user.email, name: user.name, role: user.role },
		});
	} catch (err) {
		console.log("[LOGIN] Error interno:", err);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}
