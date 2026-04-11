import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { extractPdfTextFromBuffer } from "@/lib/pdf-text";

function parseAmountLocaleAR(value: string | null | undefined): number | null {
	if (!value) return null;

	let raw = value
		.replace(/\$/g, "")
		.replace(/\s+/g, "")
		.replace(/[^\d.,-]/g, "");

	if (!raw) return null;

	const hasComma = raw.includes(",");
	const dotCount = (raw.match(/\./g) || []).length;

	if (hasComma) {
		// Formato AR típico: 57.460.000,00
		raw = raw.replace(/\./g, "").replace(",", ".");
	} else if (dotCount > 1) {
		// Formato con miles por punto sin decimales explícitos.
		raw = raw.replace(/\./g, "");
	} else if (dotCount === 1) {
		const [entero = "", decimal = ""] = raw.split(".");
		if (decimal.length === 3) {
			// 57.460 -> miles, no decimales.
			raw = `${entero}${decimal}`;
		}
	}

	raw = raw.replace(/[^\d.-]/g, "");
	if (!raw || raw === "-" || raw === ".") return null;

	const num = Number(raw);
	return Number.isFinite(num) ? num : null;
}

// Parsear texto extraído de facturas AFIP argentinas
function parseInvoiceText(text: string) {
	const result: Record<string, string | number | null> = {};

	const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
	const t = lines.join(" ");
	const tLower = t.toLowerCase();

	// --- Tipo de comprobante ---
	const tipoMap: Record<string, string> = {
		"factura a": "FACTURA_A",
		"factura b": "FACTURA_B",
		"factura c": "FACTURA_C",
		"nota de crédito a": "NOTA_CREDITO_A",
		"nota de credito a": "NOTA_CREDITO_A",
		"nota de crédito b": "NOTA_CREDITO_B",
		"nota de credito b": "NOTA_CREDITO_B",
		"nota de crédito c": "NOTA_CREDITO_C",
		"nota de credito c": "NOTA_CREDITO_C",
		"nota de débito a": "NOTA_DEBITO_A",
		"nota de debito a": "NOTA_DEBITO_A",
		"nota de débito b": "NOTA_DEBITO_B",
		"nota de debito b": "NOTA_DEBITO_B",
		"nota de débito c": "NOTA_DEBITO_C",
		"nota de debito c": "NOTA_DEBITO_C",
		"recibo": "RECIBO",
	};
	for (const [key, value] of Object.entries(tipoMap)) {
		if (tLower.includes(key)) {
			result.tipoComprobante = value;
			break;
		}
	}

	// --- Punto de Venta y Número ---
	// Formato AFIP: "Punto de Venta: Comp. Nro:\t00002 00000844"
	for (const line of lines) {
		const pvMatch = line.match(/Punto\s+de\s+Venta.*?Comp.*?N[°ºro]*.*?[\t\s]+(\d{4,5})\s+(\d{5,8})/i) ||
			line.match(/(\d{4,5})\s*[-–]\s*(\d{5,8})/);
		if (pvMatch) {
			result.puntoVenta = parseInt(pvMatch[1], 10);
			result.numero = parseInt(pvMatch[2], 10);
			break;
		}
	}

	// --- Fecha de emisión (primer dd/mm/yyyy encontrado) ---
	for (const line of lines) {
		const fechaMatch = line.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
		if (fechaMatch) {
			const day = fechaMatch[1].padStart(2, "0");
			const month = fechaMatch[2].padStart(2, "0");
			result.fecha = `${fechaMatch[3]}-${month}-${day}`;
			break;
		}
	}
	if (!result.fecha) {
		const fechaMatch2 = t.match(/(?:fecha\s*(?:de)?\s*emisi[oó]n)\s*:?\s*(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/i) ||
			t.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
		if (fechaMatch2) {
			const day = fechaMatch2[1].padStart(2, "0");
			const month = fechaMatch2[2].padStart(2, "0");
			result.fecha = `${fechaMatch2[3]}-${month}-${day}`;
		}
	}

	// --- CUITs y Razón Social (formato AFIP: línea con "CUIT + nombre") ---
	const cuitLines: { cuit: string; razon: string; lineIdx: number }[] = [];
	for (let i = 0; i < lines.length; i++) {
		const m = lines[i].match(/\b((20|23|24|27|30|33|34)\d{9})\b\s*(.*)/);
		if (m) {
			cuitLines.push({ cuit: m[1], razon: m[3].trim(), lineIdx: i });
		}
	}
	if (cuitLines.length >= 2) {
		result.cuitEmisor = cuitLines[0].cuit;
		result.cuitReceptor = cuitLines[1].cuit;
		if (cuitLines[1].razon) {
			result.razonSocial = cuitLines[1].razon;
		}
	} else if (cuitLines.length === 1) {
		result.cuitEmisor = cuitLines[0].cuit;
		if (cuitLines[0].razon) {
			result.razonSocial = cuitLines[0].razon;
		}
	}

	// Si no encontramos razón social en la línea del CUIT, buscar por label
	if (!result.razonSocial) {
		for (let i = 0; i < lines.length; i++) {
			if (/raz[oó]n\s+social/i.test(lines[i]) && lines[i + 1]) {
				const next = lines[i + 1].trim();
				if (next && !/^(CUIT|Domicilio|Condici)/i.test(next)) {
					result.razonSocial = next;
					break;
				}
			}
		}
	}

	// Nombre del emisor (línea después de ORIGINAL/DUPLICADO/TRIPLICADO)
	for (let i = 0; i < lines.length; i++) {
		if (/^(ORIGINAL|DUPLICADO|TRIPLICADO)$/i.test(lines[i]) && lines[i + 1]) {
			result.nombreEmisor = lines[i + 1].trim();
			break;
		}
	}

	// --- Condición frente al IVA ---
	if (tLower.includes("responsable inscri")) {
		result.condicionIva = "RESPONSABLE_INSCRIPTO";
	} else if (tLower.includes("monotributo")) {
		result.condicionIva = "MONOTRIBUTISTA";
	} else if (tLower.includes("exento")) {
		result.condicionIva = "EXENTO";
	} else if (tLower.includes("consumidor final")) {
		result.condicionIva = "CONSUMIDOR_FINAL";
	}

	// --- Importes (formato AFIP lines) ---
	function parseAmountFromLines(pattern: RegExp): number | null {
		for (const line of lines) {
			const match = line.match(pattern);
			if (match) {
				return parseAmountLocaleAR(match[1]);
			}
		}
		return null;
	}

	result.netoGravado = parseAmountFromLines(/(?:Importe\s+)?Neto\s+Gravado\s*:?\s*\$?\s*([\d.,\s]+)/i);
	result.netoNoGravado = parseAmountFromLines(/(?:Importe\s+)?(?:No\s+Gravado|Neto\s+No\s+Gravado)\s*:?\s*\$?\s*([\d.,\s]+)/i) ?? 0;
	result.netoExento = parseAmountFromLines(/(?:Importe\s+)?Exento\s*:?\s*\$?\s*([\d.,\s]+)/i) ?? 0;

	// IVA por alícuota
	const iva21 = parseAmountFromLines(/IVA\s+21\s*%?\s*:?\s*\$?\s*([\d.,\s]+)/i);
	const iva105 = parseAmountFromLines(/IVA\s+10[.,]5\s*%?\s*:?\s*\$?\s*([\d.,\s]+)/i);
	const iva27 = parseAmountFromLines(/IVA\s+27\s*%?\s*:?\s*\$?\s*([\d.,\s]+)/i);

	if (iva21 && iva21 > 0) {
		result.alicuotaIva = 21;
		result.montoIva = iva21;
	} else if (iva105 && iva105 > 0) {
		result.alicuotaIva = 10.5;
		result.montoIva = iva105;
	} else if (iva27 && iva27 > 0) {
		result.alicuotaIva = 27;
		result.montoIva = iva27;
	}

	// Percepciones
	result.percepcionIva = parseAmountFromLines(/(?:Per\.?\/?Ret\.?\s+(?:de\s+)?IVA|Percepci[oó]n\s+IVA)\s*:?\s*\$?\s*([\d.,\s]+)/i) ?? 0;
	result.percepcionIIBB = parseAmountFromLines(/(?:Per\.?\/?Ret\.?\s+(?:de\s+)?Ingresos\s+Brutos|Percepci[oó]n\s+IIBB)\s*:?\s*\$?\s*([\d.,\s]+)/i) ?? 0;
	result.otrosImpuestos = parseAmountFromLines(/(?:Otros\s+Tributos|Impuestos\s+Internos)\s*:?\s*\$?\s*([\d.,\s]+)/i) ?? 0;

	// Total
	result.total = parseAmountFromLines(/Importe\s+Total\s*:?\s*\$?\s*([\d.,\s]+)/i);

	// Fallback por consistencia contable si el PDF no trae total claro.
	if (result.total == null) {
		const computedTotal =
			Number(result.netoGravado || 0) +
			Number(result.netoNoGravado || 0) +
			Number(result.netoExento || 0) +
			Number(result.montoIva || 0) +
			Number(result.percepcionIva || 0) +
			Number(result.percepcionIIBB || 0) +
			Number(result.otrosImpuestos || 0);

		if (computedTotal > 0) {
			result.total = computedTotal;
		}
	}

	// Descripción: priorizar texto del bloque "Producto / Servicio".
	const descFromProductoServicio =
		t.match(/Subtotal\s+c\/?IVA\s+(.+?)\s+\d{1,3}(?:[.,]\d+)?\s+unidades\b/i)?.[1]
		|| t.match(/Producto\s*\/\s*Servicio\s+(.+?)\s+\d{1,3}(?:[.,]\d+)?\s+unidades\b/i)?.[1]
		|| null;

	if (descFromProductoServicio) {
		const cleaned = descFromProductoServicio
			.replace(/\s+/g, " ")
			.replace(/^(C[oó]digo\s+Producto\s*\/\s*Servicio\s*)/i, "")
			.trim();

		if (cleaned.length > 3) {
			result.descripcion = cleaned.substring(0, 220);
		}
	}

	if (!result.descripcion) {
		for (const line of lines) {
			if (line.match(/^\w.+\d+[.,]\d{2}\s+\w+\s+[\d.,]+/)) {
				const desc = line.split(/\s{2,}/)[0].trim();
				if (desc.length > 3 && !/^(C[oó]digo|IVA|Per\.|Descripci[oó]n|Fecha)/i.test(desc)) {
					result.descripcion = desc.substring(0, 220);
					break;
				}
			}
		}
	}

	return result;
}

// Parsear Excel de facturas
function parseExcelInvoice(buffer: Buffer): Record<string, string | number | null> {
	const wb = XLSX.read(buffer, { type: "buffer" });
	const ws = wb.Sheets[wb.SheetNames[0]];
	const data: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

	const result: Record<string, string | number | null> = {};
	const allText = data.flat().join(" ").toLowerCase();

	// Buscar en celdas
	for (const row of data) {
		for (let c = 0; c < row.length; c++) {
			const cell = String(row[c]).trim();
			const cellLower = cell.toLowerCase();
			const nextCell = c + 1 < row.length ? String(row[c + 1]).trim() : "";

			if (cellLower.includes("cuit") && nextCell.match(/\d{11}/)) {
				if (!result.cuitEmisor) result.cuitEmisor = nextCell.replace(/[-\s]/g, "");
				else if (!result.cuitReceptor) result.cuitReceptor = nextCell.replace(/[-\s]/g, "");
			}
			if (cellLower.includes("razón social") || cellLower.includes("razon social")) {
				if (nextCell) result.razonSocial = nextCell;
			}
			if (cellLower.includes("neto gravado") || cellLower === "neto") {
				const val = parseAmountLocaleAR(nextCell);
				if (val != null) result.netoGravado = val;
			}
			if (cellLower === "total" || cellLower.includes("importe total")) {
				const val = parseAmountLocaleAR(nextCell);
				if (val != null) result.total = val;
			}
			if (cellLower.includes("iva") && nextCell.match(/[\d.,]+/)) {
				const val = parseAmountLocaleAR(nextCell);
				if (val != null && val > 0) result.montoIva = val;
			}
		}
	}

	// Tipo de comprobante
	if (allText.includes("factura a")) result.tipoComprobante = "FACTURA_A";
	else if (allText.includes("factura b")) result.tipoComprobante = "FACTURA_B";
	else if (allText.includes("factura c")) result.tipoComprobante = "FACTURA_C";
	else if (allText.includes("proforma")) result.tipoComprobante = "PROFORMA";

	return result;
}

const VALID_TYPES = [
	"application/pdf",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"application/vnd.ms-excel",
];

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get("file") as File | null;

		if (!file) {
			return NextResponse.json(
				{ error: "Debe enviar un archivo" },
				{ status: 400 }
			);
		}

		const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
		const isExcel = VALID_TYPES.includes(file.type) ||
			file.name.toLowerCase().endsWith(".xlsx") ||
			file.name.toLowerCase().endsWith(".xls");

		if (!isPdf && !isExcel) {
			return NextResponse.json(
				{ error: "Solo se permiten archivos PDF o Excel (.xlsx/.xls)" },
				{ status: 400 }
			);
		}

		if (file.size > 10 * 1024 * 1024) {
			return NextResponse.json(
				{ error: "El archivo no puede superar 10MB" },
				{ status: 400 }
			);
		}

		const buffer = Buffer.from(await file.arrayBuffer());
		let parsed: Record<string, string | number | null>;
		let rawText = "";

		if (isPdf) {
			rawText = await extractPdfTextFromBuffer(buffer);
			parsed = parseInvoiceText(rawText);
		} else {
			parsed = parseExcelInvoice(buffer);
			rawText = "[Archivo Excel procesado]";
		}

		return NextResponse.json({
			success: true,
			rawText: rawText.substring(0, 2000),
			parsed,
		});
	} catch (error: unknown) {
		const msg = error instanceof Error ? error.message : "Error desconocido";
		console.error("Error parsing file:", msg);
		return NextResponse.json(
			{ error: `Error al procesar el archivo: ${msg}` },
			{ status: 500 }
		);
	}
}
