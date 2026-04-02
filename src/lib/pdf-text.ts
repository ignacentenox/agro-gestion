import PDFParser from "pdf2json";

function safeDecodePdfText(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

export async function extractPdfTextFromBuffer(buffer: Buffer): Promise<string> {
	return new Promise((resolve, reject) => {
		const parser = new PDFParser();

		parser.on("pdfParser_dataError", (errData: unknown) => {
			const msg = typeof errData === "object" && errData !== null
				&& "parserError" in errData
				? String((errData as { parserError?: unknown }).parserError)
				: "Error parseando PDF";
			reject(new Error(msg));
		});

		parser.on("pdfParser_dataReady", (pdfData: unknown) => {
			const pages = (pdfData as { Pages?: Array<{ Texts?: Array<{ R?: Array<{ T?: string }> }> }> })?.Pages || [];
			const text = pages
				.map((page) => (page.Texts || [])
					.map((t) => safeDecodePdfText(t.R?.[0]?.T || ""))
					.join(" "))
				.join("\n")
				.trim();
			resolve(text);
		});

		parser.parseBuffer(buffer);
	});
}
