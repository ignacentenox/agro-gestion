"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatCuit } from "@/lib/utils";
import { Plus, Search, Users } from "lucide-react";

const CONDICIONES_IVA = [
	{ value: "RESPONSABLE_INSCRIPTO", label: "Responsable Inscripto" },
	{ value: "MONOTRIBUTISTA", label: "Monotributista" },
	{ value: "EXENTO", label: "Exento" },
	{ value: "CONSUMIDOR_FINAL", label: "Consumidor Final" },
	{ value: "NO_CATEGORIZADO", label: "No Categorizado" },
];

interface Proveedor {
	id: string;
	razonSocial: string;
	cuit: string;
	condicionIva: string;
	direccion: string | null;
	telefono: string | null;
	email: string | null;
	observaciones: string | null;
	active: boolean;
}

export default function ProveedoresPage() {
	const [proveedores, setProveedores] = useState<Proveedor[]>([]);
	const [search, setSearch] = useState("");
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [form, setForm] = useState({
		razonSocial: "", cuit: "", condicionIva: "RESPONSABLE_INSCRIPTO",
		direccion: "", telefono: "", email: "", observaciones: "",
	});

	useEffect(() => { loadProveedores(); }, [search]);

	async function loadProveedores() {
		const res = await fetch(`/api/proveedores?search=${encodeURIComponent(search)}`);
		setProveedores(await res.json());
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		const res = await fetch("/api/proveedores", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(form),
		});
		if (res.ok) {
			setOpen(false);
			setForm({ razonSocial: "", cuit: "", condicionIva: "RESPONSABLE_INSCRIPTO", direccion: "", telefono: "", email: "", observaciones: "" });
			loadProveedores();
		} else {
			const data = await res.json();
			alert(data.error);
		}
		setLoading(false);
	}

	async function handleDelete(id: string) {
		if (!confirm("¿Desactivar este proveedor?")) return;
		await fetch(`/api/proveedores/${id}`, { method: "DELETE" });
		loadProveedores();
	}

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Proveedores</h1>
					<p className="text-gray-500 mt-1">{proveedores.length} proveedores registrados</p>
				</div>
				<Button onClick={() => setOpen(true)}>
					<Plus className="mr-2 h-4 w-4" /> Nuevo Proveedor
				</Button>
			</div>

			<Card className="mb-4">
				<CardContent className="pt-6">
					<div className="relative">
						<Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Buscar por razón social o CUIT..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-10"
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Razón Social</TableHead>
							<TableHead>CUIT</TableHead>
							<TableHead>Condición IVA</TableHead>
							<TableHead>Teléfono</TableHead>
							<TableHead>Email</TableHead>
							<TableHead></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{proveedores.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="text-center text-gray-400 py-8">
									<Users className="mx-auto h-8 w-8 mb-2 opacity-40" />
									No hay proveedores
								</TableCell>
							</TableRow>
						) : proveedores.map((p) => (
							<TableRow key={p.id}>
								<TableCell className="font-medium">{p.razonSocial}</TableCell>
								<TableCell className="font-mono">{formatCuit(p.cuit)}</TableCell>
								<TableCell>
									<Badge variant="secondary">
										{CONDICIONES_IVA.find((c) => c.value === p.condicionIva)?.label}
									</Badge>
								</TableCell>
								<TableCell>{p.telefono || "-"}</TableCell>
								<TableCell className="text-sm">{p.email || "-"}</TableCell>
								<TableCell>
									<Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>
										Desactivar
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Card>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader><DialogTitle>Nuevo Proveedor</DialogTitle></DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div><Label>Razón Social</Label><Input value={form.razonSocial} onChange={(e) => setForm({ ...form, razonSocial: e.target.value })} required /></div>
						<div><Label>CUIT</Label><Input value={form.cuit} onChange={(e) => setForm({ ...form, cuit: e.target.value })} placeholder="XX-XXXXXXXX-X" required /></div>
						<div>
							<Label>Condición IVA</Label>
							<Select value={form.condicionIva} onValueChange={(v) => setForm({ ...form, condicionIva: v })}>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>{CONDICIONES_IVA.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}</SelectContent>
							</Select>
						</div>
						<div><Label>Dirección</Label><Input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} /></div>
						<div className="grid grid-cols-2 gap-4">
							<div><Label>Teléfono</Label><Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></div>
							<div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
						</div>
						<div><Label>Observaciones</Label><Textarea value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} /></div>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
							<Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
