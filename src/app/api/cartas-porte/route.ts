import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const estado = searchParams.get("estado");

	const cartas = await prisma.cartaPorte.findMany({
		where: estado ? { estado: estado as never } : {},
		include: { campoOrigen: { select: { nombre: true } } },
		orderBy: { fecha: "desc" },
	});
	return NextResponse.json(cartas);
}

export async function POST(req: Request) {
	const data = await req.json();
	const {
		fecha, campoOrigenId, localidadOrigen, destino, localidadDestino,
		producto, cosecha, pesoBrutoKg, pesoTaraKg,
		transportista, patenteCamion, patenteAcoplado, chofer, ctg, observaciones,
	} = data;

	if (!fecha || !destino || !producto || !pesoBrutoKg || !pesoTaraKg) {
		return NextResponse.json({ error: "Fecha, destino, producto, peso bruto y tara son obligatorios" }, { status: 400 });
	}

	const bruto = Number(pesoBrutoKg);
	const tara = Number(pesoTaraKg);
	const neto = bruto - tara;

	const carta = await prisma.cartaPorte.create({
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
			observaciones: observaciones || null,
			estado: "PENDIENTE",
		},
	});
	return NextResponse.json(carta, { status: 201 });
}
