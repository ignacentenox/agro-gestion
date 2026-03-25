"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Error al iniciar sesión");
				return;
			}

			router.push("/");
			router.refresh();
		} catch {
			setError("Error de conexión");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative">
			{/* Theme toggle en esquina */}
			<div className="absolute top-4 right-4">
				<ThemeToggle collapsed />
			</div>

			<Card className="w-full max-w-md shadow-xl border-gray-200 dark:border-gray-700 dark:bg-slate-800">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4">
						<Image
							src="/logo.svg"
							alt="Agro Gestión"
							width={120}
							height={132}
							priority
						/>
					</div>
					<CardTitle className="text-2xl text-purple-700 dark:text-purple-400">
						Agro Gestión
					</CardTitle>
					<CardDescription className="dark:text-gray-400">
						Sistema de gestión agropecuaria
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<div className="rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-600 dark:text-red-400">
								{error}
							</div>
						)}
						<div className="space-y-2">
							<Label htmlFor="email" className="dark:text-gray-300">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="usuario@agrogestion.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="dark:bg-slate-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-500"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password" className="dark:text-gray-300">Contraseña</Label>
							<Input
								id="password"
								type="password"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="dark:bg-slate-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-500"
							/>
						</div>
						<Button
							type="submit"
							className="w-full bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white"
							disabled={loading}
						>
							{loading ? "Ingresando..." : "Ingresar"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
