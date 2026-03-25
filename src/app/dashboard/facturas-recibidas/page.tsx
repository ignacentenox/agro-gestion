"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
	Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
	Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatCuit } from "@/lib/utils";
import { Plus, FileInput } from "lucide-react";
import { PdfUpload } from "@/components/pdf-upload";

const TIPOS_COMPROBANTE = [
	{ value: "FACTURA_A", label: "Factura A" },
	{ value: "FACTURA_B", label: "Factura B" },
	{ value: "FACTURA_C", label: "Factura C" },
	{ value: "NOTA_CREDITO_A", label: "NC A" },
	{ value: "NOTA_CREDITO_B", label: "NC B" },
	{ value: "NOTA_CREDITO_C", label: "NC C" },
	{ value: "NOTA_DEBITO_A", label: "ND A" },
	{ value: "NOTA_DEBITO_B", label: "ND B" },
	{ value: "NOTA_DEBITO_C", label: "ND C" },
	{ value: "RECIBO", label: "Recibo" },
];

const ALICUOTAS = [
	{ value: "21", label: "21%" },
	{ value: "10.5", label: "10.5%" },
	{ value: "27", label: "27%" },
	{ value: "5", label: "5%" },
	{ value: "2.5", label: "2.5%" },
	{ value: "0", label: "0% (Exento)" },
];

interface Factura {
	id: string;
	tipoComprobante: string;
	numero: number;
	fecha: string;
	proveedor: { razonSocial: string; cuit: string };
	netoGravado: string;
	montoIva: string;
	total: string;
}

interface Proveedor {
	id: string;
	razonSocial: string;
	cuit: string;
}

const emptyForm = {
	tipoComprobante: "FACTURA_A",
	fecha: new Date().toISOString().split("T")[0],
	proveedorId: "",
	descripcion: "",
	netoGravado: "",
	netoNoGravado: "0",
	netoExento: "0",
	alicuotaIva: "21",
	percepcionIva: "0",
	percepcionIIBB: "0",
	otrosImpuestos: "0",
	observaciones: "",
};

