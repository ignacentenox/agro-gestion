"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate, formatCuit } from "@/lib/utils";
import { Plus, Receipt } from "lucide-react";

const ALICUOTAS = [
	{ value: "21", label: "21%" },
	{ value: "10.5", label: "10.5%" },
	{ value: "27", label: "27%" },
	{ value: "5", label: "5%" },
	{ value: "0", label: "0%" },
];

interface Liquidacion {
	id: string;
	numero: number;
	fecha: string;
	concepto: string;
	netoGravado: string;
	montoIva: string;
	total: string;
	cliente?: { razonSocial: string; cuit: string };
	proveedor?: { razonSocial: string; cuit: string };
}

const emptyForm = {
	numero: "",
	fecha: new Date().toISOString().split("T")[0],
	concepto: "",
	descripcion: "",
	netoGravado: "",
	alicuotaIva: "21",
	retenciones: "0",
	otrosConceptos: "0",
	observaciones: "",
	clienteId: "",
	proveedorId: "",
};

export default function LiquidacionesPage() {
	const [tab, setTab] = useState("emitidas");
	const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);
	const [clientes, setClientes] = useState<{ id: string; razonSocial: string; cuit: string }[]>([]);
	const [proveedores, setProveedores] = useState<{ id: string; razonSocial: string; cuit: string }[]>([]);
	const [open, setOpen] = useState(false);
	const [form, setForm] = useState(emptyForm);
	const [loading, setLoading] = useState(false);
	const [mes, setMes] = useState(String(new Date().getMonth() + 1));
	const [anio, setAnio] = useState(String(new Date().getFullYear()));

	useEffect(() => { loadData(); }, [tab, mes, anio]);

	async function loadData() {
		const [liqRes, cliRes, provRes] = await Promise.all([
			fetch(`/api/liquidaciones?tipo=${tab}&mes=${mes}&anio=${anio}`),
			fetch("/api/clientes"),
			fetch("/api/proveedores"),
		]);
		setLiquidaciones(await liqRes.json());
		setClientes(await cliRes.json());
		setProveedores(await provRes.json());
	}

	function calc() {
		const neto = Number(form.netoGravado) || 0;
		const alicuota = Number(form.alicuotaIva) || 0;
		const iva = neto * (alicuota / 100);
		const ret = Number(form.retenciones) || 0;
		const otros = Number(form.otrosConceptos) || 0;
		return { montoIva: iva, total: neto + iva - ret + otros };
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		const c = calc();
		const tipo = tab === "emitidas" ? "emitida" : "recibida";
		const res = await fetch("/api/liquidaciones", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ...form, tipo, montoIva: c.montoIva, total: c.total }),
		});
		if (res.ok) { setOpen(false); setForm(emptyForm); loadData(); }
		setLoading(false);
	}

	const c = calc();

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Liquidaciones</h1>
					<p className="text-gray-500 mt-1">Liquidaciones emitidas y recibidas</p>
				</div>
				<Button onClick={() => setOpen(true)}>
					<Plus className="mr-2 h-4 w-4" /> Nueva Liquidación
				</Button>
			</div>

			<Tabs value={tab} onValueChange={setTab}>
				<TabsList>
					<TabsTrigger value="emitidas">Emitidas (IVA Venta)</TabsTrigger>
					<TabsTrigger value="recibidas">Recibidas (IVA Compra)</TabsTrigger>
				</TabsList>

				<Card className="my-4">
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
						</div>
					</CardContent>
				</Card>

				<TabsContent value={tab}>
					<Card>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Fecha</TableHead>
									<TableHead>Nro</TableHead>
									<TableHead>Concepto</TableHead>
									<TableHead>{tab === "emitidas" ? "Cliente" : "Proveedor"}</TableHead>
									<TableHead className="text-right">Neto</TableHead>
									<TableHead className="text-right">IVA</TableHead>
									<TableHead className="text-right">Total</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{liquidaciones.length === 0 ? (
									<TableRow>
										<TableCell colSpan={7} className="text-center text-gray-400 py-8">
											<Receipt className="mx-auto h-8 w-8 mb-2 opacity-40" />
											No hay liquidaciones
										</TableCell>
									</TableRow>
								) : (
									liquidaciones.map((l) => (
										<TableRow key={l.id}>
											<TableCell>{formatDate(l.fecha)}</TableCell>
											<TableCell>{l.numero}</TableCell>
											<TableCell>{l.concepto}</TableCell>
											<TableCell>
												{l.cliente?.razonSocial || l.proveedor?.razonSocial}
												<div className="text-xs text-gray-400">
													{formatCuit(l.cliente?.cuit || l.proveedor?.cuit || "")}
												</div>
											</TableCell>
											<TableCell className="text-right">{formatCurrency(l.netoGravado)}</TableCell>
											<TableCell className="text-right">{formatCurrency(l.montoIva)}</TableCell>
											<TableCell className="text-right font-semibold">{formatCurrency(l.total)}</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</Card>
				</TabsContent>
			</Tabs>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader><DialogTitle>Nueva Liquidación ({tab === "emitidas" ? "Emitida" : "Recibida"})</DialogTitle></DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div><Label>Número</Label><Input type="number" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} required /></div>
							<div><Label>Fecha</Label><Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required /></div>
						</div>
						<div>
							<Label>{tab === "emitidas" ? "Cliente" : "Proveedor"}</Label>
							<Select
								value={tab === "emitidas" ? form.clienteId : form.proveedorId}
								onValueChange={(v) => setForm({ ...form, [tab === "emitidas" ? "clienteId" : "proveedorId"]: v })}
							>
								<SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
								<SelectContent>
									{(tab === "emitidas" ? clientes : proveedores).map((e) => (
										<SelectItem key={e.id} value={e.id}>{e.razonSocial}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div><Label>Concepto</Label><Input value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} required /></div>
						<div className="grid grid-cols-2 gap-4">
							<div><Label>Neto Gravado</Label><Input type="number" step="0.01" value={form.netoGravado} onChange={(e) => setForm({ ...form, netoGravado: e.target.value })} required /></div>
							<div>
								<Label>Alícuota IVA</Label>
								<Select value={form.alicuotaIva} onValueChange={(v) => setForm({ ...form, alicuotaIva: v })}>
									<SelectTrigger><SelectValue /></SelectTrigger>
									<SelectContent>{ALICUOTAS.map((a) => (<SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>))}</SelectContent>
								</Select>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div><Label>Retenciones</Label><Input type="number" step="0.01" value={form.retenciones} onChange={(e) => setForm({ ...form, retenciones: e.target.value })} /></div>
							<div><Label>Otros Conceptos</Label><Input type="number" step="0.01" value={form.otrosConceptos} onChange={(e) => setForm({ ...form, otrosConceptos: e.target.value })} /></div>
						</div>
						<div className="rounded-md bg-gray-50 p-3 text-right">
							<span className="text-gray-500">IVA: {formatCurrency(c.montoIva)}</span>
							<span className="ml-4 text-lg font-bold">Total: {formatCurrency(c.total)}</span>
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
