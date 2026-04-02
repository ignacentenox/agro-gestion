import { NextRequest, NextResponse } from "next/server";
import { extractPdfTextFromBuffer } from "../../../../lib/pdf-text";

function parseNumber(value: string | null): number | null {
	if (!value) return null;
	const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.\-]/g, "");
	const n = Number(normalized);
	return Number.isFinite(n) ? n : null;
}

function parseDateToISO(text: string | null): string | null {
	if (!text) return null;
	const m = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
	if (!m) return null;
	const dd = m[1].padStart(2, "0");
	const mm = m[2].padStart(2, "0");
	return `${m[3]}-${mm}-${dd}`;
}

function parseCartaPorteText(text: string) {
	const singleLine = text.replace(/\s+/g, " ");

	const numero =
		singleLine.match(/carta\s+de\s+porte[^\d]{0,20}(\d{6,16})/i)?.[1] ||
		singleLine.match(/n[°º]?\s*(?:de\s*)?carta[^\d]{0,20}(\d{6,16})/i)?.[1] ||
		null;

	const fecha = parseDateToISO(
		singleLine.match(/fecha\s*(?:de\s*emisi[oó]n)?\s*:?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4})/i)?.[1] || null,
	);

	const destino = singleLine.match(/destino\s*:?\s*([^|\n\r]{3,80})/i)?.[1]?.trim() || "";
	const localidadDestino = singleLine.match(/localidad\s+destino\s*:?\s*([^|\n\r]{3,80})/i)?.[1]?.trim() || "";
	const localidadOrigen = singleLine.match(/localidad\s+origen\s*:?\s*([^|\n\r]{3,80})/i)?.[1]?.trim() || "";

	const productoRaw = singleLine.match(/producto\s*:?\s*([^|\n\r]{3,40})/i)?.[1]?.toUpperCase() || "";
	let producto = "SOJA";
	if (productoRaw.includes("MAI")) producto = "MAIZ";
	else if (productoRaw.includes("TRIGO")) producto = "TRIGO";
	else if (productoRaw.includes("SORGO")) producto = "SORGO";
	else if (productoRaw.includes("GIRASOL")) producto = "GIRASOL";
	else if (productoRaw.includes("CEBADA")) producto = "CEBADA";
	else if (productoRaw.includes("SOJA")) producto = "SOJA";
	else if (productoRaw) producto = "OTRO";

	const pesoBrutoKg = parseNumber(singleLine.match(/peso\s+bruto\s*(?:kg)?\s*:?\s*([\d.,]+)/i)?.[1] || null);
	const pesoTaraKg = parseNumber(singleLine.match(/peso\s+tara\s*(?:kg)?\s*:?\s*([\d.,]+)/i)?.[1] || null);

	const transportista = singleLine.match(/transportista\s*:?\s*([^|\n\r]{3,80})/i)?.[1]?.trim() || "";
	const chofer = singleLine.match(/chofer\s*:?\s*([^|\n\r]{3,80})/i)?.[1]?.trim() || "";
	const patenteCamion = singleLine.match(/patente\s+cam[ií]on\s*:?\s*([A-Z0-9]{6,10})/i)?.[1]?.toUpperCase() || "";
	const patenteAcoplado = singleLine.match(/patente\s+acoplado\s*:?\s*([A-Z0-9]{6,10})/i)?.[1]?.toUpperCase() || "";
	const ctg = singleLine.match(/\bCTG\b\s*:?\s*(\d{6,20})/i)?.[1] || "";

	return {
		numero,
		fecha,
		destino,
		localidadDestino,
		localidadOrigen,
		producto,
		pesoBrutoKg,
		pesoTaraKg,
		transportista,
		chofer,
		patenteCamion,
		patenteAcoplado,
		ctg,
	};
}

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get("file") as File | null;

		if (!file) {
			return NextResponse.json({ error: "Debe enviar un archivo" }, { status: 400 });
		}

		const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
		if (!isPdf) {
			return NextResponse.json({ error: "Solo se permiten PDFs" }, { status: 400 });
		}

		const buffer = Buffer.from(await file.arrayBuffer());
		const rawText = await extractPdfTextFromBuffer(buffer);
		const parsed = parseCartaPorteText(rawText);

		return NextResponse.json({
			success: true,
			parsed,
			rawText: rawText.slice(0, 3000),
		});
	} catch (error: unknown) {
		const msg = error instanceof Error ? error.message : "Error desconocido";
		return NextResponse.json({ error: `Error al procesar PDF: ${msg}` }, { status: 500 });
	}
}
