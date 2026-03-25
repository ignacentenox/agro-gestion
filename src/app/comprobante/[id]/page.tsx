import { getFacturaEmitidaById } from "@/lib/facturas";
import Comprobante from "@/components/Comprobante";

export default async function ComprobantePage({ params }: { params: { id: string } }) {
	try {
		if (!params.id || typeof params.id !== "string" || params.id.trim() === "") {
			return <div>ID de comprobante inválido.</div>;
		}
		const factura = await getFacturaEmitidaById(params.id);
		if (!factura) return <div>No se encontró el comprobante.</div>;
		return (
			<div className="print:bg-white print:text-black min-h-screen flex items-center justify-center bg-gray-100">
				<Comprobante factura={factura} />
			</div>
		);
	} catch (e: any) {
		return <div>Error al cargar comprobante: {e.message}</div>;
	}
}
