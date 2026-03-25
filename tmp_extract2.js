const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read Cta Cte SOYAGRO  
try {
	const wb2 = XLSX.readFile('/Volumes/POROTO/Users/ALVAROMORES/Documents/CUENTAS CORRIENTES/C:C SOYAGRO LAND.xlsx');
	console.log('=== C:C SOYAGRO LAND ===');
	console.log('Sheets:', wb2.SheetNames);
	wb2.SheetNames.slice(0, 3).forEach(name => {
		const ws = wb2.Sheets[name];
		const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
		console.log('\n' + name + ':');
		data.slice(0, 10).forEach((r, i) => {
			const clean = r.filter(v => v !== '');
			if (clean.length > 0) console.log('  Row ' + i + ':', clean.join(' | '));
		});
	});
} catch (e) { console.log('Error CC:', e.message); }

// Extract CUITs and names from the main Excel 
const wb = XLSX.readFile('/Volumes/POROTO/Users/ALVAROMORES/Documents/Agro Gestion PROD Soja-Maiz 2021 (ultima).xlsx');
const ctaCte = wb.Sheets['Cta Cte'];
const ctaData = XLSX.utils.sheet_to_json(ctaCte, { header: 1, defval: '' });

console.log('\n=== DATOS EXTRAÍDOS DEL CTA CTE ===');
// AGROIN: Row 0 name, Row 7 CUIT
console.log('Empresa: AGROIN LAS PIEDRAS Ltda.');
console.log('CUIT: 30-71649703-4');
console.log('Cuenta: AGRO GESTION PROD S.A.S - 12228');

// Search for more CUITs in PDF names
const base = '/Volumes/POROTO/Users/ALVAROMORES/Documents/FACTURAS';
const pdfs = fs.readdirSync(base).filter(f => f.endsWith('.pdf') && !f.startsWith('.'));
console.log('\n=== ENTIDADES DE FACTURAS ===');
const names = new Set();
pdfs.forEach(f => {
	// Extract entity name from filename
	const clean = f.replace('.pdf', '').replace(/\d/g, '').replace(/FAC(TURA)?/gi, '').replace(/MORES O(MAR)?/gi, 'MORES OMAR').trim();
	console.log(f, '->', clean);
});

// Also check Sociedad San Luis
try {
	const wb3 = XLSX.readFile('/Volumes/POROTO/Users/ALVAROMORES/Documents/SOCIEDAD SAN LUIS/CUENTA CORRIENTE CEREALERA.xlsx');
	console.log('\n=== CUENTA CORRIENTE CEREALERA ===');
	const ws3 = wb3.Sheets[wb3.SheetNames[0]];
	const data3 = XLSX.utils.sheet_to_json(ws3, { header: 1, defval: '' });
	data3.slice(0, 10).forEach((r, i) => {
		const clean = r.filter(v => v !== '');
		if (clean.length > 0) console.log('  Row ' + i + ':', clean.join(' | '));
	});
} catch (e) { console.log('Error Cerealera:', e.message); }
