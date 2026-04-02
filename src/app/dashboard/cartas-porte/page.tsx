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
import { Plus, Truck, Pencil, Trash2, X, Search, FileUp } from "lucide-react";

const CULTIVOS = [
	{ value: "SOJA", label: "Soja" },
	{ value: "MAIZ", label: "Maíz" },
	{ value: "TRIGO", label: "Trigo" },
	{ value: "SORGO", label: "Sorgo" },
	{ value: "GIRASOL", label: "Girasol" },
	{ value: "CEBADA", label: "Cebada" },
	{ value: "OTRO", label: "Otro" },
];

const ESTADOS = [
	{ value: "PENDIENTE", label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
	{ value: "EN_TRANSITO", label: "En Tránsito", color: "bg-blue-100 text-blue-800" },
	{ value: "DESCARGADA", label: "Descargada", color: "bg-green-100 text-green-800" },
	{ value: "CONFIRMADA", label: "Confirmada", color: "bg-emerald-100 text-emerald-800" },
	{ value: "ANULADA", label: "Anulada", color: "bg-red-100 text-red-800" },
];

interface Campo {
	id: string;
	nombre: string;
}

interface CartaPorte {
	id: string;
	numero: number;
	fecha: string;
	campoOrigenId: string | null;
	campoOrigen: { nombre: string } | null;
	localidadOrigen: string | null;
	destino: string;
	localidadDestino: string | null;
	producto: string;
	cosecha: string | null;
	pesoBrutoKg: number;
	pesoTaraKg: number;
	pesoNetoKg: number;
	transportista: string | null;
	patenteCamion: string | null;
	patenteAcoplado: string | null;
	chofer: string | null;
	ctg: string | null;
	estado: string;
	observaciones: string | null;
}

const emptyForm = {
	fecha: new Date().toISOString().split("T")[0],
	campoOrigenId: "",
	localidadOrigen: "",
	destino: "",
	localidadDestino: "",
	producto: "SOJA",
	cosecha: "",
	pesoBrutoKg: "",
	pesoTaraKg: "",
	transportista: "",
	patenteCamion: "",
	patenteAcoplado: "",
	chofer: "",
	ctg: "",
	estado: "PENDIENTE",
	observaciones: "",
};

export default function CartasPortePage() {
	const [cartas, setCartas] = useState<CartaPorte[]>([]);
	const [campos, setCampos] = useState<Campo[]>([]);
	const [open, setOpen] = useState(false);
	const [form, setForm] = useState(emptyForm);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [filtroEstado, setFiltroEstado] = useState("TODOS");
	const [filtroProducto, setFiltroProducto] = useState("TODOS");
	const [busqueda, setBusqueda] = useState("");
	const [importingPdf, setImportingPdf] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		loadCartas();
		loadCampos();
	}, [filtroEstado]);

	async function loadCartas() {
		const query = filtroEstado !== "TODOS" ? `?estado=${filtroEstado}` : "";
		const res = await fetch(`/api/cartas-porte${query}`);
		setCartas(await res.json());
	}

	async function loadCampos() {
		const res = await fetch("/api/campos");
		setCampos(await res.json());
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		const url = editingId ? `/api/cartas-porte/${editingId}` : "/api/cartas-porte";
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
			loadCartas();
		}
		setLoading(false);
	}

	function editCarta(c: CartaPorte) {
		setForm({
			fecha: c.fecha.split("T")[0],
			campoOrigenId: c.campoOrigenId || "",
			localidadOrigen: c.localidadOrigen || "",
			destino: c.destino,
			localidadDestino: c.localidadDestino || "",
			producto: c.producto,
			cosecha: c.cosecha || "",
			pesoBrutoKg: String(c.pesoBrutoKg),
			pesoTaraKg: String(c.pesoTaraKg),
			transportista: c.transportista || "",
			patenteCamion: c.patenteCamion || "",
			patenteAcoplado: c.patenteAcoplado || "",
			chofer: c.chofer || "",
			ctg: c.ctg || "",
			estado: c.estado,
			observaciones: c.observaciones || "",
		});
		setEditingId(c.id);
		setOpen(true);
	}

	async function handleAnular(id: string) {
		if (!confirm("¿Anular esta carta de porte?")) return;
		await fetch(`/api/cartas-porte/${id}`, { method: "DELETE" });
		loadCartas();
	}

	async function handleEliminar(id: string) {
		if (!confirm("¿Eliminar definitivamente esta carta de porte? Esta acción no se puede deshacer.")) return;
		const res = await fetch(`/api/cartas-porte/${id}?permanent=true`, { method: "DELETE" });
		if (res.ok) loadCartas();
	}

	async function handleImportPdf(file: File) {
		setImportingPdf(true);
		try {
			const data = new FormData();
			data.append("file", file);

			const res = await fetch("/api/cartas-porte/parse-pdf", {
				method: "POST",
				body: data,
			});

			const json = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(json?.error || "No se pudo procesar el PDF");
			}

			const parsed = json?.parsed || {};
			setForm((prev) => ({
				...prev,
				fecha: parsed.fecha || prev.fecha,
				destino: parsed.destino || prev.destino,
				localidadDestino: parsed.localidadDestino || prev.localidadDestino,
				localidadOrigen: parsed.localidadOrigen || prev.localidadOrigen,
				producto: parsed.producto || prev.producto,
				pesoBrutoKg: parsed.pesoBrutoKg != null ? String(parsed.pesoBrutoKg) : prev.pesoBrutoKg,
				pesoTaraKg: parsed.pesoTaraKg != null ? String(parsed.pesoTaraKg) : prev.pesoTaraKg,
				transportista: parsed.transportista || prev.transportista,
				chofer: parsed.chofer || prev.chofer,
				patenteCamion: parsed.patenteCamion || prev.patenteCamion,
				patenteAcoplado: parsed.patenteAcoplado || prev.patenteAcoplado,
				ctg: parsed.ctg || prev.ctg,
			}));

			setEditingId(null);
			setOpen(true);
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : "Error desconocido";
			alert(`No se pudo importar el PDF: ${msg}`);
		} finally {
			setImportingPdf(false);
		}
	}

	const pesoNeto = (Number(form.pesoBrutoKg) || 0) - (Number(form.pesoTaraKg) || 0);

	const cartasFiltradas = cartas.filter((c) => {
		if (filtroProducto !== "TODOS" && c.producto !== filtroProducto) return false;
		if (busqueda) {
			const q = busqueda.toLowerCase();
			return (
				c.destino.toLowerCase().includes(q) ||
				c.campoOrigen?.nombre.toLowerCase().includes(q) ||
				c.transportista?.toLowerCase().includes(q) ||
				c.chofer?.toLowerCase().includes(q) ||
				c.patenteCamion?.toLowerCase().includes(q) ||
				c.ctg?.toLowerCase().includes(q) ||
				String(c.numero).includes(q)
			);
		}
		return true;
	});

	const totalNetoKg = cartasFiltradas.filter((c) => c.estado !== "ANULADA").reduce((s, c) => s + c.pesoNetoKg, 0);

	function estadoBadge(estado: string) {
		const e = ESTADOS.find((est) => est.value === estado);
		return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e?.color || ""}`}>{e?.label || estado}</span>;
	}

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cartas de Porte</h1>
					<p className="text-gray-500 mt-1">Control de transporte de granos</p>
				</div>
				<div className="flex items-center gap-2">
					<input
						ref={fileInputRef}
						type="file"
						accept="application/pdf,.pdf"
						className="hidden"
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) {
								void handleImportPdf(file);
							}
							e.currentTarget.value = "";
						}}
					/>
					<Button variant="outline" disabled={importingPdf} onClick={() => fileInputRef.current?.click()}>
						<FileUp className="mr-2 h-4 w-4" />
						{importingPdf ? "Importando PDF..." : "Importar PDF"}
					</Button>
					<Button onClick={() => { setForm(emptyForm); setEditingId(null); setOpen(true); }}>
						<Plus className="mr-2 h-4 w-4" /> Nueva Carta de Porte
					</Button>
				</div>
			</div>

			<Card className="mb-6">
				<CardContent className="pt-6">
					<div className="flex flex-wrap gap-4 items-end">
						<div>
							<Label>Estado</Label>
							<Select value={filtroEstado} onValueChange={setFiltroEstado}>
								<SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="TODOS">Todos</SelectItem>
									{ESTADOS.map((e) => (<SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>Producto</Label>
							<Select value={filtroProducto} onValueChange={setFiltroProducto}>
								<SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="TODOS">Todos</SelectItem>
									{CULTIVOS.map((cu) => (<SelectItem key={cu.value} value={cu.value}>{cu.label}</SelectItem>))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex-1 min-w-[200px]">
							<Label>Buscar</Label>
							<div className="relative">
								<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
								<Input
									placeholder="Destino, transportista, patente, CTG..."
									value={busqueda}
									onChange={(e) => setBusqueda(e.target.value)}
									className="pl-8"
								/>
								{busqueda && (
									<button onClick={() => setBusqueda("")} className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600">
										<X className="h-4 w-4" />
									</button>
								)}
							</div>
						</div>
						<div className="ml-auto text-right">
							<p className="text-gray-500 dark:text-gray-400 text-sm">Total Neto (filtradas)</p>
							<p className="text-2xl font-bold dark:text-white">{totalNetoKg.toLocaleString("es-AR")} kg</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>#</TableHead>
							<TableHead>Fecha</TableHead>
							<TableHead>Origen</TableHead>
							<TableHead>Destino</TableHead>
							<TableHead>Producto</TableHead>
							<TableHead className="text-right">Bruto</TableHead>
							<TableHead className="text-right">Tara</TableHead>
							<TableHead className="text-right">Neto</TableHead>
							<TableHead>Estado</TableHead>
							<TableHead></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{cartas.length === 0 ? (
							<TableRow>
								<TableCell colSpan={10} className="text-center text-gray-400 py-8">
									<Truck className="mx-auto h-8 w-8 mb-2 opacity-40" />
									No hay cartas de porte registradas
								</TableCell>
							</TableRow>
						) : (
							cartasFiltradas.map((c) => (
								<TableRow key={c.id} className={c.estado === "ANULADA" ? "opacity-50" : ""}>
									<TableCell className="font-medium">{c.numero}</TableCell>
									<TableCell>{new Date(c.fecha).toLocaleDateString("es-AR")}</TableCell>
									<TableCell>{c.campoOrigen?.nombre || c.localidadOrigen || "-"}</TableCell>
									<TableCell>{c.destino}</TableCell>
									<TableCell><Badge variant="outline">{CULTIVOS.find((cu) => cu.value === c.producto)?.label}</Badge></TableCell>
									<TableCell className="text-right">{c.pesoBrutoKg.toLocaleString("es-AR")}</TableCell>
									<TableCell className="text-right">{c.pesoTaraKg.toLocaleString("es-AR")}</TableCell>
									<TableCell className="text-right font-semibold">{c.pesoNetoKg.toLocaleString("es-AR")}</TableCell>
									<TableCell>{estadoBadge(c.estado)}</TableCell>
									<TableCell>
										<div className="flex gap-1">
											<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editCarta(c)}><Pencil className="h-3 w-3" /></Button>
											{c.estado !== "ANULADA" && c.estado !== "CONFIRMADA" && (
												<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAnular(c.id)} title="Anular">
													<X className="h-3 w-3 text-orange-500" />
												</Button>
											)}
											{(c.estado === "CONFIRMADA" || c.estado === "ANULADA") && (
												<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEliminar(c.id)} title="Eliminar definitivamente">
													<Trash2 className="h-3 w-3 text-red-500" />
												</Button>
											)}
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</Card>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader><DialogTitle>{editingId ? "Editar Carta de Porte" : "Nueva Carta de Porte"}</DialogTitle></DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div><Label>Fecha</Label><Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required /></div>
							<div>
								<Label>Producto</Label>
								<Select value={form.producto} onValueChange={(v) => setForm({ ...form, producto: v })}>
									<SelectTrigger><SelectValue /></SelectTrigger>
									<SelectContent>{CULTIVOS.map((cu) => (<SelectItem key={cu.value} value={cu.value}>{cu.label}</SelectItem>))}</SelectContent>
								</Select>
							</div>
						</div>

						<div className="border rounded-md p-3 space-y-3">
							<p className="text-sm font-semibold text-gray-600">Origen</p>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label>Campo Origen</Label>
									<Select value={form.campoOrigenId} onValueChange={(v) => setForm({ ...form, campoOrigenId: v })}>
										<SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
										<SelectContent>
											<SelectItem value="none">Sin campo</SelectItem>
											{campos.map((ca) => (<SelectItem key={ca.id} value={ca.id}>{ca.nombre}</SelectItem>))}
										</SelectContent>
									</Select>
								</div>
								<div><Label>Localidad Origen</Label><Input value={form.localidadOrigen} onChange={(e) => setForm({ ...form, localidadOrigen: e.target.value })} /></div>
							</div>
						</div>

						<div className="border rounded-md p-3 space-y-3">
							<p className="text-sm font-semibold text-gray-600">Destino</p>
							<div className="grid grid-cols-2 gap-4">
								<div><Label>Destino (Planta/Acopio)</Label><Input value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} required /></div>
								<div><Label>Localidad Destino</Label><Input value={form.localidadDestino} onChange={(e) => setForm({ ...form, localidadDestino: e.target.value })} /></div>
							</div>
						</div>

						<div className="border rounded-md p-3 space-y-3">
							<p className="text-sm font-semibold text-gray-600">Pesos (kg)</p>
							<div className="grid grid-cols-3 gap-4">
								<div><Label>Peso Bruto</Label><Input type="number" value={form.pesoBrutoKg} onChange={(e) => setForm({ ...form, pesoBrutoKg: e.target.value })} required /></div>
								<div><Label>Peso Tara</Label><Input type="number" value={form.pesoTaraKg} onChange={(e) => setForm({ ...form, pesoTaraKg: e.target.value })} required /></div>
								<div>
									<Label>Peso Neto</Label>
									<div className="h-10 flex items-center px-3 rounded-md bg-green-50 dark:bg-green-950 text-sm font-bold border text-green-700 dark:text-green-400">
										{pesoNeto.toLocaleString("es-AR")} kg
									</div>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div><Label>Cosecha</Label><Input placeholder="ej: 2024/25" value={form.cosecha} onChange={(e) => setForm({ ...form, cosecha: e.target.value })} /></div>
							<div><Label>CTG</Label><Input value={form.ctg} onChange={(e) => setForm({ ...form, ctg: e.target.value })} /></div>
						</div>

						<div className="border rounded-md p-3 space-y-3">
							<p className="text-sm font-semibold text-gray-600">Transporte</p>
							<div className="grid grid-cols-2 gap-4">
								<div><Label>Transportista</Label><Input value={form.transportista} onChange={(e) => setForm({ ...form, transportista: e.target.value })} /></div>
								<div><Label>Chofer</Label><Input value={form.chofer} onChange={(e) => setForm({ ...form, chofer: e.target.value })} /></div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div><Label>Patente Camión</Label><Input value={form.patenteCamion} onChange={(e) => setForm({ ...form, patenteCamion: e.target.value })} /></div>
								<div><Label>Patente Acoplado</Label><Input value={form.patenteAcoplado} onChange={(e) => setForm({ ...form, patenteAcoplado: e.target.value })} /></div>
							</div>
						</div>

						{editingId && (
							<div>
								<Label>Estado</Label>
								<Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
									<SelectTrigger><SelectValue /></SelectTrigger>
									<SelectContent>{ESTADOS.filter((e) => e.value !== "ANULADA").map((e) => (<SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>))}</SelectContent>
								</Select>
							</div>
						)}

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
