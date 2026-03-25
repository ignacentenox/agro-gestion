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
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Users } from "lucide-react";

interface Movimiento {
	id: string;
	fecha: string;
	concepto: string;
	tipo: string;
	debe: string;
	haber: string;
	saldo: string;
	referencia: string | null;
	observaciones: string | null;
}

interface Proveedor {
	id: string;
	razonSocial: string;
	cuit: string;
}

const TIPOS_MOV = [
	{ value: "FACTURA", label: "Factura" },
	{ value: "PAGO", label: "Pago" },
	{ value: "NOTA_CREDITO", label: "Nota de Crédito" },
	{ value: "NOTA_DEBITO", label: "Nota de Débito" },
	{ value: "AJUSTE", label: "Ajuste" },
];

export default function CuentasCorrientesPage() {
	const [proveedores, setProveedores] = useState<Proveedor[]>([]);
	const [proveedorId, setProveedorId] = useState("");
	const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [form, setForm] = useState({
		fecha: new Date().toISOString().split("T")[0],
		concepto: "", tipo: "FACTURA", debe: "0", haber: "0", referencia: "", observaciones: "",
	});

	useEffect(() => {
		fetch("/api/proveedores").then((r) => r.json()).then(setProveedores);
	}, []);

	useEffect(() => {
		if (proveedorId) {
			fetch(`/api/cuentas-corrientes?proveedorId=${proveedorId}`)
				.then((r) => r.json())
				.then(setMovimientos);
		}
	}, [proveedorId]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		const res = await fetch("/api/cuentas-corrientes", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ...form, proveedorId }),
		});
		if (res.ok) {
			setOpen(false);
			setForm({ fecha: new Date().toISOString().split("T")[0], concepto: "", tipo: "FACTURA", debe: "0", haber: "0", referencia: "", observaciones: "" });
			const movRes = await fetch(`/api/cuentas-corrientes?proveedorId=${proveedorId}`);
			setMovimientos(await movRes.json());
		}
		setLoading(false);
	}

	const saldoActual = movimientos.length > 0 ? Number(movimientos[movimientos.length - 1].saldo) : 0;

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Cuentas Corrientes</h1>
					<p className="text-gray-500 mt-1">Control de cuentas corrientes con proveedores</p>
				</div>
				{proveedorId && (
					<Button onClick={() => setOpen(true)}>
						<Plus className="mr-2 h-4 w-4" /> Nuevo Movimiento
					</Button>
				)}
			</div>

			<Card className="mb-6">
				<CardContent className="pt-6">
					<div className="flex gap-4 items-end">
						<div className="flex-1">
							<Label>Proveedor</Label>
							<Select value={proveedorId} onValueChange={setProveedorId}>
								<SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
								<SelectContent>
									{proveedores.map((p) => (
										<SelectItem key={p.id} value={p.id}>{p.razonSocial} ({p.cuit})</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						{proveedorId && (
							<div className="text-right">
								<p className="text-sm text-gray-500">Saldo Actual</p>
								<p className={`text-2xl font-bold ${saldoActual >= 0 ? "text-red-600" : "text-green-600"}`}>
									{formatCurrency(Math.abs(saldoActual))}
								</p>
								<p className="text-xs text-gray-400">{saldoActual >= 0 ? "A favor del proveedor" : "A nuestro favor"}</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{proveedorId ? (
				<Card>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Fecha</TableHead>
								<TableHead>Tipo</TableHead>
								<TableHead>Concepto</TableHead>
								<TableHead>Referencia</TableHead>
								<TableHead className="text-right">Debe</TableHead>
								<TableHead className="text-right">Haber</TableHead>
								<TableHead className="text-right">Saldo</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{movimientos.length === 0 ? (
								<TableRow>
									<TableCell colSpan={7} className="text-center text-gray-400 py-8">
										<Users className="mx-auto h-8 w-8 mb-2 opacity-40" />
										Sin movimientos
									</TableCell>
								</TableRow>
							) : movimientos.map((m) => (
								<TableRow key={m.id}>
									<TableCell>{formatDate(m.fecha)}</TableCell>
									<TableCell><Badge variant="outline">{TIPOS_MOV.find((t) => t.value === m.tipo)?.label}</Badge></TableCell>
									<TableCell>{m.concepto}</TableCell>
									<TableCell className="text-sm text-gray-500">{m.referencia}</TableCell>
									<TableCell className="text-right">{Number(m.debe) > 0 ? formatCurrency(m.debe) : "-"}</TableCell>
									<TableCell className="text-right">{Number(m.haber) > 0 ? formatCurrency(m.haber) : "-"}</TableCell>
									<TableCell className={`text-right font-semibold ${Number(m.saldo) >= 0 ? "text-red-600" : "text-green-600"}`}>
										{formatCurrency(Math.abs(Number(m.saldo)))}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</Card>
			) : (
				<Card>
					<CardContent className="pt-6 text-center text-gray-400">
						Seleccioná un proveedor para ver su cuenta corriente
					</CardContent>
				</Card>
			)}

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader><DialogTitle>Nuevo Movimiento</DialogTitle></DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div><Label>Fecha</Label><Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required /></div>
							<div>
								<Label>Tipo</Label>
								<Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
									<SelectTrigger><SelectValue /></SelectTrigger>
									<SelectContent>{TIPOS_MOV.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent>
								</Select>
							</div>
						</div>
						<div><Label>Concepto</Label><Input value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} required /></div>
						<div className="grid grid-cols-2 gap-4">
							<div><Label>Debe</Label><Input type="number" step="0.01" value={form.debe} onChange={(e) => setForm({ ...form, debe: e.target.value })} /></div>
							<div><Label>Haber</Label><Input type="number" step="0.01" value={form.haber} onChange={(e) => setForm({ ...form, haber: e.target.value })} /></div>
						</div>
						<div><Label>Referencia</Label><Input value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} placeholder="Nro factura, cheque, etc." /></div>
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
