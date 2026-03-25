"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { Plus, Landmark, Pencil, Trash2 } from "lucide-react";
import { useIsAdmin } from "@/components/user-provider";

interface Banco {
	id: string;
	nombre: string;
	sucursal: string | null;
	numeroCuenta: string;
	cbu: string | null;
	alias: string | null;
	tipoCuenta: string;
	saldoInicial: string;
}

const emptyForm = {
	nombre: "", sucursal: "", numeroCuenta: "", cbu: "", alias: "",
	tipoCuenta: "CUENTA_CORRIENTE", saldoInicial: "0",
};

export default function BancosPage() {
	const [bancos, setBancos] = useState<Banco[]>([]);
	const [open, setOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [form, setForm] = useState(emptyForm);
	const isAdmin = useIsAdmin();

	useEffect(() => { loadBancos(); }, []);

	async function loadBancos() {
		const res = await fetch("/api/bancos");
		setBancos(await res.json());
	}

	function handleNew() {
		setEditingId(null);
		setForm(emptyForm);
		setOpen(true);
	}

	function handleEdit(b: Banco) {
		setEditingId(b.id);
		setForm({
			nombre: b.nombre,
			sucursal: b.sucursal || "",
			numeroCuenta: b.numeroCuenta,
			cbu: b.cbu || "",
			alias: b.alias || "",
			tipoCuenta: b.tipoCuenta,
			saldoInicial: String(b.saldoInicial),
		});
		setOpen(true);
	}

	async function handleDelete(id: string) {
		if (!confirm("¿Eliminar este banco?")) return;
		const res = await fetch(`/api/bancos/${id}`, { method: "DELETE" });
		if (res.ok) loadBancos();
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		const url = editingId ? `/api/bancos/${editingId}` : "/api/bancos";
		const method = editingId ? "PUT" : "POST";
		const res = await fetch(url, {
			method,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(form),
		});
		if (res.ok) {
			setOpen(false);
			setForm(emptyForm);
			setEditingId(null);
			loadBancos();
		}
		setLoading(false);
	}

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bancos</h1>
					<p className="text-gray-500 dark:text-gray-400 mt-1">Cuentas bancarias registradas</p>
				</div>
				{isAdmin && (
					<Button onClick={handleNew}>
						<Plus className="mr-2 h-4 w-4" /> Nuevo Banco
					</Button>
				)}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{bancos.length === 0 ? (
					<Card className="col-span-full">
						<CardContent className="pt-6 text-center text-gray-400">
							<Landmark className="mx-auto h-8 w-8 mb-2 opacity-40" />
							No hay bancos registrados
						</CardContent>
					</Card>
				) : bancos.map((b) => (
					<Card key={b.id} className="relative group">
						<CardHeader>
							<div className="flex items-start justify-between">
								<div>
									<CardTitle className="text-lg">{b.nombre}</CardTitle>
									{b.sucursal && <p className="text-sm text-gray-500 dark:text-gray-400">Sucursal: {b.sucursal}</p>}
								</div>
								{isAdmin && (
									<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
										<Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(b)}>
											<Pencil className="h-4 w-4" />
										</Button>
										<Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDelete(b.id)}>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								)}
							</div>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-gray-500 dark:text-gray-400">Tipo:</span>
								<span>{b.tipoCuenta === "CUENTA_CORRIENTE" ? "Cuenta Corriente" : "Caja de Ahorro"}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-500 dark:text-gray-400">Nro. Cuenta:</span>
								<span className="font-mono">{b.numeroCuenta}</span>
							</div>
							{b.cbu && (
								<div className="flex justify-between">
									<span className="text-gray-500 dark:text-gray-400">CBU:</span>
									<span className="font-mono text-xs">{b.cbu}</span>
								</div>
							)}
							{b.alias && (
								<div className="flex justify-between">
									<span className="text-gray-500 dark:text-gray-400">Alias:</span>
									<span>{b.alias}</span>
								</div>
							)}
							<div className="flex justify-between pt-2 border-t dark:border-gray-700">
								<span className="text-gray-500 dark:text-gray-400">Saldo Inicial:</span>
								<span className="font-semibold">{formatCurrency(b.saldoInicial)}</span>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{editingId ? "Editar Banco" : "Nuevo Banco"}</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div><Label>Nombre del Banco</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required /></div>
						<div><Label>Sucursal</Label><Input value={form.sucursal} onChange={(e) => setForm({ ...form, sucursal: e.target.value })} /></div>
						<div>
							<Label>Tipo de Cuenta</Label>
							<Select value={form.tipoCuenta} onValueChange={(v) => setForm({ ...form, tipoCuenta: v })}>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="CUENTA_CORRIENTE">Cuenta Corriente</SelectItem>
									<SelectItem value="CAJA_AHORRO">Caja de Ahorro</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div><Label>Número de Cuenta</Label><Input value={form.numeroCuenta} onChange={(e) => setForm({ ...form, numeroCuenta: e.target.value })} required /></div>
						<div><Label>CBU</Label><Input value={form.cbu} onChange={(e) => setForm({ ...form, cbu: e.target.value })} /></div>
						<div><Label>Alias</Label><Input value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })} /></div>
						<div><Label>Saldo Inicial</Label><Input type="number" step="0.01" value={form.saldoInicial} onChange={(e) => setForm({ ...form, saldoInicial: e.target.value })} /></div>
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
