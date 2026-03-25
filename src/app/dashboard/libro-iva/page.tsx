"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatCuit, getMonthName } from "@/lib/utils";
import { BookOpen } from "lucide-react";

interface LineaIva {
	id: string;
	tipo: string;
	tipoComprobante: string | null;
	fecha: string;
	entidad: string;
	cuit: string;
	netoGravado: number;
	netoNoGravado: number;
	netoExento: number;
	alicuotaIva: number;
	montoIva: number;
	percepcionIva: number;
	percepcionIIBB: number;
	total: number;
}

interface LibroIvaData {
	mes: number;
	anio: number;
	ventas: LineaIva[];
	compras: LineaIva[];
	resumen: {
		totalIvaVenta: number;
		totalIvaCompra: number;
		totalPercepcionIvaVenta: number;
		totalPercepcionIvaCompra: number;
		debitoFiscal: number;
		creditoFiscal: number;
		posicionIva: number;
	};
}

export default function LibroIvaPage() {
	const [data, setData] = useState<LibroIvaData | null>(null);
	const [mes, setMes] = useState(String(new Date().getMonth() + 1));
	const [anio, setAnio] = useState(String(new Date().getFullYear()));

	useEffect(() => {
		fetch(`/api/libro-iva?mes=${mes}&anio=${anio}`)
			.then((r) => r.json())
			.then(setData);
	}, [mes, anio]);

	if (!data) return <div className="p-8 text-gray-400">Cargando...</div>;

	const totalNetoVentas = data.ventas.reduce((s, v) => s + v.netoGravado, 0);
	const totalNetoCompras = data.compras.reduce((s, c) => s + c.netoGravado, 0);

	return (
		<div>
			<div className="mb-6">
				<h1 className="text-3xl font-bold text-gray-900">Libro IVA</h1>
				<p className="text-gray-500 mt-1">
					Control mensual de IVA Compras y Ventas — {getMonthName(Number(mes))} {anio}
				</p>
			</div>

			{/* Filtros */}
			<div className="flex gap-4 items-end mb-6">
				<div>
					<Label>Mes</Label>
					<Select value={mes} onValueChange={setMes}>
						<SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
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

			{/* Resumen IVA */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm text-gray-500">Débito Fiscal (Ventas)</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-green-700">{formatCurrency(data.resumen.debitoFiscal)}</p>
						<p className="text-xs text-gray-400">IVA: {formatCurrency(data.resumen.totalIvaVenta)} + Perc: {formatCurrency(data.resumen.totalPercepcionIvaVenta)}</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm text-gray-500">Crédito Fiscal (Compras)</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-blue-700">{formatCurrency(data.resumen.creditoFiscal)}</p>
						<p className="text-xs text-gray-400">IVA: {formatCurrency(data.resumen.totalIvaCompra)} + Perc: {formatCurrency(data.resumen.totalPercepcionIvaCompra)}</p>
					</CardContent>
				</Card>
				<Card className={data.resumen.posicionIva >= 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm text-gray-500">Posición IVA</CardTitle>
					</CardHeader>
					<CardContent>
						<p className={`text-2xl font-bold ${data.resumen.posicionIva >= 0 ? "text-red-700" : "text-green-700"}`}>
							{formatCurrency(Math.abs(data.resumen.posicionIva))}
						</p>
						<p className="text-xs text-gray-500">{data.resumen.posicionIva >= 0 ? "A pagar a AFIP" : "Saldo a favor"}</p>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="ventas">
				<TabsList>
					<TabsTrigger value="ventas">IVA Ventas ({data.ventas.length})</TabsTrigger>
					<TabsTrigger value="compras">IVA Compras ({data.compras.length})</TabsTrigger>
				</TabsList>

				<TabsContent value="ventas">
					<Card>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Fecha</TableHead>
									<TableHead>Tipo</TableHead>
									<TableHead>Cliente</TableHead>
									<TableHead>CUIT</TableHead>
									<TableHead className="text-right">Neto Gravado</TableHead>
									<TableHead className="text-right">Alíc.</TableHead>
									<TableHead className="text-right">IVA</TableHead>
									<TableHead className="text-right">Total</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.ventas.length === 0 ? (
									<TableRow><TableCell colSpan={8} className="text-center text-gray-400 py-8">Sin registros</TableCell></TableRow>
								) : (
									<>
										{data.ventas.map((v) => (
											<TableRow key={v.id}>
												<TableCell>{formatDate(v.fecha)}</TableCell>
												<TableCell><Badge variant="outline">{v.tipo}</Badge></TableCell>
												<TableCell>{v.entidad}</TableCell>
												<TableCell className="text-xs">{formatCuit(v.cuit)}</TableCell>
												<TableCell className="text-right">{formatCurrency(v.netoGravado)}</TableCell>
												<TableCell className="text-right">{v.alicuotaIva}%</TableCell>
												<TableCell className="text-right">{formatCurrency(v.montoIva)}</TableCell>
												<TableCell className="text-right font-semibold">{formatCurrency(v.total)}</TableCell>
											</TableRow>
										))}
										<TableRow className="bg-green-50 font-semibold">
											<TableCell colSpan={4}>TOTALES</TableCell>
											<TableCell className="text-right">{formatCurrency(totalNetoVentas)}</TableCell>
											<TableCell></TableCell>
											<TableCell className="text-right">{formatCurrency(data.resumen.totalIvaVenta)}</TableCell>
											<TableCell className="text-right">{formatCurrency(data.ventas.reduce((s, v) => s + v.total, 0))}</TableCell>
										</TableRow>
									</>
								)}
							</TableBody>
						</Table>
					</Card>
				</TabsContent>

				<TabsContent value="compras">
					<Card>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Fecha</TableHead>
									<TableHead>Tipo</TableHead>
									<TableHead>Proveedor</TableHead>
									<TableHead>CUIT</TableHead>
									<TableHead className="text-right">Neto Gravado</TableHead>
									<TableHead className="text-right">Alíc.</TableHead>
									<TableHead className="text-right">IVA</TableHead>
									<TableHead className="text-right">Total</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.compras.length === 0 ? (
									<TableRow><TableCell colSpan={8} className="text-center text-gray-400 py-8">Sin registros</TableCell></TableRow>
								) : (
									<>
										{data.compras.map((c) => (
											<TableRow key={c.id}>
												<TableCell>{formatDate(c.fecha)}</TableCell>
												<TableCell><Badge variant="outline">{c.tipo}</Badge></TableCell>
												<TableCell>{c.entidad}</TableCell>
												<TableCell className="text-xs">{formatCuit(c.cuit)}</TableCell>
												<TableCell className="text-right">{formatCurrency(c.netoGravado)}</TableCell>
												<TableCell className="text-right">{c.alicuotaIva}%</TableCell>
												<TableCell className="text-right">{formatCurrency(c.montoIva)}</TableCell>
												<TableCell className="text-right font-semibold">{formatCurrency(c.total)}</TableCell>
											</TableRow>
										))}
										<TableRow className="bg-blue-50 font-semibold">
											<TableCell colSpan={4}>TOTALES</TableCell>
											<TableCell className="text-right">{formatCurrency(totalNetoCompras)}</TableCell>
											<TableCell></TableCell>
											<TableCell className="text-right">{formatCurrency(data.resumen.totalIvaCompra)}</TableCell>
											<TableCell className="text-right">{formatCurrency(data.compras.reduce((s, c) => s + c.total, 0))}</TableCell>
										</TableRow>
									</>
								)}
							</TableBody>
						</Table>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
