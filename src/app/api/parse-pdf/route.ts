import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import PDFParser from "pdf2json";
import { PDFImage } from "pdf-image";
import { createWorker } from "tesseract.js";
import fs from "fs";
import os from "os";
import path, { join } from "path";

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
				const raw = match[1].replace(/\./g, "").replace(",", ".").trim();
				const num = parseFloat(raw);
				return isNaN(num) ? null : num;
			}
		}
		return null;
	}

	result.netoGravado = parseAmountFromLines(/(?:Importe\s+)?Neto\s+Gravado\s*:?\s*\$?\s*([\d.,]+)/i);
	result.netoNoGravado = parseAmountFromLines(/(?:Importe\s+)?(?:No\s+Gravado|Neto\s+No\s+Gravado)\s*:?\s*\$?\s*([\d.,]+)/i) ?? 0;
	result.netoExento = parseAmountFromLines(/(?:Importe\s+)?Exento\s*:?\s*\$?\s*([\d.,]+)/i) ?? 0;

	// IVA por alícuota
	const iva21 = parseAmountFromLines(/IVA\s+21\s*%?\s*:?\s*\$?\s*([\d.,]+)/i);
	const iva105 = parseAmountFromLines(/IVA\s+10[.,]5\s*%?\s*:?\s*\$?\s*([\d.,]+)/i);
	const iva27 = parseAmountFromLines(/IVA\s+27\s*%?\s*:?\s*\$?\s*([\d.,]+)/i);

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
	result.percepcionIva = parseAmountFromLines(/(?:Per\.?\/?Ret\.?\s+(?:de\s+)?IVA|Percepci[oó]n\s+IVA)\s*:?\s*\$?\s*([\d.,]+)/i) ?? 0;
	result.percepcionIIBB = parseAmountFromLines(/(?:Per\.?\/?Ret\.?\s+(?:de\s+)?Ingresos\s+Brutos|Percepci[oó]n\s+IIBB)\s*:?\s*\$?\s*([\d.,]+)/i) ?? 0;
	result.otrosImpuestos = parseAmountFromLines(/(?:Otros\s+Tributos|Impuestos\s+Internos)\s*:?\s*\$?\s*([\d.,]+)/i) ?? 0;

	// Total
	result.total = parseAmountFromLines(/Importe\s+Total\s*:?\s*\$?\s*([\d.,]+)/i);

	// Descripción (línea de detalle de producto)
	for (const line of lines) {
		if (line.match(/^\w.+\d+[.,]\d{2}\s+\w+\s+[\d.,]+/)) {
			const desc = line.split(/\s{2,}/)[0].trim();
			if (desc.length > 3 && !/^(Código|IVA|Per\.|Descripción)/i.test(desc)) {
				result.descripcion = desc.substring(0, 200);
				break;
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
				const val = parseFloat(String(nextCell).replace(/[$.\s]/g, "").replace(",", "."));
				if (!isNaN(val)) result.netoGravado = val;
			}
			if (cellLower === "total" || cellLower.includes("importe total")) {
				const val = parseFloat(String(nextCell).replace(/[$.\s]/g, "").replace(",", "."));
				if (!isNaN(val)) result.total = val;
			}
			if (cellLower.includes("iva") && nextCell.match(/[\d.,]+/)) {
				const val = parseFloat(String(nextCell).replace(/[$.\s]/g, "").replace(",", "."));
				if (!isNaN(val) && val > 0) result.montoIva = val;
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

async function extractTextWithOCR(buffer: Buffer): Promise<string> {
	// Guardar PDF temporalmente
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdfocr-"));
	const pdfPath = path.join(tmpDir, "file.pdf");
	fs.writeFileSync(pdfPath, buffer);

	// Obtener número de páginas usando pdf2json
	const pdfParser = new PDFParser();
	const numPages: number = await new Promise((resolve, reject) => {
		pdfParser.on("pdfParser_dataError", errData => {
			const errorMsg = (errData && typeof errData === 'object' && 'parserError' in errData)
				? (errData as any).parserError?.message || (errData as any).parserError || 'Error al parsear PDF'
				: 'Error al parsear PDF';
			reject(errorMsg);
		});
		pdfParser.on("pdfParser_dataReady", pdfData => {
			const pages = Array.isArray(pdfData?.Pages) ? pdfData.Pages.length : 1;
			resolve(pages);
		});
		pdfParser.parseBuffer(buffer);
	});

	const pdfImage = new PDFImage(pdfPath, { outputDirectory: tmpDir, convertPath: 'magick' });
	let fullText = "";
	let worker: any | null = null;

	try {
		// Configuración del worker de tesseract.js para Node.js
		// @ts-expect-error workerPath no está en los tipos pero sí es soportado en runtime
		worker = await createWorker({
			workerPath: require.resolve("tesseract.js/dist/node/worker.js")
		});

		await worker.load();
		await worker.loadLanguage("spa");
		await worker.initialize("spa");

		for (let i = 0; i < numPages; i++) {
			const imagePath = await pdfImage.convertPage(i);
			const { data: { text } } = await worker.recognize(imagePath);
			fullText += text + "\n";
			fs.unlinkSync(imagePath);
		}

		return fullText;
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		throw new Error(`Error durante el procesamiento OCR: ${message}`);
	} finally {
		if (worker) {
			try {
				await worker.terminate();
			} catch {
				// Ignorar errores al terminar el worker para no ocultar el error principal
			}
		}

		try {
			if (fs.existsSync(pdfPath)) {
				fs.unlinkSync(pdfPath);
			}
		} catch {
			// Ignorar errores de limpieza de archivo
		}

		try {
			if (fs.existsSync(tmpDir)) {
				fs.rmdirSync(tmpDir, { recursive: true });
			}
		} catch {
			// Ignorar errores de limpieza de directorio
		}
	}
}

function detectTipoDocumento(text: string): string {
	const t = text.toLowerCase();
	if (t.includes("e-check") || t.includes("cheque electrónico")) return "e-check";
	if (t.includes("carta de porte")) return "carta de porte";
	if (t.includes("factura") || t.includes("recibo") || t.includes("nota de crédito") || t.includes("nota de débito")) return "comprobante";
	return "desconocido";
}

const VALID_TYPES = [
	"application/pdf",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"application/vnd.ms-excel",
];

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const files = formData.getAll("file").filter(f => f instanceof File) as File[];

		if (!files.length) {
			return NextResponse.json(
				{ error: "Debe enviar al menos un archivo" },
				{ status: 400 }
			);
		}

		const results: Record<string, any[]> = {
			comprobantes: [],
			echecks: [],
			cartasDePorte: [],
			desconocidos: []
		};

		for (const file of files) {
			const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
			const isExcel = [
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				"application/vnd.ms-excel",
			].includes(file.type) ||
				file.name.toLowerCase().endsWith(".xlsx") ||
				file.name.toLowerCase().endsWith(".xls");

			let parsed: Record<string, string | number | null> = {};
			let rawText = "";
			let tipo = "desconocido";
			let error: string | null = null;
			let errorStack: string | null = null;

			try {
				const buffer = Buffer.from(await file.arrayBuffer());
				if (isPdf) {
					// 1. Intentar extraer texto con pdf2json
					const pdfParser = new PDFParser();
					try {
						rawText = await new Promise<string>((resolve, reject) => {
							pdfParser.on("pdfParser_dataError", errData => {
								const errorMsg = (errData && typeof errData === 'object' && 'parserError' in errData)
									? (errData as any).parserError?.message || (errData as any).parserError || 'Error al parsear PDF'
									: 'Error al parsear PDF';
								console.error(`[PDF2JSON][${file.name}] Error:`, errorMsg, errData);
								reject(errorMsg);
							});
							pdfParser.on("pdfParser_dataReady", pdfData => {
								const text = pdfParser.getRawTextContent();
								resolve(text);
							});
							pdfParser.parseBuffer(buffer);
						});
						parsed = parseInvoiceText(rawText);
						if (!rawText.trim() || Object.values(parsed).filter(Boolean).length === 0) {
							// 2. Si no se extrajo texto útil, aplicar OCR
							console.log(`[OCR][${file.name}] Intentando extraer texto con OCR...`);
							rawText = await extractTextWithOCR(buffer);
							parsed = parseInvoiceText(rawText);
						}
					} catch (e: any) {
						console.error(`[PDF2JSON][${file.name}] Falla, se intenta OCR.`, e);
						// Si pdf2json falla, intentar OCR
						try {
							rawText = await extractTextWithOCR(buffer);
							parsed = parseInvoiceText(rawText);
						} catch (ocrErr: any) {
							console.error(`[OCR][${file.name}] Error:`, ocrErr);
							error = ocrErr?.message || "Error desconocido en OCR";
							errorStack = ocrErr?.stack || JSON.stringify(ocrErr);
						}
					}
					tipo = detectTipoDocumento(rawText);
				} else if (isExcel) {
					try {
						parsed = parseExcelInvoice(buffer);
						rawText = "[Archivo Excel procesado]";
						tipo = "comprobante";
					} catch (excelErr: any) {
						console.error(`[EXCEL][${file.name}] Error:`, excelErr);
						error = excelErr?.message || "Error procesando Excel";
						errorStack = excelErr?.stack || JSON.stringify(excelErr);
					}
				} else if (file.name.toLowerCase().endsWith(".xml")) {
					// TODO: parsear XML de e-check
					tipo = "e-check";
					parsed = { xml: "pendiente" };
				} else {
					error = "Tipo de archivo no soportado";
				}
			} catch (e: any) {
				console.error(`[GENERAL][${file.name}] Error:`, e);
				error = e?.message || "Error desconocido";
				errorStack = e?.stack || JSON.stringify(e);
			}

			const result = {
				fileName: file.name,
				type: tipo,
				parsed,
				rawText: rawText.substring(0, 2000),
				error,
				errorStack
			};
			if (tipo === "comprobante") results.comprobantes.push(result);
			else if (tipo === "e-check") results.echecks.push(result);
			else if (tipo === "carta de porte") results.cartasDePorte.push(result);
			else results.desconocidos.push(result);
		}

		return NextResponse.json({ success: true, ...results });
	} catch (error: unknown) {
		const msg = error instanceof Error ? error.message : "Error desconocido";
		console.error("[FATAL][parse-pdf] Error parsing files:", error);
		return NextResponse.json(
			{ error: `Error al procesar los archivos: ${msg}` },
			{ status: 500 }
		);
	}
}

