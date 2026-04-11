import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, getMonthName } from "@/lib/utils";
import {
	FileText,
	FileInput,
	CreditCard,
	TrendingUp,
	TrendingDown,
	DollarSign,
	BellRing,
} from "lucide-react";

async function getDashboardData() {
	const now = new Date();
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const monthEndExclusive = new Date(now.getFullYear(), now.getMonth() + 1, 1);
	const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	// Exclusivo: incluye hasta el final del día +10 (equivalente al rango inclusivo de 10 días).
	const tenDaysExclusive = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 11);

	const [
		facturasEmitidas,
		facturasRecibidas,
		liquidacionesEmitidas,
		liquidacionesRecibidas,
		chequesPendientes,
		chequesRecibidosPendientes,
		chequesProximosACobrar,
	] = await Promise.all([
		prisma.facturaEmitida.aggregate({
			where: { fecha: { gte: monthStart, lt: monthEndExclusive } },
			_sum: { montoIva: true, total: true },
			_count: true,
		}),
		prisma.facturaRecibida.aggregate({
			where: { fecha: { gte: monthStart, lt: monthEndExclusive } },
			_sum: { montoIva: true, total: true },
			_count: true,
		}),
		prisma.liquidacionEmitida.aggregate({
			where: { fecha: { gte: monthStart, lt: monthEndExclusive } },
			_sum: { montoIva: true, total: true },
			_count: true,
		}),
		prisma.liquidacionRecibida.aggregate({
			where: { fecha: { gte: monthStart, lt: monthEndExclusive } },
			_sum: { montoIva: true, total: true },
			_count: true,
		}),
		prisma.chequeEmitido.aggregate({
			where: { estado: "PENDIENTE" },
			_sum: { monto: true },
			_count: true,
		}),
		prisma.chequeRecibido.aggregate({
			where: { estado: "PENDIENTE" },
			_sum: { monto: true },
			_count: true,
		}),
		prisma.chequeRecibido.findMany({
			where: {
				estado: "PENDIENTE",
				fechaCobro: { gte: todayStart, lt: tenDaysExclusive },
			},
			select: {
				id: true,
				numeroCheque: true,
				fechaCobro: true,
				monto: true,
				cliente: { select: { razonSocial: true } },
			},
			orderBy: { fechaCobro: "asc" },
			take: 8,
		}),
	]);

	const ivaVenta =
		Number(facturasEmitidas._sum.montoIva || 0) +
		Number(liquidacionesEmitidas._sum.montoIva || 0);

	const ivaCompra =
		Number(facturasRecibidas._sum.montoIva || 0) +
		Number(liquidacionesRecibidas._sum.montoIva || 0);

	return {
		mesActual: `${getMonthName(now.getMonth() + 1)} ${now.getFullYear()}`,
		facturasEmitidas: {
			count: facturasEmitidas._count + liquidacionesEmitidas._count,
			total: Number(facturasEmitidas._sum.total || 0) + Number(liquidacionesEmitidas._sum.total || 0),
		},
		facturasRecibidas: {
			count: facturasRecibidas._count + liquidacionesRecibidas._count,
			total: Number(facturasRecibidas._sum.total || 0) + Number(liquidacionesRecibidas._sum.total || 0),
		},
		ivaVenta,
		ivaCompra,
		posicionIva: ivaVenta - ivaCompra,
		chequesPendientes: {
			count: chequesPendientes._count,
			total: Number(chequesPendientes._sum.monto || 0),
		},
		chequesRecibidos: {
			count: chequesRecibidosPendientes._count,
			total: Number(chequesRecibidosPendientes._sum.monto || 0),
		},
		recordatoriosCheques: chequesProximosACobrar.map((c) => {
			const cobro = new Date(c.fechaCobro);
			const diffMs = cobro.getTime() - todayStart.getTime();
			const diasRestantes = Math.round(diffMs / (1000 * 60 * 60 * 24));
			return {
				id: c.id,
				numeroCheque: c.numeroCheque,
				cliente: c.cliente.razonSocial,
				monto: Number(c.monto),
				fechaCobro: cobro,
				diasRestantes,
			};
		}),
	};
}

