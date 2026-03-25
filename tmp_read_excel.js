const XLSX = require('xlsx');
const wb = XLSX.readFile('/Volumes/POROTO/Users/ALVAROMORES/Documents/Agro Gestion PROD Soja-Maiz 2021 (ultima).xlsx');
console.log('Sheets:', wb.SheetNames);
wb.SheetNames.forEach(name => {
	const ws = wb.Sheets[name];
	const ref = ws['!ref'] || 'A1';
	const range = XLSX.utils.decode_range(ref);
	console.log(name + ': rows=' + (range.e.r + 1) + ' cols=' + (range.e.c + 1));
	const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
	data.slice(0, 8).forEach((r, i) => console.log('  Row ' + i + ':', JSON.stringify(r).substring(0, 250)));
	console.log('---');
});
