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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, CreditCard } from "lucide-react";

const ESTADOS: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
	PENDIENTE: { label: "Pendiente", variant: "warning" },
	COBRADO: { label: "Cobrado", variant: "success" },
	DEPOSITADO: { label: "Depositado", variant: "default" },
	RECHAZADO: { label: "Rechazado", variant: "destructive" },
	ANULADO: { label: "Anulado", variant: "secondary" },
	ENDOSADO: { label: "Endosado", variant: "secondary" },
};

interface ChequeEmitido {
	id: string;
	numeroCheque: string;
	fecha: string;
	fechaCobro: string;
	monto: string;
	estado: string;
	concepto: string | null;
	proveedor: { razonSocial: string };
	banco: { nombre: string };
}

interface ChequeRecibido {
	id: string;
	numeroCheque: string;
	bancoEmisor: string;
	fecha: string;
	fechaCobro: string;
	monto: string;
	estado: string;
	concepto: string | null;
	cliente: { razonSocial: string };
}

export default function ChequesPage() {
	const [tab, setTab] = useState("emitidos");
	const [chequesEmitidos, setChequesEmitidos] = useState<ChequeEmitido[]>([]);
	const [chequesRecibidos, setChequesRecibidos] = useState<ChequeRecibido[]>([]);
	const [bancos, setBancos] = useState<{ id: string; nombre: string }[]>([]);
	const [proveedores, setProveedores] = useState<{ id: string; razonSocial: string }[]>([]);
	const [clientes, setClientes] = useState<{ id: string; razonSocial: string }[]>([]);
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [mes, setMes] = useState(String(new Date().getMonth() + 1));
	const [anio, setAnio] = useState(String(new Date().getFullYear()));

	const [formEmitido, setFormEmitido] = useState({
		bancoId: "", numeroCheque: "", fecha: new Date().toISOString().split("T")[0],
		fechaCobro: "", proveedorId: "", concepto: "", monto: "", observaciones: "",
	});

	const [formRecibido, setFormRecibido] = useState({
		numeroCheque: "", bancoEmisor: "", fecha: new Date().toISOString().split("T")[0],
		fechaCobro: "", clienteId: "", concepto: "", monto: "", destino: "", observaciones: "",
	});

	useEffect(() => { loadAll(); }, [mes, anio]);

	async function loadAll() {
		const [emRes, recRes, banRes, provRes, cliRes] = await Promise.all([
			fetch(`/api/cheques?tipo=emitidos&mes=${mes}&anio=${anio}`),
			fetch(`/api/cheques?tipo=recibidos&mes=${mes}&anio=${anio}`),
			fetch("/api/bancos"),
			fetch("/api/proveedores"),
			fetch("/api/clientes"),
		]);
		setChequesEmitidos(await emRes.json());
		setChequesRecibidos(await recRes.json());
		setBancos(await banRes.json());
		setProveedores(await provRes.json());
		setClientes(await cliRes.json());
	}

	async function handleSubmitEmitido(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		const res = await fetch("/api/cheques", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ tipo: "emitido", ...formEmitido }),
		});
		if (res.ok) { setOpen(false); loadAll(); }
		setLoading(false);
	}

	async function handleSubmitRecibido(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		const res = await fetch("/api/cheques", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ tipo: "recibido", ...formRecibido }),
		});
		if (res.ok) { setOpen(false); loadAll(); }
		setLoading(false);
	}

	async function cambiarEstado(id: string, tipo: string, nuevoEstado: string) {
		await fetch(`/api/cheques/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ tipo: tipo === "emitidos" ? "emitido" : "recibido", estado: nuevoEstado }),
		});
		loadAll();
	}

	const totalEmitidosPendientes = chequesEmitidos.filter(c => c.estado === "PENDIENTE").reduce((s, c) => s + Number(c.monto), 0);
	const totalRecibidosPendientes = chequesRecibidos.filter(c => c.estado === "PENDIENTE").reduce((s, c) => s + Number(c.monto), 0);

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Cheques</h1>
					<p className="text-gray-500 mt-1">Control de cheques emitidos y recibidos</p>
				</div>
				<Button onClick={() => setOpen(true)}>
					<Plus className="mr-2 h-4 w-4" /> Nuevo Cheque
				</Button>
			</div>

			{/* Resumen */}
			<div className="grid grid-cols-2 gap-4 mb-6">
				<Card className="border-red-200">
					<CardContent className="pt-6">
						<p className="text-sm text-gray-500">Cheques Emitidos Pendientes</p>
						<p className="text-2xl font-bold text-red-600">{formatCurrency(totalEmitidosPendientes)}</p>
						<p className="text-xs text-gray-400">{chequesEmitidos.filter(c => c.estado === "PENDIENTE").length} cheques a cubrir</p>
					</CardContent>
				</Card>
				<Card className="border-green-200">
					<CardContent className="pt-6">
						<p className="text-sm text-gray-500">Cheques Recibidos Pendientes</p>
						<p className="text-2xl font-bold text-green-600">{formatCurrency(totalRecibidosPendientes)}</p>
						<p className="text-xs text-gray-400">{chequesRecibidos.filter(c => c.estado === "PENDIENTE").length} cheques a cobrar</p>
					</CardContent>
				</Card>
			</div>

			{/* Filtros */}
			<Card className="mb-4">
				<CardContent className="pt-6">
					<div className="flex gap-4 items-end">
						<div>
							<Label>Mes Cobro</Label>
							<Select value={mes} onValueChange={setMes}>
								<SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
								<SelectContent>
									{Array.from({ length: 12 }, (_, i) => (
										<SelectItem key={i + 1} value={String(i + 1)}>{new Date(2024, i).toLocaleString("es-AR", { month: "long" })}</SelectItem>
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

			<Tabs value={tab} onValueChange={setTab}>
				<TabsList>
					<TabsTrigger value="emitidos">Emitidos ({chequesEmitidos.length})</TabsTrigger>
					<TabsTrigger value="recibidos">Recibidos ({chequesRecibidos.length})</TabsTrigger>
				</TabsList>

				<TabsContent value="emitidos">
					<Card>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>F. Cobro</TableHead>
									<TableHead>Nro Cheque</TableHead>
									<TableHead>Banco</TableHead>
									<TableHead>Proveedor</TableHead>
									<TableHead>Concepto</TableHead>
									<TableHead className="text-right">Monto</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{chequesEmitidos.length === 0 ? (
									<TableRow><TableCell colSpan={8} className="text-center text-gray-400 py-8"><CreditCard className="mx-auto h-8 w-8 mb-2 opacity-40" />Sin cheques</TableCell></TableRow>
								) : chequesEmitidos.map((c) => (
									<TableRow key={c.id}>
										<TableCell className="font-medium">{formatDate(c.fechaCobro)}</TableCell>
										<TableCell>{c.numeroCheque}</TableCell>
										<TableCell>{c.banco.nombre}</TableCell>
										<TableCell>{c.proveedor.razonSocial}</TableCell>
										<TableCell className="text-sm text-gray-500">{c.concepto}</TableCell>
										<TableCell className="text-right font-semibold">{formatCurrency(c.monto)}</TableCell>
										<TableCell><Badge variant={ESTADOS[c.estado]?.variant}>{ESTADOS[c.estado]?.label}</Badge></TableCell>
										<TableCell>
											{c.estado === "PENDIENTE" && (
												<Button variant="ghost" size="sm" onClick={() => cambiarEstado(c.id, "emitidos", "COBRADO")}>Marcar cobrado</Button>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</Card>
				</TabsContent>

				<TabsContent value="recibidos">
					<Card>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>F. Cobro</TableHead>
									<TableHead>Nro Cheque</TableHead>
									<TableHead>Banco Emisor</TableHead>
									<TableHead>Cliente</TableHead>
									<TableHead>Concepto</TableHead>
									<TableHead className="text-right">Monto</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{chequesRecibidos.length === 0 ? (
									<TableRow><TableCell colSpan={8} className="text-center text-gray-400 py-8">Sin cheques</TableCell></TableRow>
								) : chequesRecibidos.map((c) => (
									<TableRow key={c.id}>
										<TableCell className="font-medium">{formatDate(c.fechaCobro)}</TableCell>
										<TableCell>{c.numeroCheque}</TableCell>
										<TableCell>{c.bancoEmisor}</TableCell>
										<TableCell>{c.cliente.razonSocial}</TableCell>
										<TableCell className="text-sm text-gray-500">{c.concepto}</TableCell>
										<TableCell className="text-right font-semibold">{formatCurrency(c.monto)}</TableCell>
										<TableCell><Badge variant={ESTADOS[c.estado]?.variant}>{ESTADOS[c.estado]?.label}</Badge></TableCell>
										<TableCell>
											{c.estado === "PENDIENTE" && (
												<div className="flex gap-1">
													<Button variant="ghost" size="sm" onClick={() => cambiarEstado(c.id, "recibidos", "DEPOSITADO")}>Depositar</Button>
													<Button variant="ghost" size="sm" onClick={() => cambiarEstado(c.id, "recibidos", "ENDOSADO")}>Endosar</Button>
												</div>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Dialog Nuevo Cheque */}
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader><DialogTitle>Nuevo Cheque</DialogTitle></DialogHeader>
					<Tabs defaultValue="emitido">
						<TabsList className="w-full">
							<TabsTrigger value="emitido" className="flex-1">Emitido</TabsTrigger>
							<TabsTrigger value="recibido" className="flex-1">Recibido</TabsTrigger>
						</TabsList>
						<TabsContent value="emitido">
							<form onSubmit={handleSubmitEmitido} className="space-y-4 mt-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label>Banco</Label>
										<Select value={formEmitido.bancoId} onValueChange={(v) => setFormEmitido({ ...formEmitido, bancoId: v })}>
											<SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
											<SelectContent>{bancos.map((b) => (<SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>))}</SelectContent>
										</Select>
									</div>
									<div><Label>Nro Cheque</Label><Input value={formEmitido.numeroCheque} onChange={(e) => setFormEmitido({ ...formEmitido, numeroCheque: e.target.value })} required /></div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div><Label>Fecha Emisión</Label><Input type="date" value={formEmitido.fecha} onChange={(e) => setFormEmitido({ ...formEmitido, fecha: e.target.value })} required /></div>
									<div><Label>Fecha Cobro</Label><Input type="date" value={formEmitido.fechaCobro} onChange={(e) => setFormEmitido({ ...formEmitido, fechaCobro: e.target.value })} required /></div>
								</div>
								<div>
									<Label>Proveedor</Label>
									<Select value={formEmitido.proveedorId} onValueChange={(v) => setFormEmitido({ ...formEmitido, proveedorId: v })}>
										<SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
										<SelectContent>{proveedores.map((p) => (<SelectItem key={p.id} value={p.id}>{p.razonSocial}</SelectItem>))}</SelectContent>
									</Select>
								</div>
								<div><Label>Concepto</Label><Input value={formEmitido.concepto} onChange={(e) => setFormEmitido({ ...formEmitido, concepto: e.target.value })} /></div>
								<div><Label>Monto</Label><Input type="number" step="0.01" value={formEmitido.monto} onChange={(e) => setFormEmitido({ ...formEmitido, monto: e.target.value })} required /></div>
								<div><Label>Observaciones</Label><Textarea value={formEmitido.observaciones} onChange={(e) => setFormEmitido({ ...formEmitido, observaciones: e.target.value })} /></div>
								<DialogFooter>
									<Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
									<Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
								</DialogFooter>
							</form>
						</TabsContent>
						<TabsContent value="recibido">
							<form onSubmit={handleSubmitRecibido} className="space-y-4 mt-4">
								<div className="grid grid-cols-2 gap-4">
									<div><Label>Nro Cheque</Label><Input value={formRecibido.numeroCheque} onChange={(e) => setFormRecibido({ ...formRecibido, numeroCheque: e.target.value })} required /></div>
									<div><Label>Banco Emisor</Label><Input value={formRecibido.bancoEmisor} onChange={(e) => setFormRecibido({ ...formRecibido, bancoEmisor: e.target.value })} required /></div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div><Label>Fecha Recepción</Label><Input type="date" value={formRecibido.fecha} onChange={(e) => setFormRecibido({ ...formRecibido, fecha: e.target.value })} required /></div>
									<div><Label>Fecha Cobro</Label><Input type="date" value={formRecibido.fechaCobro} onChange={(e) => setFormRecibido({ ...formRecibido, fechaCobro: e.target.value })} required /></div>
								</div>
								<div>
									<Label>Cliente</Label>
									<Select value={formRecibido.clienteId} onValueChange={(v) => setFormRecibido({ ...formRecibido, clienteId: v })}>
										<SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
										<SelectContent>{clientes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.razonSocial}</SelectItem>))}</SelectContent>
									</Select>
								</div>
								<div><Label>Concepto</Label><Input value={formRecibido.concepto} onChange={(e) => setFormRecibido({ ...formRecibido, concepto: e.target.value })} /></div>
								<div><Label>Monto</Label><Input type="number" step="0.01" value={formRecibido.monto} onChange={(e) => setFormRecibido({ ...formRecibido, monto: e.target.value })} required /></div>
								<div><Label>Destino</Label><Input value={formRecibido.destino} onChange={(e) => setFormRecibido({ ...formRecibido, destino: e.target.value })} placeholder="A quién se endosó / dónde se depositó" /></div>
								<DialogFooter>
									<Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
									<Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
								</DialogFooter>
							</form>
						</TabsContent>
					</Tabs>
				</DialogContent>
			</Dialog>
		</div>
	);
}
