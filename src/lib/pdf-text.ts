import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";

GlobalWorkerOptions.workerSrc = "";

export async function extractPdfTextFromBuffer(buffer: Buffer): Promise<string> {
	const loadingTask = getDocument({
		data: new Uint8Array(buffer),
		disableWorker: true,
		useWorkerFetch: false,
		isEvalSupported: false,
	});

	const pdf = await loadingTask.promise;
	const pages: string[] = [];

	for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
		const page = await pdf.getPage(pageNum);
		const textContent = await page.getTextContent();
		const pageText = textContent.items
			.map((item) => ("str" in item ? item.str : ""))
			.filter(Boolean)
			.join(" ");
		pages.push(pageText);
	}

	return pages.join("\n");
}
