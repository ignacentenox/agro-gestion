declare module 'pdf-image' {
	export class PDFImage {
		constructor(pdfPath: string, options?: any);
		convertPage(pageNumber: number): Promise<string>;
		convertFile(): Promise<string[]>;
	}
}
