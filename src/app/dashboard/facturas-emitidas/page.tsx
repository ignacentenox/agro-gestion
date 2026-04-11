"use client";

import { useState, useEffect, useRef } from "react";
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
import { Plus, FileText, Printer } from "lucide-react";
import { PdfUpload } from "@/components/pdf-upload";

declare global {
	interface Window {
		handlePdfParsedTest?: () => void;
	}
}

const TIPOS_COMPROBANTE = [
	{ value: "FACTURA_A", label: "Factura A" },
	{ value: "FACTURA_B", label: "Factura B" },
	{ value: "FACTURA_C", label: "Factura C" },
	{ value: "NOTA_CREDITO_A", label: "Nota de Crédito A" },
	{ value: "NOTA_CREDITO_B", label: "Nota de Crédito B" },
	{ value: "NOTA_CREDITO_C", label: "Nota de Crédito C" },
	{ value: "NOTA_DEBITO_A", label: "Nota de Débito A" },
	{ value: "NOTA_DEBITO_B", label: "Nota de Débito B" },
	{ value: "NOTA_DEBITO_C", label: "Nota de Débito C" },
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
	numero: number;
	tipoComprobante: string;
	fecha: string;
	clienteId: string;
	cliente: { razonSocial: string; cuit: string };
	descripcion: string | null;
	netoGravado: string;
	netoNoGravado: string;
	netoExento: string;
	alicuotaIva: string;
	montoIva: string;
	percepcionIva: string;
	percepcionIIBB: string;
	otrosImpuestos: string;
	total: string;
	observaciones: string | null;
}

interface Cliente {
	id: string;
	razonSocial: string;
	cuit: string;
}

