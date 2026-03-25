import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const data = await req.json();
	const {
		fecha, campoOrigenId, localidadOrigen, destino, localidadDestino,
		producto, cosecha, pesoBrutoKg, pesoTaraKg,
		transportista, patenteCamion, patenteAcoplado, chofer, ctg, estado, observaciones,
	} = data;

	const bruto = Number(pesoBrutoKg);
	const tara = Number(pesoTaraKg);
	const neto = bruto - tara;

	const carta = await prisma.cartaPorte.update({
		where: { id },
		data: {
			fecha: new Date(fecha),
			campoOrigenId: campoOrigenId || null,
			localidadOrigen: localidadOrigen || null,
			destino,
			localidadDestino: localidadDestino || null,
			producto,
			cosecha: cosecha || null,
			pesoBrutoKg: bruto,
			pesoTaraKg: tara,
			pesoNetoKg: neto,
			transportista: transportista || null,
			patenteCamion: patenteCamion || null,
			patenteAcoplado: patenteAcoplado || null,
			chofer: chofer || null,
			ctg: ctg || null,
			estado: estado || undefined,
			observaciones: observaciones || null,
		},
	});
	return NextResponse.json(carta);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const { searchParams } = new URL(req.url);
	const permanent = searchParams.get("permanent") === "true";

	if (permanent) {
		const carta = await prisma.cartaPorte.findUnique({ where: { id }, select: { estado: true } });
		if (!carta || (carta.estado !== "CONFIRMADA" && carta.estado !== "ANULADA")) {
			return NextResponse.json({ error: "Solo se pueden eliminar cartas confirmadas o anuladas" }, { status: 400 });
		}
		await prisma.cartaPorte.delete({ where: { id } });
	} else {
		await prisma.cartaPorte.update({ where: { id }, data: { estado: "ANULADA" } });
	}
	return NextResponse.json({ ok: true });
}
