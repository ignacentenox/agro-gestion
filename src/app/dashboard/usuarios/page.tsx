"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, UserCheck, UserX, Shield, Users as UsersIcon } from "lucide-react";
import { useIsAdmin } from "@/components/user-provider";
import { useRouter } from "next/navigation";

interface Usuario {
	id: string;
	email: string;
	name: string;
	role: string;
	active: boolean;
	createdAt: string;
}

export default function UsuariosPage() {
	const [usuarios, setUsuarios] = useState<Usuario[]>([]);
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [form, setForm] = useState({ email: "", name: "", password: "", role: "EMPLEADO" });
	const isAdmin = useIsAdmin();
	const router = useRouter();

	useEffect(() => {
		if (!isAdmin) {
			router.push("/");
			return;
		}
		loadUsuarios();
	}, [isAdmin, router]);

	async function loadUsuarios() {
		const res = await fetch("/api/usuarios");
		if (res.ok) setUsuarios(await res.json());
	}

	async function toggleActive(id: string, active: boolean) {
		const res = await fetch(`/api/usuarios/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ active: !active }),
		});
		if (res.ok) loadUsuarios();
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);
		const res = await fetch("/api/usuarios", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(form),
		});
		if (res.ok) {
			setOpen(false);
			setForm({ email: "", name: "", password: "", role: "EMPLEADO" });
			loadUsuarios();
		} else {
			const data = await res.json();
			setError(data.error || "Error al crear usuario");
		}
		setLoading(false);
	}

	if (!isAdmin) return null;

	return (
		<div>
			<div className="flex items-center justify-between mb-6 flex-wrap gap-2">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white">Usuarios</h1>
					<p className="text-gray-500 dark:text-gray-400 mt-1">Gestión de empleados y permisos</p>
				</div>
				<Button onClick={() => { setError(""); setOpen(true); }} className="shadow-md">
					<Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
				</Button>
			</div>

			<Card className="overflow-x-auto rounded-xl shadow-sm">
				<CardContent className="p-0">
					<Table className="min-w-[600px]">
						<TableHeader>
							<TableRow>
								<TableHead>Nombre</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Rol</TableHead>
								<TableHead>Estado</TableHead>
								<TableHead className="text-right">Acciones</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{usuarios.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5} className="text-center py-8 text-gray-400">
										<UsersIcon className="mx-auto h-8 w-8 mb-2 opacity-40" />
										No hay otros usuarios registrados
									</TableCell>
								</TableRow>
							) : usuarios.map((u) => (
								<TableRow key={u.id} className="transition-colors hover:bg-purple-50/60 dark:hover:bg-purple-900/20 border-b last:border-b-0">
									<TableCell className="font-medium">{u.name}</TableCell>
									<TableCell>{u.email}</TableCell>
									<TableCell>
										<Badge className={u.role === "ADMIN" ? "bg-purple-600 text-white px-3 py-1 text-xs font-semibold" : "bg-gray-300 text-gray-800 px-3 py-1 text-xs font-semibold"}>
											<Shield className="mr-1 h-3 w-3" />
											{u.role === "ADMIN" ? "Admin" : "Empleado"}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge className={u.active ? "bg-green-600 text-white px-3 py-1 text-xs font-semibold" : "bg-red-500 text-white px-3 py-1 text-xs font-semibold"}>
											{u.active ? "Activo" : "Inactivo"}
										</Badge>
									</TableCell>
									<TableCell className="text-right">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => toggleActive(u.id, u.active)}
											className={u.active ? "text-red-500 hover:text-red-700 font-semibold" : "text-green-600 hover:text-green-800 font-semibold"}
											title={u.active ? "Desactivar usuario" : "Activar usuario"}
										>
											{u.active ? <UserX className="h-4 w-4 mr-1" /> : <UserCheck className="h-4 w-4 mr-1" />}
											<span className="hidden sm:inline">{u.active ? "Desactivar" : "Activar"}</span>
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Nuevo Usuario</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</p>}
						<div>
							<Label>Nombre</Label>
							<Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
						</div>
						<div>
							<Label>Email</Label>
							<Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
						</div>
						<div>
							<Label>Contraseña</Label>
							<Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={4} />
						</div>
						<div>
							<Label>Rol</Label>
							<Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="EMPLEADO">Empleado</SelectItem>
									<SelectItem value="ADMIN">Administrador</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
							<Button type="submit" disabled={loading}>{loading ? "Creando..." : "Crear Usuario"}</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
