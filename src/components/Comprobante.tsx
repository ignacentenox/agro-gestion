import React from "react";

export default function Comprobante({ factura }: { factura: any }) {
	// Mejor estética: fondo acorde al tema, total destacado
	return (
		<div className="w-[700px] mx-auto bg-gray-50 dark:bg-slate-800 p-10 rounded shadow print:shadow-none print:p-0 print:w-full font-sans transition-colors">
			<div className="text-center mb-6">
				<h1 className="text-2xl font-bold text-purple-800 dark:text-purple-300">Agro Gestión</h1>
				<div className="text-sm text-gray-500 dark:text-gray-300 mt-1">Comprobante</div>
				<div className="text-lg font-semibold mt-2">Factura {factura.tipo} — Nº {factura.numero}</div>
			</div>
			<div className="flex justify-between border-b pb-2 mb-4">
				<div>
					<div className="font-semibold">CLIENTE</div>
					<div>{factura.clienteNombre}</div>
					<div className="text-xs text-gray-500 dark:text-gray-300">CUIT: {factura.clienteCuit}</div>
				</div>
				<div>
					<div className="font-semibold">FECHA</div>
					<div>{factura.fecha}</div>
					<div className="text-xs text-gray-500 dark:text-gray-300">{factura.detalle}</div>
				</div>
			</div>
			<table className="w-full mb-6">
				<thead>
					<tr className="border-b border-gray-300 dark:border-gray-600">
						<th className="text-left py-1">Concepto</th>
						<th className="text-right py-1">Importe</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td className="py-1">Neto Gravado</td>
						<td className="text-right py-1">$ {factura.netoGravado.toLocaleString()}</td>
					</tr>
					<tr>
						<td className="py-1">IVA ({factura.ivaPorcentaje}%)</td>
						<td className="text-right py-1">$ {factura.montoIva.toLocaleString()}</td>
					</tr>
					<tr className="font-bold">
						<td className="py-2 border-t-4 border-purple-700 dark:border-purple-400 bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 rounded-b-md">TOTAL</td>
						<td className="text-right py-2 border-t-4 border-purple-700 dark:border-purple-400 bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 rounded-b-md">$ {factura.total.toLocaleString()}</td>
					</tr>
				</tbody>
			</table>
			<div className="text-xs text-center text-gray-400 dark:text-gray-300 mt-8">
				Agro Gestión — Comprobante de uso interno
			</div>
		</div>
	);
}