const emptyForm = {
	tipoComprobante: "FACTURA_A",
	fecha: new Date().toISOString().split("T")[0],
	clienteId: "",
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

export default function FacturasEmitidasPage() {
	const [facturas, setFacturas] = useState<Factura[]>([]);
	const [clientes, setClientes] = useState<Cliente[]>([]);
	const [open, setOpen] = useState(false);
	const [form, setForm] = useState(emptyForm);
	const [loading, setLoading] = useState(false);
	const [autoCreatingClient, setAutoCreatingClient] = useState(false);
	const [mes, setMes] = useState(String(new Date().getMonth() + 1));
	const [anio, setAnio] = useState(String(new Date().getFullYear()));
	const [filtroActivo, setFiltroActivo] = useState(false);
	const [comprobante, setComprobante] = useState<Factura | null>(null);
	const printRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		loadFacturas();
		loadClientes();
	}, []);

	async function loadFacturas(opts?: { mes?: string; anio?: string }) {
		const params = new URLSearchParams();
		if (opts?.mes && opts?.anio) {
			params.set("mes", opts.mes);
			params.set("anio", opts.anio);
		}
		const query = params.toString();
		const res = await fetch(`/api/facturas-emitidas${query ? `?${query}` : ""}`);
		const data = await res.json();
		setFacturas(data);
	}

	async function loadClientes() {
		const res = await fetch("/api/clientes");
		const data = await res.json();
		setClientes(data);
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
		return {
			montoIva: iva,
			total: neto + noGravado + exento + iva + percIva + percIIBB + otros,
		};
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!form.clienteId) {
			alert("Debe seleccionar un cliente");
			return;
		}
		if (!form.netoGravado || Number(form.netoGravado) <= 0) {
			alert("Debe ingresar el neto gravado");
			return;
		}
		setLoading(true);
		const calc = calculateTotals();

		const res = await fetch("/api/facturas-emitidas", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ...form, montoIva: calc.montoIva, total: calc.total }),
		});

		if (res.ok) {
			setFiltroActivo(false);
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
		await fetch(`/api/facturas-emitidas/${id}`, { method: "DELETE" });
		if (filtroActivo) {
			loadFacturas({ mes, anio });
		} else {
			loadFacturas();
		}
	}

	function aplicarFiltro() {
		setFiltroActivo(true);
		loadFacturas({ mes, anio });
	}

	function limpiarFiltro() {
		setFiltroActivo(false);
		loadFacturas();
	}

	function normalizeCondicionIva(raw?: string): string {
		const value = (raw || "").toUpperCase();
		if (value.includes("RESPONSABLE")) return "RESPONSABLE_INSCRIPTO";
		if (value.includes("MONOTRIBUT")) return "MONOTRIBUTISTA";
		if (value.includes("EXENTO")) return "EXENTO";
		if (value.includes("CONSUMIDOR")) return "CONSUMIDOR_FINAL";
		return "NO_CATEGORIZADO";
	}

	function cleanCuit(cuit?: string): string {
		return (cuit || "").replace(/\D/g, "");
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async function ensureClienteFromParsed(data: any): Promise<string | null> {
		const cuit = cleanCuit(data.cuitReceptor || data.cuitEmisor);
		if (cuit.length !== 11) return null;

		const existing = clientes.find((c) => c.cuit === cuit);
		if (existing) return existing.id;

		setAutoCreatingClient(true);
		try {
			const body = {
				razonSocial: data.razonSocial || data.nombreEmisor || `Cliente ${cuit}`,
				cuit,
				condicionIva: normalizeCondicionIva(data.condicionIva),
				observaciones: "Alta automática por importación de comprobante",
			};

			const res = await fetch("/api/clientes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (res.status === 201) {
				const created = await res.json();
				setClientes((prev) => [...prev, created].sort((a, b) => a.razonSocial.localeCompare(b.razonSocial)));
				return created.id;
			}

			if (res.status === 409) {
				await loadClientes();
				const refreshedRes = await fetch("/api/clientes");
				const refreshed = await refreshedRes.json();
				const match = refreshed.find((c: Cliente) => c.cuit === cuit);
				return match?.id || null;
			}
		} finally {
			setAutoCreatingClient(false);
		}

		return null;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async function handlePdfParsed(data: any) {
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

		const clienteId = await ensureClienteFromParsed(data);
		if (clienteId) {
			setForm((prev) => ({ ...prev, clienteId }));
		}
	}

	function handlePrint() {
		if (!comprobante) return;
		window.open(`/comprobante/${comprobante.id}`, "_blank");
	}

	// TEST MANUAL: Ejecutar handlePdfParsed con datos simulados desde la consola
	if (typeof window !== "undefined") {
		window.handlePdfParsedTest = () => handlePdfParsed({
			netoGravado: 1000,
			fecha: "2024-01-01",
			tipoComprobante: "FACTURA_A"
		});
	}

	const calc = calculateTotals();
	const totalMes = facturas.reduce((sum, f) => sum + Number(f.total), 0);
	const totalIvaMes = facturas.reduce((sum, f) => sum + Number(f.montoIva), 0);
	const tipoLabel = (v: string) => TIPOS_COMPROBANTE.find((t) => t.value === v)?.label || v;

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Facturas Emitidas</h1>
					<p className="text-gray-500 mt-1">IVA Venta — Comprobantes emitidos a clientes</p>
				</div>
				<Button onClick={() => setOpen(true)}>
					<Plus className="mr-2 h-4 w-4" /> Nueva Factura
				</Button>
			</div>

			{/* Filtros */}
			<Card className="mb-6">
				<CardContent className="pt-6">
					<div className="flex gap-4 items-end">
						<div>
							<Label>Mes</Label>
							<Select value={mes} onValueChange={setMes}>
								<SelectTrigger className="w-32">
									<SelectValue />
								</SelectTrigger>
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
							<Input
								type="number"
								value={anio}
								onChange={(e) => setAnio(e.target.value)}
								className="w-24"
							/>
						</div>
						<div className="flex gap-2">
							<Button type="button" variant="outline" onClick={aplicarFiltro}>Aplicar filtro</Button>
							<Button type="button" variant="ghost" onClick={limpiarFiltro}>Ver todas</Button>
						</div>
						<div className="ml-auto flex gap-4 text-sm">
							<div className="text-right">
								<p className="text-gray-500">Total IVA</p>
								<p className="text-lg font-bold text-green-700">{formatCurrency(totalIvaMes)}</p>
							</div>
							<div className="text-right">
								<p className="text-gray-500">Total Facturado</p>
								<p className="text-lg font-bold text-gray-900">{formatCurrency(totalMes)}</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Tabla */}
			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>#</TableHead>
							<TableHead>Fecha</TableHead>
							<TableHead>Tipo</TableHead>
							<TableHead>Cliente</TableHead>
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
									<FileText className="mx-auto h-8 w-8 mb-2 opacity-40" />
									No hay facturas para este período
								</TableCell>
							</TableRow>
						) : (
							facturas.map((f) => (
								<TableRow key={f.id}>
									<TableCell className="font-mono text-gray-500">{f.numero}</TableCell>
									<TableCell>{formatDate(f.fecha)}</TableCell>
									<TableCell><Badge variant="outline">{tipoLabel(f.tipoComprobante)}</Badge></TableCell>
									<TableCell>
										<div>{f.cliente.razonSocial}</div>
										<div className="text-xs text-gray-400">{formatCuit(f.cliente.cuit)}</div>
									</TableCell>
									<TableCell className="text-right">{formatCurrency(f.netoGravado)}</TableCell>
									<TableCell className="text-right">{formatCurrency(f.montoIva)}</TableCell>
									<TableCell className="text-right font-semibold">{formatCurrency(f.total)}</TableCell>
									<TableCell>
										<div className="flex gap-1">
											<Button variant="ghost" size="sm" title="Comprobante" onClick={() => setComprobante(f)}>
												<Printer className="h-4 w-4" />
											</Button>
											<Button variant="ghost" size="sm" onClick={() => handleDelete(f.id)}>
												Eliminar
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</Card>

			{/* Dialog Nueva Factura */}
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader><DialogTitle>Nueva Factura Emitida</DialogTitle></DialogHeader>
					{autoCreatingClient && (
						<div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
							Detectado cliente nuevo en el comprobante. Creando ficha automáticamente...
						</div>
					)}
					<PdfUpload onParsed={handlePdfParsed} />
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label>Tipo Comprobante</Label>
								<Select value={form.tipoComprobante} onValueChange={(v) => setForm({ ...form, tipoComprobante: v })}>
									<SelectTrigger><SelectValue /></SelectTrigger>
									<SelectContent>
										{TIPOS_COMPROBANTE.map((t) => (
											<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label>Fecha</Label>
								<Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required />
							</div>
						</div>

						<div>
							<Label>Cliente</Label>
							<Select value={form.clienteId} onValueChange={(v) => setForm({ ...form, clienteId: v })}>
								<SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
								<SelectContent>
									{clientes.map((c) => (
										<SelectItem key={c.id} value={c.id}>{c.razonSocial} ({formatCuit(c.cuit)})</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label>Descripción</Label>
							<Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
						</div>

						<div className="grid grid-cols-3 gap-4">
							<div>
								<Label>Neto Gravado</Label>
								<Input type="number" step="0.01" value={form.netoGravado} onChange={(e) => setForm({ ...form, netoGravado: e.target.value })} required />
							</div>
							<div>
								<Label>Neto No Gravado</Label>
								<Input type="number" step="0.01" value={form.netoNoGravado} onChange={(e) => setForm({ ...form, netoNoGravado: e.target.value })} />
							</div>
							<div>
								<Label>Neto Exento</Label>
								<Input type="number" step="0.01" value={form.netoExento} onChange={(e) => setForm({ ...form, netoExento: e.target.value })} />
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label>Alícuota IVA</Label>
								<Select value={form.alicuotaIva} onValueChange={(v) => setForm({ ...form, alicuotaIva: v })}>
									<SelectTrigger><SelectValue /></SelectTrigger>
									<SelectContent>
										{ALICUOTAS.map((a) => (
											<SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label>IVA Calculado</Label>
								<div className="h-10 flex items-center px-3 rounded-md bg-gray-50 text-sm font-semibold border">
									{formatCurrency(calc.montoIva)}
								</div>
							</div>
						</div>

						<div className="grid grid-cols-3 gap-4">
							<div>
								<Label>Percepción IVA</Label>
								<Input type="number" step="0.01" value={form.percepcionIva} onChange={(e) => setForm({ ...form, percepcionIva: e.target.value })} />
							</div>
							<div>
								<Label>Percepción IIBB</Label>
								<Input type="number" step="0.01" value={form.percepcionIIBB} onChange={(e) => setForm({ ...form, percepcionIIBB: e.target.value })} />
							</div>
							<div>
								<Label>Otros Impuestos</Label>
								<Input type="number" step="0.01" value={form.otrosImpuestos} onChange={(e) => setForm({ ...form, otrosImpuestos: e.target.value })} />
							</div>
						</div>

						<div className="rounded-md bg-green-50 p-4 text-right">
							<span className="text-gray-600">Total: </span>
							<span className="text-2xl font-bold text-green-700">{formatCurrency(calc.total)}</span>
						</div>

						<div>
							<Label>Observaciones</Label>
							<Textarea value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
						</div>

						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
							<Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Dialog Comprobante */}
			<Dialog open={!!comprobante} onOpenChange={() => setComprobante(null)}>
				<DialogContent className="max-w-2xl">
					<DialogHeader><DialogTitle>Comprobante</DialogTitle></DialogHeader>
					{comprobante && (
						<>
							<div ref={printRef}>
								<div style={{ textAlign: "center", borderBottom: "2px solid #7B2D8E", paddingBottom: 16, marginBottom: 24 }}>
									<h1 style={{ color: "#7B2D8E", fontSize: 24, fontWeight: "bold" }}>Agro Gestión</h1>
									<p style={{ color: "#666", fontSize: 14, marginTop: 4 }}>
										{tipoLabel(comprobante.tipoComprobante)} — Nº {comprobante.numero}
									</p>
								</div>
								<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
									<div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
										<h3 style={{ fontSize: 12, color: "#888", textTransform: "uppercase", marginBottom: 4 }}>Cliente</h3>
										<p style={{ fontSize: 14, fontWeight: 600 }}>{comprobante.cliente.razonSocial}</p>
										<p style={{ fontSize: 12, color: "#666" }}>CUIT: {formatCuit(comprobante.cliente.cuit)}</p>
									</div>
									<div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
										<h3 style={{ fontSize: 12, color: "#888", textTransform: "uppercase", marginBottom: 4 }}>Fecha</h3>
										<p style={{ fontSize: 14, fontWeight: 600 }}>{formatDate(comprobante.fecha)}</p>
										{comprobante.descripcion && <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{comprobante.descripcion}</p>}
									</div>
								</div>
								<table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
									<thead>
										<tr>
											<th style={{ background: "#f5f5f5", textAlign: "left", padding: "8px 12px", fontSize: 12, color: "#666", borderBottom: "2px solid #ddd" }}>Concepto</th>
											<th style={{ background: "#f5f5f5", textAlign: "right", padding: "8px 12px", fontSize: 12, color: "#666", borderBottom: "2px solid #ddd" }}>Importe</th>
										</tr>
									</thead>
									<tbody>
										<tr><td style={{ padding: "8px 12px", borderBottom: "1px solid #eee" }}>Neto Gravado</td><td style={{ padding: "8px 12px", borderBottom: "1px solid #eee", textAlign: "right" }}>{formatCurrency(comprobante.netoGravado)}</td></tr>
										{Number(comprobante.netoNoGravado) > 0 && <tr><td style={{ padding: "8px 12px", borderBottom: "1px solid #eee" }}>Neto No Gravado</td><td style={{ padding: "8px 12px", borderBottom: "1px solid #eee", textAlign: "right" }}>{formatCurrency(comprobante.netoNoGravado)}</td></tr>}
										{Number(comprobante.netoExento) > 0 && <tr><td style={{ padding: "8px 12px", borderBottom: "1px solid #eee" }}>Exento</td><td style={{ padding: "8px 12px", borderBottom: "1px solid #eee", textAlign: "right" }}>{formatCurrency(comprobante.netoExento)}</td></tr>}
										<tr><td style={{ padding: "8px 12px", borderBottom: "1px solid #eee" }}>IVA ({comprobante.alicuotaIva}%)</td><td style={{ padding: "8px 12px", borderBottom: "1px solid #eee", textAlign: "right" }}>{formatCurrency(comprobante.montoIva)}</td></tr>
										{Number(comprobante.percepcionIva) > 0 && <tr><td style={{ padding: "8px 12px", borderBottom: "1px solid #eee" }}>Percepción IVA</td><td style={{ padding: "8px 12px", borderBottom: "1px solid #eee", textAlign: "right" }}>{formatCurrency(comprobante.percepcionIva)}</td></tr>}
										{Number(comprobante.percepcionIIBB) > 0 && <tr><td style={{ padding: "8px 12px", borderBottom: "1px solid #eee" }}>Percepción IIBB</td><td style={{ padding: "8px 12px", borderBottom: "1px solid #eee", textAlign: "right" }}>{formatCurrency(comprobante.percepcionIIBB)}</td></tr>}
										<tr style={{ background: "#f0fdf4", fontWeight: "bold", fontSize: 16 }}>
											<td style={{ padding: "8px 12px", borderTop: "2px solid #7B2D8E" }}>TOTAL</td>
											<td style={{ padding: "8px 12px", borderTop: "2px solid #7B2D8E", textAlign: "right" }}>{formatCurrency(comprobante.total)}</td>
										</tr>
									</tbody>
								</table>
								{comprobante.observaciones && <p style={{ fontSize: 12, color: "#666" }}>Obs: {comprobante.observaciones}</p>}
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setComprobante(null)}>Cerrar</Button>
								<Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Imprimir / PDF</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
