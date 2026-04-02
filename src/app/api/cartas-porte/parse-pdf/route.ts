import { NextRequest, NextResponse } from "next/server";
import { extractPdfTextFromBuffer } from "@/lib/pdf-text";

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
		singleLine.match(/n[°º]?\s*cpe\s*:\s*\d{1,5}-(\d{1,10})/i)?.[1]
		|| singleLine.match(/\b\d{5}-(\d{8})\b/)?.[1]
		|| singleLine.match(/carta\s+de\s+porte[^\d]{0,20}(\d{6,16})/i)?.[1]
		|| singleLine.match(/n[°º]?\s*(?:de\s*)?carta[^\d]{0,20}(\d{6,16})/i)?.[1]
		|| null;

	const fecha = parseDateToISO(
		singleLine.match(/(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4})\s+\d{1,2}:\d{2}\s+fecha\s*:/i)?.[1]
		|| singleLine.match(/fecha\s*:?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4})(?:\s+\d{1,2}:\d{2})?/i)?.[1]
		|| singleLine.match(/fecha\s*(?:de\s*emisi[oó]n)?\s*:?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4})/i)?.[1]
		|| null,
	);

	const destino = (
		singleLine.match(/d\s*-\s*destino\s+de\s+la\s+mercader[ií]a.+?direcci[oó]n\s*:\s*([a-z0-9áéíóúñ\s./-]+?)\s+[a-záéíóúñ\s]+\s+es\s+un\s+campo/i)?.[1]
		|| singleLine.match(/d\s*-\s*destino\s+de\s+la\s+mercader[ií]a.+?localidad\s*:\s*([a-záéíóúñ\s]{3,80})\s+provincia/i)?.[1]
		|| singleLine.match(/destino\s*:\s*(?:\d{11}\s*-\s*)?(.+?)(?=\s+empresa\s+transportista:|\s+[a-z]-\s+grano|\s+c\s*-\s+procedencia|$)/i)?.[1]
		|| singleLine.match(/destino\s*:?\s*([^|\n\r]{3,120})/i)?.[1]
		|| ""
	).trim();

	const localidadDestino = (
		singleLine.match(/d\s*-\s*destino\s+de\s+la\s+mercader[ií]a.+?localidad\s*:\s*([a-záéíóúñ\s]+?)\s+provincia\s*:?\s*([a-záéíóúñ\s]+)/i)?.[1]
		|| singleLine.match(/localidad\s+destino\s*:?\s*([^|\n\r]{3,80})/i)?.[1]
		|| ""
	).trim().toUpperCase();

	const localidadOrigen = (
		singleLine.match(/c\s*-\s*procedencia.+?localidad\s*:\s*([a-záéíóúñ\s]+?)\s+provincia/i)?.[1]
		|| singleLine.match(/localidad\s+origen\s*:?\s*([^|\n\r]{3,80})/i)?.[1]
		|| ""
	).trim().toUpperCase();

	const productoRaw = (
		singleLine.match(/peso\s+neto\s+([a-záéíóúñ]{3,20})\s+([a-záéíóúñ]{3,20})\s+[\d.,]+\s+[\d.,]+\s+[\d.,]+/i)?.[1]
		|| singleLine.match(/grano\s*\/\s*tipo\s*:\s*([a-záéíóúñ\s]{3,40})/i)?.[1]
		|| singleLine.match(/producto\s*:?\s*([^|\n\r]{3,40})/i)?.[1]
		|| ""
	).toUpperCase();

	const productoToken = productoRaw.split(" ").filter(Boolean);
	const productoNormalized = productoToken.length >= 2 && productoToken[0] === productoToken[1]
		? productoToken[0]
		: productoRaw;

	let producto = "SOJA";
	if (productoNormalized.includes("MAI")) producto = "MAIZ";
	else if (productoNormalized.includes("TRIGO")) producto = "TRIGO";
	else if (productoNormalized.includes("SORGO")) producto = "SORGO";
	else if (productoNormalized.includes("GIRASOL")) producto = "GIRASOL";
	else if (productoNormalized.includes("CEBADA")) producto = "CEBADA";
	else if (productoNormalized.includes("SOJA")) producto = "SOJA";
	else if (productoNormalized) producto = "OTRO";

	const pesosCpe = singleLine.match(/peso\s+bruto\s+peso\s+tara\s+peso\s+neto\s+[a-záéíóúñ\s]+\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)/i);
	const pesoBrutoKg = parseNumber(pesosCpe?.[1] || singleLine.match(/peso\s+bruto\s*(?:kg)?\s*:?\s*([\d.,]+)/i)?.[1] || null);
	const pesoTaraKg = parseNumber(pesosCpe?.[2] || singleLine.match(/peso\s+tara\s*(?:kg)?\s*:?\s*([\d.,]+)/i)?.[1] || null);

	const transportista = (
		singleLine.match(/empresa\s+transportista\s*:\s*(?:\d{11}\s*-\s*)?(.+?)(?=\s+\d{11}\s*-\s*|\s+[a-z]-\s+grano|\s+b\s*-\s+grano|$)/i)?.[1]
		|| singleLine.match(/transportista\s*:?\s*([^|\n\r]{3,120})/i)?.[1]
		|| ""
	).trim();

	const chofer = (
		singleLine.match(/chofer\s*:\s*(?:\d{11}\s*-\s*)?(.+?)(?=\s+representante\s+recibidor|\s+intermediario\s+de\s+flete|\s+[a-z]-\s+grano|$)/i)?.[1]
		|| singleLine.match(/chofer\s*:?\s*([^|\n\r]{3,80})/i)?.[1]
		|| ""
	).trim();

	const dominioCpe = singleLine.match(/dominios\s*:\s*(?:kms\.?\s*a\s*recorrer\s*:?\s*partida\s*:)?\s*([a-z0-9]{6,8})\s*-\s*([a-z0-9]{6,8})/i)
		|| singleLine.match(/dominios\s*:\s*.*?([a-z0-9]{6,8})\s*-\s*([a-z0-9]{6,8})/i);
	const patenteCamion = (dominioCpe?.[1] || singleLine.match(/patente\s+cam[ií]on\s*:?\s*([A-Z0-9]{6,10})/i)?.[1] || "").toUpperCase();
	const patenteAcoplado = (dominioCpe?.[2] || singleLine.match(/patente\s+acoplado\s*:?\s*([A-Z0-9]{6,10})/i)?.[1] || "").toUpperCase();
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
