import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
	process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production"
);

const publicPaths = ["/login", "/api/auth/login"];

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Allow public paths
	if (publicPaths.some((p) => pathname.startsWith(p))) {
		return NextResponse.next();
	}

	// Allow static files and Next.js internals
	if (
		pathname.startsWith("/_next") ||
		pathname.startsWith("/favicon") ||
		pathname.includes(".")
	) {
		return NextResponse.next();
	}

	const token = request.cookies.get("agro-session")?.value;

	if (!token) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	try {
		await jwtVerify(token, SECRET_KEY);
		return NextResponse.next();
	} catch {
		return NextResponse.redirect(new URL("/login", request.url));
	}
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