export default async function DashboardPage() {
	const data = await getDashboardData();

	const cards = [
		{
			title: "Ventas del Mes",
			value: formatCurrency(data.facturasEmitidas.total),
			description: `${data.facturasEmitidas.count} comprobantes`,
			icon: TrendingUp,
			color: "text-green-600",
			bg: "bg-green-50",
		},
		{
			title: "Compras del Mes",
			value: formatCurrency(data.facturasRecibidas.total),
			description: `${data.facturasRecibidas.count} comprobantes`,
			icon: TrendingDown,
			color: "text-blue-600",
			bg: "bg-blue-50",
		},
		{
			title: "IVA Débito Fiscal",
			value: formatCurrency(data.ivaVenta),
			description: "IVA Venta",
			icon: FileText,
			color: "text-emerald-600",
			bg: "bg-emerald-50",
		},
		{
			title: "IVA Crédito Fiscal",
			value: formatCurrency(data.ivaCompra),
			description: "IVA Compra",
			icon: FileInput,
			color: "text-orange-600",
			bg: "bg-orange-50",
		},
		{
			title: "Posición IVA",
			value: formatCurrency(data.posicionIva),
			description: data.posicionIva >= 0 ? "A pagar" : "A favor",
			icon: DollarSign,
			color: data.posicionIva >= 0 ? "text-red-600" : "text-green-600",
			bg: data.posicionIva >= 0 ? "bg-red-50" : "bg-green-50",
		},
		{
			title: "Cheques a Cubrir",
			value: formatCurrency(data.chequesPendientes.total),
			description: `${data.chequesPendientes.count} cheques pendientes`,
			icon: CreditCard,
			color: "text-purple-600",
			bg: "bg-purple-50",
		},
	];

	return (
		<div className="relative">
			{/* Logo de fondo */}
			<div
				className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center"
				style={{ opacity: 0.05 }}
			>
				<img src="/logo.svg" alt="" className="w-[600px] h-[600px] object-contain" />
			</div>

			<div className="relative z-10">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
					<p className="text-gray-500 dark:text-gray-400 mt-1">
						Resumen de {data.mesActual}
					</p>
				</div>

				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{cards.map((card) => (
						<Card key={card.title}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
									{card.title}
								</CardTitle>
								<div className={`rounded-lg p-2 ${card.bg} dark:bg-opacity-20`}>
									<card.icon className={`h-5 w-5 ${card.color}`} />
								</div>
							</CardHeader>
							<CardContent>
								<div className={`text-2xl font-bold ${card.color}`}>
									{card.value}
								</div>
								<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.description}</p>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Cheques recibidos pendientes */}
				{data.chequesRecibidos.count > 0 && (
					<Card className="mt-6">
						<CardHeader>
							<CardTitle className="text-lg">Cheques Recibidos Pendientes</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-600 dark:text-gray-300">
								Tenés <strong>{data.chequesRecibidos.count}</strong> cheques recibidos pendientes por un total de{" "}
								<strong className="text-green-700 dark:text-green-400">{formatCurrency(data.chequesRecibidos.total)}</strong>
							</p>
						</CardContent>
					</Card>
				)}

				{data.recordatoriosCheques.length > 0 && (
					<Card className="mt-6 border-amber-300 bg-amber-50/60 dark:bg-amber-950/20">
						<CardHeader>
							<CardTitle className="text-lg flex items-center gap-2">
								<BellRing className="h-5 w-5 text-amber-700" />
								Recordatorios de Cheques (Próximos 10 días)
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								{data.recordatoriosCheques.map((c) => (
									<div key={c.id} className="flex items-center justify-between rounded-md border border-amber-200 bg-white/70 p-3 dark:bg-slate-900/40">
										<div>
											<p className="font-medium text-gray-900 dark:text-gray-100">
												{c.cliente} · Cheque {c.numeroCheque}
											</p>
											<p className="text-sm text-gray-600 dark:text-gray-300">
												Cobro: {formatDate(c.fechaCobro.toISOString())} · {c.diasRestantes === 0 ? "Vence hoy" : `Faltan ${c.diasRestantes} días`}
											</p>
										</div>
										<p className="font-semibold text-amber-700 dark:text-amber-300">{formatCurrency(c.monto)}</p>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
