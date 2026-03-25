const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const data = fs.readFileSync('/Volumes/POROTO/Users/ALVAROMORES/Documents/FACTURAS/CEREALERA PUNTANA 3.pdf');
async function main() {
	const parser = new PDFParse({ data });
	const result = await parser.getText();
	// Show lines with line numbers
	const lines = result.text.split('\n');
	lines.forEach((l, i) => console.log(i + ': ' + JSON.stringify(l)));
}
main();
