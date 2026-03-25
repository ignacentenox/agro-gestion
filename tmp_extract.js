const XLSX = require('xlsx');

// Read the main Excel
const wb = XLSX.readFile('/Volumes/POROTO/Users/ALVAROMORES/Documents/Agro Gestion PROD Soja-Maiz 2021 (ultima).xlsx');

// Extract unique producers from all sheets
const productores = new Set();
['Maiz', 'Soja', 'Sorgo'].forEach(sheetName => {
	const ws = wb.Sheets[sheetName];
	const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
	data.forEach(row => {
		const val = String(row[0] || '').trim();
		if (val && val.includes('-') && !val.startsWith('PRODUCTOR') && val.length > 5) {
			productores.add(val);
		}
	});
});

console.log('=== PRODUCTORES ENCONTRADOS ===');
productores.forEach(p => console.log(p));

// Extract from Cta Cte sheet
const ctaCte = wb.Sheets['Cta Cte'];
const ctaData = XLSX.utils.sheet_to_json(ctaCte, { header: 1, defval: '' });
console.log('\n=== CTA CTE - Primeras 20 filas ===');
ctaData.slice(0, 20).forEach((r, i) => {
	const clean = r.filter(v => v !== '');
	if (clean.length > 0) console.log('Row ' + i + ':', clean.join(' | '));
});

// Look for more data in subfolders
const fs = require('fs');
const path = require('path');
const base = '/Volumes/POROTO/Users/ALVAROMORES/Documents';

console.log('\n=== CARPETAS CLIENTES ===');
['CLIENTE AGROIN', 'CLIENTES ROAGRO', 'CUENTAS CORRIENTES', 'FACTURAS', 'FACTURAS VARIAS', 'SOCIEDAD SAN LUIS', 'SOY AGRO LAND', 'MORES OMAR'].forEach(dir => {
	const full = path.join(base, dir);
	try {
		const files = fs.readdirSync(full).filter(f => !f.startsWith('.'));
		console.log('\n' + dir + '/ (' + files.length + ' archivos):');
		files.forEach(f => console.log('  ' + f));
	} catch (e) {
		console.log(dir + ': ' + e.message);
	}
});
