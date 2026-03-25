"use client";

import { useState, useEffect, lazy, Suspense } from "react";
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
import { formatCurrency } from "@/lib/utils";
import { Plus, MapPin, Wheat, Pencil, Trash2 } from "lucide-react";

const MapPicker = lazy(() => import("@/components/map-picker").then((m) => ({ default: m.MapPicker })));

const TIPOS_CAMPO = [
	{ value: "PROPIO", label: "Propio" },
	{ value: "ALQUILADO", label: "Alquilado" },
];

const CULTIVOS = [
	{ value: "SOJA", label: "Soja" },
	{ value: "MAIZ", label: "Maíz" },
	{ value: "TRIGO", label: "Trigo" },
	{ value: "SORGO", label: "Sorgo" },
	{ value: "GIRASOL", label: "Girasol" },
	{ value: "CEBADA", label: "Cebada" },
	{ value: "OTRO", label: "Otro" },
];

interface Produccion {
	id: string;
	cultivo: string;
	campania: string;
	hectareas: string;
	kgCosechados: string;
	rindeKgHa: string;
	fechaCosecha: string | null;
	observaciones: string | null;
}

interface Campo {
	id: string;
	nombre: string;
	ubicacion: string | null;
	latitud: string | null;
	longitud: string | null;
	hectareas: string;
	tipo: string;
	propietario: string | null;
	costoAlquiler: string | null;
	observaciones: string | null;
	producciones: Produccion[];
}

const emptyCampo = {
	nombre: "",
	ubicacion: "",
	latitud: null as number | null,
	longitud: null as number | null,
	hectareas: "",
	tipo: "PROPIO",
	propietario: "",
	costoAlquiler: "",
	observaciones: "",
};

const emptyProd = {
	campoId: "",
	cultivo: "SOJA",
	campania: "",
	hectareas: "",
	kgCosechados: "",
	fechaCosecha: "",
	observaciones: "",
};

