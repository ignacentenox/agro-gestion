const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const base = '/Volumes/POROTO/Users/ALVAROMORES/Documents/FACTURAS';
const pdfs = fs.readdirSync(base).filter(f => f.endsWith('.pdf') && !f.startsWith('.'));

async function extractFromPDF(filePath) {
	try {
		const data = fs.readFileSync(filePath);
		const parser = new PDFParse({ data });
		const result = await parser.getText();
		const text = result.text;

		// Extract CUIT
		const cuits = text.match(/\b(20|23|24|27|30|33|34)\d{9}\b/g) ||
			text.match(/\b(20|23|24|27|30|33|34)[-\s]?\d{8}[-\s]?\d\b/g) || [];
		const cleanCuits = [...new Set(cuits.map(c => c.replace(/[-\s]/g, '')))];

		// Extract Razon Social
		const razonMatch = text.match(/Raz[oó]n\s+Social\s*:?\s*(.+?)[\r\n]/i);
		const razon = razonMatch ? razonMatch[1].trim() : '';

		// Extract Condicion IVA
		let condIva = '';
		if (text.toLowerCase().includes('responsable inscri')) condIva = 'RI';
		else if (text.toLowerCase().includes('monotributo')) condIva = 'MONO';
		else if (text.toLowerCase().includes('exento')) condIva = 'EXENTO';

		// Extract domicilio
		const domMatch = text.match(/Domicilio\s+Comercial\s*:?\s*(.+?)[\r\n]/i);
		const dom = domMatch ? domMatch[1].trim() : '';

		return { cuits: cleanCuits, razon, condIva, dom, textPreview: text.substring(0, 300) };
	} catch (e) {
		return { error: e.message };
	}
}

async function main() {
	const entities = {};

	for (const pdf of pdfs) {
		const fullPath = path.join(base, pdf);
		console.log('\n=== ' + pdf + ' ===');
		const info = await extractFromPDF(fullPath);
		if (info.error) {
			console.log('  ERROR:', info.error);
			continue;
		}
		console.log('  CUITs:', info.cuits.join(', '));
		console.log('  Razon Social:', info.razon);
		console.log('  Cond IVA:', info.condIva);
		console.log('  Domicilio:', info.dom);
		console.log('  Preview:', info.textPreview.replace(/\n/g, ' ').substring(0, 200));

		info.cuits.forEach(cuit => {
			if (!entities[cuit]) entities[cuit] = { cuit, nombres: new Set(), condIva: info.condIva };
			if (info.razon) entities[cuit].nombres.add(info.razon);
		});
	}

	console.log('\n\n=== RESUMEN ENTIDADES ÚNICAS ===');
	Object.values(entities).forEach(e => {
		console.log(e.cuit + ': ' + [...e.nombres].join(' / ') + ' (' + e.condIva + ')');
	});
}

main();