export default function FacturasRecibidasPage() {
	const [facturas, setFacturas] = useState<Factura[]>([]);
	const [proveedores, setProveedores] = useState<Proveedor[]>([]);
	const [open, setOpen] = useState(false);
	const [form, setForm] = useState(emptyForm);
	const [loading, setLoading] = useState(false);
	const [mes, setMes] = useState(String(new Date().getMonth() + 1));
	const [anio, setAnio] = useState(String(new Date().getFullYear()));

	useEffect(() => {
		loadFacturas();
		loadProveedores();
	}, [mes, anio]);

	async function loadFacturas() {
		const res = await fetch(`/api/facturas-recibidas?mes=${mes}&anio=${anio}`);
		setFacturas(await res.json());
	}

	async function loadProveedores() {
		const res = await fetch("/api/proveedores");
		setProveedores(await res.json());
	}

	function calculateTotals() {
		const neto = Number(form.netoGravado) || 0;
		const noGravado = Number(form.netoNoGravado) || 0;
		const exento = Number(form.netoExento) || 0;
		const alicuota = Number(form.alicuotaIva) || 0;
		const iva = neto * (alicuota / 100);
		const percIva = Number(form.percepcionIva) || 0;
		const percIIBB = Number(form.percepcionIIBB) || 0;
		const otros = Number(form.otrosImpuestos) || 0;
		return { montoIva: iva, total: neto + noGravado + exento + iva + percIva + percIIBB + otros };
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!form.proveedorId) {
			alert("Debe seleccionar un proveedor");
			return;
		}
		if (!form.netoGravado || Number(form.netoGravado) <= 0) {
			alert("Debe ingresar el neto gravado");
			return;
		}
		setLoading(true);
		const calc = calculateTotals();
		const res = await fetch("/api/facturas-recibidas", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ...form, montoIva: calc.montoIva, total: calc.total }),
		});
		if (res.ok) {
			// Ajustar filtro al mes/año de la factura guardada para que aparezca
			const [y, m] = form.fecha.split("-");
			if (y && m) {
				setAnio(y);
				setMes(String(parseInt(m)));
			}
			setOpen(false);
			setForm(emptyForm);
			loadFacturas();
		} else {
			const data = await res.json();
			alert(data.error || "Error al guardar la factura");
		}
		setLoading(false);
	}

	async function handleDelete(id: string) {
		if (!confirm("¿Eliminar esta factura?")) return;
		await fetch(`/api/facturas-recibidas/${id}`, { method: "DELETE" });
		loadFacturas();
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function handlePdfParsed(data: any) {
		setForm((prev) => ({
			...prev,
			...(data.tipoComprobante && { tipoComprobante: data.tipoComprobante }),
			...(data.fecha && { fecha: data.fecha }),
			...(data.descripcion && { descripcion: data.descripcion }),
			...(data.netoGravado && { netoGravado: String(data.netoGravado) }),
			...(data.netoNoGravado && { netoNoGravado: String(data.netoNoGravado) }),
			...(data.netoExento && { netoExento: String(data.netoExento) }),
			...(data.alicuotaIva && { alicuotaIva: String(data.alicuotaIva) }),
			...(data.percepcionIva && { percepcionIva: String(data.percepcionIva) }),
			...(data.percepcionIIBB && { percepcionIIBB: String(data.percepcionIIBB) }),
			...(data.otrosImpuestos && { otrosImpuestos: String(data.otrosImpuestos) }),
		}));
		// Intentar matchear proveedor por CUIT
		if (data.cuitEmisor) {
			const match = proveedores.find((p) => p.cuit === data.cuitEmisor);
			if (match) setForm((prev) => ({ ...prev, proveedorId: match.id }));
		}
	}

	const calc = calculateTotals();
	const totalMes = facturas.reduce((sum, f) => sum + Number(f.total), 0);
	const totalIvaMes = facturas.reduce((sum, f) => sum + Number(f.montoIva), 0);

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Facturas Recibidas</h1>
					<p className="text-gray-500 mt-1">IVA Compra — Comprobantes de proveedores</p>
				</div>
				<Button onClick={() => setOpen(true)}>
					<Plus className="mr-2 h-4 w-4" /> Nueva Factura
				</Button>
			</div>

			<Card className="mb-6">
				<CardContent className="pt-6">
					<div className="flex gap-4 items-end">
						<div>
							<Label>Mes</Label>
							<Select value={mes} onValueChange={setMes}>
								<SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
								<SelectContent>
									{Array.from({ length: 12 }, (_, i) => (
										<SelectItem key={i + 1} value={String(i + 1)}>
											{new Date(2024, i).toLocaleString("es-AR", { month: "long" })}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>Año</Label>
							<Input type="number" value={anio} onChange={(e) => setAnio(e.target.value)} className="w-24" />
						</div>
						<div className="ml-auto flex gap-4 text-sm">
							<div className="text-right">
								<p className="text-gray-500">Crédito Fiscal</p>
								<p className="text-lg font-bold text-blue-700">{formatCurrency(totalIvaMes)}</p>
							</div>
							<div className="text-right">
								<p className="text-gray-500">Total Compras</p>
								<p className="text-lg font-bold text-gray-900">{formatCurrency(totalMes)}</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Fecha</TableHead>
							<TableHead>Tipo</TableHead>
							<TableHead>#</TableHead>
							<TableHead>Proveedor</TableHead>
							<TableHead className="text-right">Neto</TableHead>
							<TableHead className="text-right">IVA</TableHead>
							<TableHead className="text-right">Total</TableHead>
							<TableHead></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{facturas.length === 0 ? (
							<TableRow>
								<TableCell colSpan={8} className="text-center text-gray-400 py-8">
									<FileInput className="mx-auto h-8 w-8 mb-2 opacity-40" />
									No hay facturas para este período
								</TableCell>
							</TableRow>
						) : (
							facturas.map((f) => (
								<TableRow key={f.id}>
									<TableCell>{formatDate(f.fecha)}</TableCell>
									<TableCell><Badge variant="outline">{TIPOS_COMPROBANTE.find((t) => t.value === f.tipoComprobante)?.label}</Badge></TableCell>
									<TableCell>{f.numero}</TableCell>
									<TableCell>
										<div>{f.proveedor.razonSocial}</div>
										<div className="text-xs text-gray-400">{formatCuit(f.proveedor.cuit)}</div>
									</TableCell>
									<TableCell className="text-right">{formatCurrency(f.netoGravado)}</TableCell>
									<TableCell className="text-right">{formatCurrency(f.montoIva)}</TableCell>
									<TableCell className="text-right font-semibold">{formatCurrency(f.total)}</TableCell>
									<TableCell>
										<Button variant="ghost" size="sm" onClick={() => handleDelete(f.id)}>Eliminar</Button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</Card>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader><DialogTitle>Nueva Factura Recibida</DialogTitle></DialogHeader>
					<PdfUpload onParsed={handlePdfParsed} />
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label>Tipo</Label>
								<Select value={form.tipoComprobante} onValueChange={(v) => setForm({ ...form, tipoComprobante: v })}>
									<SelectTrigger><SelectValue /></SelectTrigger>
									<SelectContent>{TIPOS_COMPROBANTE.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent>
								</Select>
							</div>
							<div><Label>Fecha</Label><Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required /></div>
						</div>
						<div className="grid grid-cols-1 gap-4">
							<div>
								<Label>Proveedor</Label>
								<Select value={form.proveedorId} onValueChange={(v) => setForm({ ...form, proveedorId: v })}>
									<SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
									<SelectContent>{proveedores.map((p) => (<SelectItem key={p.id} value={p.id}>{p.razonSocial} ({formatCuit(p.cuit)})</SelectItem>))}</SelectContent>
								</Select>
							</div>
						</div>
						<div><Label>Descripción</Label><Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
						<div className="grid grid-cols-3 gap-4">
							<div><Label>Neto Gravado</Label><Input type="number" step="0.01" value={form.netoGravado} onChange={(e) => setForm({ ...form, netoGravado: e.target.value })} required /></div>
							<div><Label>Neto No Gravado</Label><Input type="number" step="0.01" value={form.netoNoGravado} onChange={(e) => setForm({ ...form, netoNoGravado: e.target.value })} /></div>
							<div><Label>Neto Exento</Label><Input type="number" step="0.01" value={form.netoExento} onChange={(e) => setForm({ ...form, netoExento: e.target.value })} /></div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label>Alícuota IVA</Label>
								<Select value={form.alicuotaIva} onValueChange={(v) => setForm({ ...form, alicuotaIva: v })}>
									<SelectTrigger><SelectValue /></SelectTrigger>
									<SelectContent>{ALICUOTAS.map((a) => (<SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>))}</SelectContent>
								</Select>
							</div>
							<div><Label>IVA Calculado</Label><div className="h-10 flex items-center px-3 rounded-md bg-gray-50 text-sm font-semibold border">{formatCurrency(calc.montoIva)}</div></div>
						</div>
						<div className="grid grid-cols-3 gap-4">
							<div><Label>Percepción IVA</Label><Input type="number" step="0.01" value={form.percepcionIva} onChange={(e) => setForm({ ...form, percepcionIva: e.target.value })} /></div>
							<div><Label>Percepción IIBB</Label><Input type="number" step="0.01" value={form.percepcionIIBB} onChange={(e) => setForm({ ...form, percepcionIIBB: e.target.value })} /></div>
							<div><Label>Otros Impuestos</Label><Input type="number" step="0.01" value={form.otrosImpuestos} onChange={(e) => setForm({ ...form, otrosImpuestos: e.target.value })} /></div>
						</div>
						<div className="rounded-md bg-blue-50 p-4 text-right">
							<span className="text-gray-600">Total: </span>
							<span className="text-2xl font-bold text-blue-700">{formatCurrency(calc.total)}</span>
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