export default function CamposPage() {
	const [campos, setCampos] = useState<Campo[]>([]);
	const [openCampo, setOpenCampo] = useState(false);
	const [openProd, setOpenProd] = useState(false);
	const [campoForm, setCampoForm] = useState(emptyCampo);
	const [prodForm, setProdForm] = useState(emptyProd);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingProdId, setEditingProdId] = useState<string | null>(null);
	const [expanded, setExpanded] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => { loadCampos(); }, []);

	async function loadCampos() {
		const res = await fetch("/api/campos");
		setCampos(await res.json());
	}

	async function handleSubmitCampo(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		const url = editingId ? `/api/campos/${editingId}` : "/api/campos";
		const method = editingId ? "PUT" : "POST";
		const res = await fetch(url, {
			method,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(campoForm),
		});
		if (res.ok) {
			setOpenCampo(false);
			setCampoForm(emptyCampo);
			setEditingId(null);
			loadCampos();
		}
		setLoading(false);
	}

	async function handleSubmitProd(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		const url = editingProdId ? `/api/producciones/${editingProdId}` : "/api/producciones";
		const method = editingProdId ? "PUT" : "POST";
		const res = await fetch(url, {
			method,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(prodForm),
		});
		if (res.ok) {
			setOpenProd(false);
			setProdForm(emptyProd);
			setEditingProdId(null);
			loadCampos();
		}
		setLoading(false);
	}

	function editCampo(c: Campo) {
		setCampoForm({
			nombre: c.nombre,
			ubicacion: c.ubicacion || "",
			latitud: c.latitud ? Number(c.latitud) : null,
			longitud: c.longitud ? Number(c.longitud) : null,
			hectareas: String(c.hectareas),
			tipo: c.tipo,
			propietario: c.propietario || "",
			costoAlquiler: c.costoAlquiler ? String(c.costoAlquiler) : "",
			observaciones: c.observaciones || "",
		});
		setEditingId(c.id);
		setOpenCampo(true);
	}

	function editProd(p: Produccion, campoId: string) {
		setProdForm({
			campoId,
			cultivo: p.cultivo,
			campania: p.campania,
			hectareas: String(p.hectareas),
			kgCosechados: String(p.kgCosechados),
			fechaCosecha: p.fechaCosecha ? p.fechaCosecha.split("T")[0] : "",
			observaciones: p.observaciones || "",
		});
		setEditingProdId(p.id);
		setOpenProd(true);
	}

	async function handleDeleteCampo(id: string) {
		if (!confirm("¿Eliminar este campo?")) return;
		await fetch(`/api/campos/${id}`, { method: "DELETE" });
		loadCampos();
	}

	async function handleDeleteProd(id: string) {
		if (!confirm("¿Eliminar esta producción?")) return;
		await fetch(`/api/producciones/${id}`, { method: "DELETE" });
		loadCampos();
	}

	const totalHa = campos.reduce((s, c) => s + Number(c.hectareas), 0);
	const totalAlquiler = campos.filter((c) => c.tipo === "ALQUILADO").reduce((s, c) => s + (Number(c.costoAlquiler) || 0), 0);

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white">Campos de Producción</h1>
					<p className="text-gray-500 mt-1">Gestión de campos propios y alquilados</p>
				</div>
				<Button onClick={() => { setCampoForm(emptyCampo); setEditingId(null); setOpenCampo(true); }}>
					<Plus className="mr-2 h-4 w-4" /> Nuevo Campo
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<Card><CardContent className="pt-6 text-center">
					<p className="text-gray-500 text-sm">Total Campos</p>
					<p className="text-2xl font-bold">{campos.length}</p>
				</CardContent></Card>
				<Card><CardContent className="pt-6 text-center">
					<p className="text-gray-500 text-sm">Total Hectáreas</p>
					<p className="text-2xl font-bold">{totalHa.toLocaleString("es-AR")} ha</p>
				</CardContent></Card>
				<Card><CardContent className="pt-6 text-center">
					<p className="text-gray-500 text-sm">Costo Alquileres</p>
					<p className="text-2xl font-bold text-amber-600">{formatCurrency(totalAlquiler)}</p>
				</CardContent></Card>
			</div>

			<div className="space-y-4">
				{campos.length === 0 ? (
					<Card><CardContent className="py-12 text-center text-gray-400">
						<MapPin className="mx-auto h-10 w-10 mb-3 opacity-40" />
						<p>No hay campos registrados</p>
					</CardContent></Card>
				) : (
					campos.map((c) => (
						<Card key={c.id} className="overflow-hidden">
							<CardContent className="pt-6">
								<div className="flex items-start justify-between">
									<div className="flex-1 cursor-pointer" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
										<div className="flex items-center gap-3">
											<MapPin className="h-5 w-5 text-green-600" />
											<h3 className="text-lg font-semibold">{c.nombre}</h3>
											<Badge variant={c.tipo === "PROPIO" ? "default" : "secondary"}>
												{c.tipo === "PROPIO" ? "Propio" : "Alquilado"}
											</Badge>
										</div>
										<div className="flex flex-wrap gap-6 mt-2 text-sm text-gray-500">
											{c.ubicacion && <span>{c.ubicacion}</span>}
											<span>{Number(c.hectareas).toLocaleString("es-AR")} ha</span>
											{c.tipo === "ALQUILADO" && c.propietario && <span>Propietario: {c.propietario}</span>}
											{c.tipo === "ALQUILADO" && c.costoAlquiler && <span>Alquiler: {formatCurrency(c.costoAlquiler)}</span>}
											{c.latitud && c.longitud && (
												<a
													href={`https://www.google.com/maps?q=${c.latitud},${c.longitud}`}
													target="_blank"
													rel="noopener noreferrer"
													className="text-blue-600 hover:underline flex items-center gap-1"
												>
													<MapPin className="h-3 w-3" /> Ver en mapa
												</a>
											)}
										</div>
									</div>
									<div className="flex gap-1">
										<Button variant="ghost" size="icon" onClick={() => editCampo(c)}><Pencil className="h-4 w-4" /></Button>
										<Button variant="ghost" size="icon" onClick={() => handleDeleteCampo(c.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
									</div>
								</div>

								{expanded === c.id && (
									<div className="mt-4 border-t pt-4">
										<div className="flex items-center justify-between mb-3">
											<h4 className="font-semibold flex items-center gap-2"><Wheat className="h-4 w-4" /> Producciones</h4>
											<Button size="sm" variant="outline" onClick={() => { setProdForm({ ...emptyProd, campoId: c.id }); setEditingProdId(null); setOpenProd(true); }}>
												<Plus className="mr-1 h-3 w-3" /> Cargar Producción
											</Button>
										</div>
										{c.producciones.length === 0 ? (
											<p className="text-sm text-gray-400 text-center py-4">Sin producciones registradas</p>
										) : (
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Campaña</TableHead>
														<TableHead>Cultivo</TableHead>
														<TableHead className="text-right">Hectáreas</TableHead>
														<TableHead className="text-right">Kg Cosechados</TableHead>
														<TableHead className="text-right">Rinde (kg/ha)</TableHead>
														<TableHead>Fecha</TableHead>
														<TableHead></TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{c.producciones.map((p) => (
														<TableRow key={p.id}>
															<TableCell className="font-medium">{p.campania}</TableCell>
															<TableCell><Badge variant="outline">{CULTIVOS.find((cu) => cu.value === p.cultivo)?.label}</Badge></TableCell>
															<TableCell className="text-right">{Number(p.hectareas).toLocaleString("es-AR")}</TableCell>
															<TableCell className="text-right">{Number(p.kgCosechados).toLocaleString("es-AR")}</TableCell>
															<TableCell className="text-right font-semibold">{Number(p.rindeKgHa).toLocaleString("es-AR", { maximumFractionDigits: 1 })}</TableCell>
															<TableCell>{p.fechaCosecha ? new Date(p.fechaCosecha).toLocaleDateString("es-AR") : "-"}</TableCell>
															<TableCell>
																<div className="flex gap-1">
																	<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editProd(p, c.id)}><Pencil className="h-3 w-3" /></Button>
																	<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteProd(p.id)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
																</div>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										)}
									</div>
								)}
							</CardContent>
						</Card>
					))
				)}
			</div>

			{/* Dialog Campo */}
			<Dialog open={openCampo} onOpenChange={setOpenCampo}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader><DialogTitle>{editingId ? "Editar Campo" : "Nuevo Campo"}</DialogTitle></DialogHeader>
					<form onSubmit={handleSubmitCampo} className="space-y-4">
						<div><Label>Nombre del Campo</Label><Input value={campoForm.nombre} onChange={(e) => setCampoForm({ ...campoForm, nombre: e.target.value })} required /></div>
						<div className="grid grid-cols-2 gap-4">
							<div><Label>Ubicación (localidad)</Label><Input placeholder="ej: Bell Ville, Córdoba" value={campoForm.ubicacion} onChange={(e) => setCampoForm({ ...campoForm, ubicacion: e.target.value })} /></div>
							<div><Label>Hectáreas</Label><Input type="number" step="0.01" value={campoForm.hectareas} onChange={(e) => setCampoForm({ ...campoForm, hectareas: e.target.value })} required /></div>
						</div>

						{/* Mapa interactivo */}
						{openCampo && (
							<Suspense fallback={<div className="h-[250px] rounded-md border flex items-center justify-center text-gray-400 text-sm">Cargando mapa...</div>}>
								<MapPicker
									lat={campoForm.latitud}
									lng={campoForm.longitud}
									onChange={(lat, lng) => setCampoForm({ ...campoForm, latitud: lat, longitud: lng })}
								/>
							</Suspense>
						)}

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label>Tipo</Label>
								<Select value={campoForm.tipo} onValueChange={(v) => setCampoForm({ ...campoForm, tipo: v })}>
									<SelectTrigger><SelectValue /></SelectTrigger>
									<SelectContent>{TIPOS_CAMPO.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent>
								</Select>
							</div>
							{campoForm.tipo === "ALQUILADO" && (
								<div><Label>Propietario</Label><Input value={campoForm.propietario} onChange={(e) => setCampoForm({ ...campoForm, propietario: e.target.value })} /></div>
							)}
						</div>
						{campoForm.tipo === "ALQUILADO" && (
							<div><Label>Costo Alquiler ($/ha)</Label><Input type="number" step="0.01" value={campoForm.costoAlquiler} onChange={(e) => setCampoForm({ ...campoForm, costoAlquiler: e.target.value })} /></div>
						)}
						<div><Label>Observaciones</Label><Textarea value={campoForm.observaciones} onChange={(e) => setCampoForm({ ...campoForm, observaciones: e.target.value })} /></div>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => setOpenCampo(false)}>Cancelar</Button>
							<Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Dialog Producción */}
			<Dialog open={openProd} onOpenChange={setOpenProd}>
				<DialogContent className="max-w-lg">
					<DialogHeader><DialogTitle>{editingProdId ? "Editar Producción" : "Cargar Producción"}</DialogTitle></DialogHeader>
					<form onSubmit={handleSubmitProd} className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label>Cultivo</Label>
								<Select value={prodForm.cultivo} onValueChange={(v) => setProdForm({ ...prodForm, cultivo: v })}>
									<SelectTrigger><SelectValue /></SelectTrigger>
									<SelectContent>{CULTIVOS.map((cu) => (<SelectItem key={cu.value} value={cu.value}>{cu.label}</SelectItem>))}</SelectContent>
								</Select>
							</div>
							<div><Label>Campaña</Label><Input placeholder="ej: 2024/25" value={prodForm.campania} onChange={(e) => setProdForm({ ...prodForm, campania: e.target.value })} required /></div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div><Label>Hectáreas Sembradas</Label><Input type="number" step="0.01" value={prodForm.hectareas} onChange={(e) => setProdForm({ ...prodForm, hectareas: e.target.value })} required /></div>
							<div><Label>Kg Cosechados</Label><Input type="number" step="0.01" value={prodForm.kgCosechados} onChange={(e) => setProdForm({ ...prodForm, kgCosechados: e.target.value })} /></div>
						</div>
						{Number(prodForm.hectareas) > 0 && Number(prodForm.kgCosechados) > 0 && (
							<div className="rounded-md bg-green-50 dark:bg-green-950 p-3 text-center">
								<span className="text-gray-600 dark:text-gray-300">Rinde: </span>
								<span className="text-lg font-bold text-green-700 dark:text-green-400">
									{(Number(prodForm.kgCosechados) / Number(prodForm.hectareas)).toLocaleString("es-AR", { maximumFractionDigits: 1 })} kg/ha
								</span>
							</div>
						)}
						<div><Label>Fecha de Cosecha</Label><Input type="date" value={prodForm.fechaCosecha} onChange={(e) => setProdForm({ ...prodForm, fechaCosecha: e.target.value })} /></div>
						<div><Label>Observaciones</Label><Textarea value={prodForm.observaciones} onChange={(e) => setProdForm({ ...prodForm, observaciones: e.target.value })} /></div>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => setOpenProd(false)}>Cancelar</Button>
							<Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
