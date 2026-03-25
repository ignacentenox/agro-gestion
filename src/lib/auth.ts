import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SECRET_KEY = new TextEncoder().encode(
	process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production"
);

const COOKIE_NAME = "agro-session";

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 12);
}

export async function verifyPassword(
	password: string,
	hashed: string
): Promise<boolean> {
	return bcrypt.compare(password, hashed);
}

export async function createSession(userId: string, role: string) {
	const token = await new SignJWT({ userId, role })
		.setProtectedHeader({ alg: "HS256" })
		.setExpirationTime("8h")
		.sign(SECRET_KEY);

	const cookieStore = await cookies();
	cookieStore.set(COOKIE_NAME, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 60 * 60 * 8, // 8 hours
		path: "/",
	});

	return token;
}

export async function getSession() {
	const cookieStore = await cookies();
	const token = cookieStore.get(COOKIE_NAME)?.value;
	if (!token) return null;

	try {
		const { payload } = await jwtVerify(token, SECRET_KEY);
		return payload as { userId: string; role: string };
	} catch {
		return null;
	}
}

export async function getCurrentUser() {
	const session = await getSession();
	if (!session) return null;

	const user = await prisma.user.findUnique({
		where: { id: session.userId },
		select: { id: true, email: true, name: true, role: true, active: true },
	});

	if (!user || !user.active) return null;
	return user;
}

export async function destroySession() {
	const cookieStore = await cookies();
	cookieStore.delete(COOKIE_NAME);
}
